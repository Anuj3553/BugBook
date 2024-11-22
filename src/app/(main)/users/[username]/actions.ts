"use server"

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { getUserDataSelect } from "@/lib/types";
import { updateUserProfileSchema, UpdateUserProfileValues } from "@/lib/validation";

export async function updateUserProfile(values: UpdateUserProfileValues) {
    // Validate the request
    const validatedValues = updateUserProfileSchema.parse(values);

    // Get the user from the request
    const { user } = await validateRequest();

    // If the user is not found, throw an error
    if (!user) throw new Error("Unauthorized");

    // Update the user in the database
    const updatedUser = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({ // update the user in the database
            where: { id: user.id }, // find the user by id
            data: validatedValues, // set the user's data to the validated values
            select: getUserDataSelect(user.id), // select the user's data
        });
        await streamServerClient.partialUpdateUser({ // update the user on the stream server
            id: user.id, // find the user by id
            set: { // set the user's name
                name: validatedValues.displayName
            }
        })
        return updatedUser; // return the updated user
    });

    return updatedUser; // return the updated user
}