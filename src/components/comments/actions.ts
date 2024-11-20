"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, PostData } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";

// This function is used to submit a comment
export async function submitComment({
    post,
    content,
}: {
    post: PostData;
    content: string;
}) {
    // Validate the request to ensure the user is logged in
    const { user } = await validateRequest();

    // If the user is not logged in, return an error
    if (!user) throw new Error("Unauthorized");

    // Validate the content of the comment
    const { content: contentValidated } = createCommentSchema.parse({ content });

    // Create a new comment
    const [newComment] = await prisma.$transaction([ // $transaction is used to run multiple queries in a single transaction
        // Create a new comment
        prisma.comment.create({
            data: {
                content: contentValidated, // The content of the comment
                postId: post.id, // The id of the post
                userId: user.id, // The id of the user
            },
            include: getCommentDataInclude(user.id), // Include the comment data 
        }),
        ...(post.userId !== user.id
            ? [
                // Create a new notification record
                prisma.notification.create({
                    data: {
                        issuerId: user.id, // The user who submitted the comment
                        recipientId: post.userId, // The user who owns the post
                        type: "COMMENT", // The type of the notification
                    },
                }),
            ] : [] // If the user commented on their own post, don't create a notification
        )
    ]);

    // Return the new comment
    return newComment;
}

export async function deleteComment(id: string) {
    const { user } = await validateRequest();

    if (!user) throw new Error("Unauthorized");

    const comment = await prisma.comment.findUnique({
        where: { id },
    });

    if (!comment) throw new Error("Comment not found");

    if (comment.userId !== user.id) throw new Error("Unauthorized");

    const deletedComment = await prisma.comment.delete({
        where: { id },
        include: getCommentDataInclude(user.id),
    });

    return deletedComment;
}