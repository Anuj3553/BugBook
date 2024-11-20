import { Prisma } from "@prisma/client";

// Define the user select properties
export function getUserDataSelect(loggedinUserId: string) {
    // Return the user data select properties
    return {
        id: true, // Select the user ID
        username: true, // Select the username
        displayName: true, // Select the display name
        avatarUrl: true, // Select the avatar URL
        bio: true, // Select the bio
        createdAt: true, // Select the created at date
        // Select the followers if the user is followed by the logged in user
        followers: {
            where: {
                followerId: loggedinUserId,
            },
            select: {
                followerId: true,
            },
        },
        // Select the count of posts and followers
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
        // Select the user data using the getUserDataSelect function with the logged in user ID as an argument
        user: {
            select: getUserDataSelect(loggedinUserId),
        },
        attachments: true,
        // Select the likes if the user liked the post
        likes: {
            where: {
                userId: loggedinUserId,
            },
            select: {
                userId: true,
            },
        },
        // Select the bookmark if the user bookmarked the post
        bookmarks: {
            where: {
                userId: loggedinUserId, // Only select the bookmark if the user bookmarked the post
            },
        },
        // Select the count of likes and comments
        _count: {
            select: {
                likes: true,
                comments: true,
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

// Define the comment data select properties
export function getCommentDataInclude(loggedinUserId: string) {
    return {
        user: {
            select: getUserDataSelect(loggedinUserId), // Select the user data using the getUserDataSelect function with the logged in user ID as an argument
        },
    } satisfies Prisma.CommentInclude; // This is required to satisfy the Prisma.CommentInclude type
}

// Define the CommentData type using Prisma's CommentGetPayload to infer types from the Prisma schema
export type CommentData = Prisma.CommentGetPayload<{
    include: ReturnType<typeof getCommentDataInclude>; // Include the user data
}>;

// Correct the CommentsPage type to directly include comments and previousCursor
export interface CommentsPage {
    comments: CommentData[];
    previousCursor: string | null;
}

// Define the notifications include properties
export const notificationsInclude = {
    issuer: {
        select: {
            username: true,
            displayName: true,
            avatarUrl: true,
        }
    },
    post: {
        select: {
            content: true,
        }
    }
} satisfies Prisma.NotificationInclude; // This is required to satisfy the Prisma.NotificationInclude type

// Define the NotificationData type using Prisma's NotificationGetPayload to infer types from the Prisma schema
export type NotificationData = Prisma.NotificationGetPayload<{
    include: typeof notificationsInclude;
}>;

// Correct the NotificationsPage type to directly include notifications and nextCursor
export interface NotificationsPage {
    notifications: NotificationData[];
    nextCursor: string | null;
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

// Create the NotificationCountInfo interface
export interface NotificationCountInfo {
    unreadCount: number;
}

// Create the MessageCountInfo interface
export interface MessageCountInfo {
    unreadCount: number;
}