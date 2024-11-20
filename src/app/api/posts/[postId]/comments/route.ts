import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { CommentsPage, getCommentDataInclude } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ postId: string }> }) {
    const params = await props.params;

    const {
        postId
    } = params;

    try {
        // Get the cursor from the query string
        const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

        // Number of comments to fetch
        const pageSize = 5;

        // Validate the request
        const { user } = await validateRequest();

        // Check if the user is authenticated
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch the comments
        const comments = await prisma.comment.findMany({
            where: { postId }, // Filter by post ID
            include: getCommentDataInclude(user.id), // Include user data
            orderBy: { createdAt: "asc" }, // Order by creation date
            take: -pageSize - 1, // Fetch one more than the page size
            cursor: cursor ? { id: cursor } : undefined, // Start from the cursor
        });

        const previousCursor = comments.length > pageSize ? comments[0].id : null; // Get the previous cursor

        // Return the comments page data with the previous cursor if available 
        const data: CommentsPage = {
            comments: comments.length > pageSize ? comments.slice(1) : comments, // Remove the extra comment
            previousCursor, // Return the previous cursor
        };

        // Return the comments
        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}