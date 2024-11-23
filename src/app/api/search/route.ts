import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // Get the query string parameters
        const q = req.nextUrl.searchParams.get("q") || "";
        // Get the cursor parameter from the query string
        const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

        // Replace spaces with & to make the search query
        const searchQuery = q.split(" ").join(" & ");

        // Number of posts to fetch
        const pageSize = 10;

        // Validate the request
        const { user } = await validateRequest();

        // If the user is not authenticated, return an error
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 }); // Unauthorized
        }

        // Fetch posts from the database
        const posts = await prisma.post.findMany({
            where: { // Search for posts that contain the search query in the content, username, or display name
                OR: [ // Search in the content, username, and display name
                    {
                        content: {
                            search: searchQuery, // Search for the search query in the content
                        },
                    },
                    {
                        user: { // Search for the search query in the username
                            displayName: {
                                search: searchQuery, // Search for the search query in the display name
                            },
                        },
                    },
                    {
                        user: {
                            username: {
                                search: searchQuery, // Search for the search query in the username
                            },
                        },
                    },
                ],
            },
            include: getPostDataInclude(user.id), // Include the post data
            orderBy: { createdAt: "desc" }, // Order by the creation date in descending order
            take: pageSize + 1, // Fetch one more post than the page size to check if there are more posts
            cursor: cursor ? { id: cursor } : undefined, // Use the cursor to fetch the next page of posts
        });

        // Get the next cursor
        const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

        // Return the posts and the next cursor
        const data: PostsPage = {
            posts: posts.slice(0, pageSize), // Return only the page size number of posts
            nextCursor, // Return the next cursor
        };

        // Return the posts
        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}