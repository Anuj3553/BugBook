import { validateRequest } from "@/auth"
import prisma from "@/lib/prisma"
import { FollowerInfo } from "@/lib/types"

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;

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
        const { user: loggedinUser } = await validateRequest()

        // If the user is not logged in, return an error
        if (!loggedinUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Create a new follow record and a new notification record
        await prisma.$transaction([
            prisma.follow.upsert({ // upsert is used to create a new record if it doesn't exist
                where: {
                    // Find the follow record by the follower ID and the following ID
                    followerId_followingId: {
                        followerId: loggedinUser.id,
                        followingId: userId
                    }
                },
                // If the follow record is not found, create a new record
                create: {
                    followerId: loggedinUser.id,
                    followingId: userId
                },
                // If the follow record is found, update the record
                update: {}
            }),
            // Create a new notification record
            prisma.notification.create({
                data: {
                    issuerId: loggedinUser.id, // The user who followed
                    recipientId: loggedinUser.id, // The user who was followed
                    type: 'FOLLOW',// The type of the notification
                }
            })
        ])

        return new Response();
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;

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

        // Delete the follow record and the notification record
        await prisma.$transaction([
            prisma.follow.deleteMany({
                where: {
                    followerId: loggedinUser.id, // The user who followed
                    followingId: userId // The user who was followed
                }
            }),
            // Delete the notification record
            prisma.notification.deleteMany({
                where: {
                    issuerId: loggedinUser.id, // The user who followed
                    recipientId: userId, // The user who was followed
                    type: 'FOLLOW' // The type of the notification
                }
            })
        ])

        return new Response();
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}