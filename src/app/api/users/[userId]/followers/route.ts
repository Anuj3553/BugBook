import { validateRequest } from "@/auth"
import prisma from "@/lib/prisma"
import { FollowerInfo } from "@/lib/types"

export async function GET(
    req: Request,
    { params: { userId } }: { params: { userId: string } }
) {
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

export async function POST(
    req: Request,
    { params: { userId } }: { params: { userId: string } }
) {
    try {
        // Validate the request to ensure the user is logged in
        const { user: loggedinUser } = await validateRequest()

        // If the user is not logged in, return an error
        if (!loggedinUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.follow.upsert({ // upsert is used to create a new record if it doesn't exist
            where: {
                followerId_followingId: {
                    followerId: loggedinUser.id,
                    followingId: userId
                }
            },
            create: {
                followerId: loggedinUser.id,
                followingId: userId
            },
            update: {}
        })

        return new Response();
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params: { userId } }: { params: { userId: string } }
) {
    try {
        // Validate the request to ensure the user is logged in
        const { user: loggedinUser } = await validateRequest()

        // If the user is not logged in, return an error
        if (!loggedinUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.follow.deleteMany({
            where: {
                followerId: loggedinUser.id,
                followingId: userId
            }
        })

        return new Response();
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}