import { Prisma } from "@prisma/client";

// Define the user select properties
export function getUserDataSelect(loggedinUserId: string) {
    return {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        followers: {
            where: {
                followerId: loggedinUserId,
            },
            select: {
                followerId: true,
            },
        },
        _count: {
            select: {
                posts: true,
                followers: true,
            },
        },
    } satisfies Prisma.UserSelect; // This is required to satisfy the Prisma.UserSelect type
}

export type UserData = Prisma.UserGetPayload<{
    select: ReturnType<typeof getUserDataSelect>;
}>;

export function getPostDataInclude(loggedinUserId: string) {
    return {
        user: {
            select: getUserDataSelect(loggedinUserId),
        },
    } satisfies Prisma.PostInclude;
}


// Create the PostData type using Prisma's PostGetPayload to infer types from the Prisma schema
export type PostData = Prisma.PostGetPayload<{
    include: ReturnType<typeof getPostDataInclude>;
}>;

// Correct the PostsPage type to directly include posts and nextCursor
export interface PostsPage {
    posts: PostData[]; // Array of post data
    nextCursor: string | null; // Pagination cursor for the next page
}

// Define the user select properties
export interface FollowerInfo {
    followers: number,
    isFollowedByUser: boolean;
}