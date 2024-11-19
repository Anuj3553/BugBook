import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const cursor = req.nextUrl.searchParams.get("cursor") || undefined; // Get the cursor from the query parameters

        const pageSize = 10; // Set the page size

        const { user } = await validateRequest(); // Validate the request

        // Check if the user is authenticated
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch bookmarks
        const bookmarks = await prisma.bookmark.findMany({
            where: {
                userId: user.id, // Find bookmarks by user ID
            },
            include: {
                post: {
                    include: getPostDataInclude(user.id), // Include user's like and bookmark status
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: pageSize + 1, // Fetch one more than the page size to determine if there are more pages
            cursor: cursor ? { id: cursor } : undefined, // Start from the cursor
        });

        const nextCursor =
            bookmarks.length > pageSize ? bookmarks[pageSize].id : null; // Set the next cursor if there are more bookmarks

        const data: PostsPage = {
            posts: bookmarks.slice(0, pageSize).map((bookmark) => bookmark.post), // Return only the post data
            nextCursor, // Return the next cursor
        };

        // Return the posts
        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}