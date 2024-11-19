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
        attachments: true,
        likes: {
            where: {
                userId: loggedinUserId,
            },
            select: {
                userId: true,
            },
        },
        bookmarks: {
            where: {
                userId: loggedinUserId, // Only select the bookmark if the user bookmarked the post
            },
        },
        _count: {
            select: {
                likes: true,
            },
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

// Create the FollowerInfo interface
export interface FollowerInfo {
    followers: number,
    isFollowedByUser: boolean;
}

// Create the LikeInfo interface
export interface LikeInfo {
    likes: number,
    isLikedByUser: boolean;
}

// Create the BookmarkInfo interface
export interface BookmarkInfo {
    isBookmarkedByUser: boolean;
}