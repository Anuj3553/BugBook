"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, PostData } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";

// Submit a comment
export async function submitComment({
    post,
    content,
}: {
    post: PostData;
    content: string;
}) {
    // Validate the request to ensure the user is logged in
    const { user } = await validateRequest();

    // If the user is not logged in, throw an error
    if (!user) throw new Error("Unauthorized");

    // Validate the content of the comment
    const { content: contentValidated } = createCommentSchema.parse({ content });

    // Create the new comment
    const [newComment] = await prisma.$transaction([ // $transaction is used to run multiple queries in a single transaction
        prisma.comment.create({ // create a new comment
            data: { // data to be inserted
                content: contentValidated, // content of the comment
                postId: post.id, // post ID
                userId: user.id, // user ID
            },
            include: getCommentDataInclude(user.id), // include the user and post
        }),
        ...(post.user.id !== user.id // if the post user is not the same as the user
            ? [
                prisma.notification.create({ // create a new notification
                    data: { // data to be inserted
                        issuerId: user.id, // user ID
                        recipientId: post.user.id, // post user ID
                        postId: post.id, // post ID
                        type: "COMMENT", // type of the notification
                    },
                }),
            ]
            : []), // if the post user is the same as the user, do nothing
    ]);

    // Return the new comment
    return newComment;
}

// Update a comment
export async function deleteComment(id: string) {
    // Validate the request to ensure the user is logged in
    const { user } = await validateRequest();

    // If the user is not logged in, throw an error
    if (!user) throw new Error("Unauthorized");

    // Find the comment by ID
    const comment = await prisma.comment.findUnique({
        where: { id }, // find the comment by ID
    });

    // If the comment is not found, throw an error
    if (!comment) throw new Error("Comment not found");

    // If the user is not the author of the comment, throw an error
    if (comment.userId !== user.id) throw new Error("Unauthorized");

    // Delete the comment
    const deletedComment = await prisma.comment.delete({
        where: { id },
        include: getCommentDataInclude(user.id),
    });

    // Return the deleted comment
    return deletedComment;
}