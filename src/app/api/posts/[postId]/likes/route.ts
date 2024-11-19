import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params: { postId } }: { params: { postId: string } },
) {
    try {
        const { user: loggedInUser } = await validateRequest();

        if (!loggedInUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the post by the id
        const post = await prisma.post.findUnique({
            where: { id: postId },
            // Include the likes data
            select: {
                likes: {
                    where: {
                        userId: loggedInUser.id // Only select the like if the user liked the post
                    },
                    select: {
                        userId: true // Only select the userId
                    }
                },
                // Select the count of likes
                _count: {
                    select: {
                        likes: true // Select the count of likes
                    }
                }
            }
        })

        // If the post is not found
        if (!post) {
            return Response.json({ error: 'Post not found' }, { status: 404 });
        }

        const data: LikeInfo = {
            likes: post._count.likes,
            isLikedByUser: !!post.likes.length // Check if the user liked the post
        }

        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params: { postId } }: { params: { postId: string } },
) {
    try {
        const { user: loggedInUser } = await validateRequest();

        if (!loggedInUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.like.upsert({
            where: {
                userId_postId: { // Set the composite key for the like which helps to prevent duplicate likes
                    userId: loggedInUser.id, // Set the userId
                    postId // Set the postId
                }
            },
            create: {
                userId: loggedInUser.id, // Set the userId
                postId // Set the postId
            },
            update: {} // No need to update anything
        })

        return new Response(); // Return an empty response

    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params: { postId } }: { params: { postId: string } },
) {
    try {
        const { user: loggedInUser } = await validateRequest();

        if (!loggedInUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.like.deleteMany({
            where: {
                userId: loggedInUser.id, // Set the userId
                postId // Set the postId
            },
        });

        return new Response(); // Return an empty response

    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}