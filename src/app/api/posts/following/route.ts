import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const cursor = req.nextUrl.searchParams.get('cursor') || undefined;

        const pageSize = 10;

        const { user } = await validateRequest();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the posts from the users that the current user follows
        const posts = await prisma.post.findMany({
            where: {
                user: {
                    followers: {
                        some: {
                            followerId: user.id
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: pageSize + 1,
            cursor: cursor ? { id: cursor } : undefined,
            include: getPostDataInclude(user.id) // Include the user data
        });

        const nextCursor = posts.length > pageSize ? posts[posts.length - 1].id : null;

        const data: PostsPage = {
            posts: posts.slice(0, pageSize),
            nextCursor,
        }

        return Response.json(data);

    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}