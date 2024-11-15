import { Prisma } from "@prisma/client";

// Define the user select properties
export const userDataSelect = {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
} satisfies Prisma.UserSelect;

// Define the post include properties, including the user data
export const postDataInclude = {
    user: {
        select: userDataSelect, // Select user data for each post
    },
} satisfies Prisma.PostInclude;

// Create the PostData type using Prisma's PostGetPayload to infer types from the Prisma schema
export type PostData = Prisma.PostGetPayload<{
    include: typeof postDataInclude;
}>;

// Correct the PostsPage type to directly include posts and nextCursor
export interface PostsPage {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    posts: PostData[]; // Array of post data
    nextCursor: string | null; // Pagination cursor for the next page
}
