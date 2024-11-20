import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ postId: string }> }) {
    const params = await props.params;

    const {
        postId
    } = params;

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

export async function POST(req: NextRequest, props: { params: Promise<{ postId: string }> }) {
    const params = await props.params;

    const {
        postId
    } = params;

    try {
        const { user: loggedInUser } = await validateRequest();

        if (!loggedInUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the post by the id
        const post = await prisma.post.findUnique({
            where: { id: postId }, // Find the post by the id
            select: {
                userId: true // Select the id
            }
        })

        // If the post is not found
        if (!post) {
            return Response.json({ error: 'Post not found' }, { status: 404 });
        }

        // Transaction to like the post and create a notification if the user liked someone else's post
        await prisma.$transaction([
            prisma.like.upsert({
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
            }),
            // Create a notification if the user liked someone else's post
            ...(loggedInUser.id !== post.userId ?
                [prisma.notification.create({
                    data: {
                        issuerId: loggedInUser.id, // Set the issuerId
                        recipientId: post.userId, // Set the recipientId
                        postId, // Set the postId
                        type: 'LIKE' // Set the type of the notification
                    }
                })]
                : [] // If the user liked their own post, don't create a notification
            )
        ])

        return new Response(); // Return an empty response

    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ postId: string }> }) {
    const params = await props.params;

    const {
        postId
    } = params;

    try {
        const { user: loggedInUser } = await validateRequest();

        if (!loggedInUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the post by the id
        const post = await prisma.post.findUnique({
            where: { id: postId }, // Find the post by the id
            select: {
                userId: true // Select the id
            }
        })

        // If the post is not found
        if (!post) {
            return Response.json({ error: 'Post not found' }, { status: 404 });
        }

        // Transaction to delete the like
        await prisma.$transaction([
            prisma.like.deleteMany({
                where: {
                    userId: loggedInUser.id, // Set the userId
                    postId // Set the postId
                },
            }),
            // Delete the notification if the user unliked someone else's post
            prisma.notification.deleteMany({
                where: {
                    issuerId: loggedInUser.id, // Set the issuerId
                    recipientId: post.userId, // Set the recipientId
                    postId, // Set the postId
                    type: 'LIKE' // Set the type of the notification
                }
            })
        ])

        return new Response(); // Return an empty response

    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}