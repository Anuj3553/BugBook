import { validateRequest } from "@/auth"
import prisma from "@/lib/prisma"
import { FollowerInfo } from "@/lib/types"

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
    // Get the request parameters
    const params = await props.params;

    // Get the user ID from the request parameters
    const {
        userId
    } = params;

    try {
        // Validate the request to ensure the user is logged in
        const { user: loggedinUser } = await validateRequest()

        // If the user is not logged in, return an error
        if (!loggedinUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user by ID and select the followers count and the follower ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                followers: {
                    where: {
                        followerId: loggedinUser.id
                    },
                    select: {
                        followerId: true
                    }
                },
                _count: {
                    select: {
                        followers: true
                    }
                }
            }
        })

        // If the user is not found, return an error
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 })
        }

        // Return the follower info
        const data: FollowerInfo = {
            followers: user._count.followers,
            isFollowedByUser: !!user.followers.length // two boolean excalamation is used to convert to boolean
        }

        return Response.json({ data })

    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;

    const {
        userId
    } = params;

    try {
        // Validate the request to ensure the user is logged in
        const { user: loggedInUser } = await validateRequest(); // The logged in user

        // If the user is not logged in
        if (!loggedInUser) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Create a new follow record and a new notification record
        await prisma.$transaction([ // Use a transaction to ensure both queries are executed
            prisma.follow.upsert({ // Upsert the follow record
                where: { // Find the follow record by the follower ID and the following ID
                    followerId_followingId: { // The compound unique key
                        followerId: loggedInUser.id, // The logged in user ID
                        followingId: userId, // The user ID
                    },
                },
                create: {
                    followerId: loggedInUser.id, // The logged in user ID
                    followingId: userId, // The user ID
                },
                update: {}, // No update operation
            }),
            prisma.notification.create({ // Create a new notification record
                data: { // Set the notification data
                    issuerId: loggedInUser.id, // The logged in user ID
                    recipientId: userId, // The user ID
                    type: "FOLLOW", // The type of the notification
                },
            }),
        ]);

        return new Response();
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;

    // Get the user ID from the request parameters
    const {
        userId
    } = params;

    try {
        // Validate the request to ensure the user is logged in
        const { user: loggedInUser } = await validateRequest();

        // If the user is not logged in
        if (!loggedInUser) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete the follow record and the notification record
        await prisma.$transaction([ // Use a transaction to ensure both queries are executed
            prisma.follow.deleteMany({ // Delete the follow record
                where: { // Find the follow record by the follower ID and the following ID
                    followerId: loggedInUser.id, // The logged in user ID
                    followingId: userId, // The user ID
                },
            }),
            prisma.notification.deleteMany({
                where: { // Find the notification record by the issuer ID and the recipient ID
                    issuerId: loggedInUser.id, // The logged in user ID
                    recipientId: userId, // The user ID
                    type: "FOLLOW", // The type of the notification
                },
            }),
        ]);

        // Return an empty response
        return new Response();
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}