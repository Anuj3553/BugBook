"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { signupSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Server action to sign up a user
export async function signUp(
  credentials: SignUpValues, // The sign up values
): Promise<{ error: string }> {
  try {
    // Parse the sign up values
    const { username, email, password } = signupSchema.parse(credentials);

    // Hash the password
    const passwordHash = await hash(password, {
      memoryCost: 19456, // 128MB
      timeCost: 2, // 2 iterations
      outputLen: 32, // 32 bytes
      parallelism: 1, // 1 thread
    });

    const userId = generateIdFromEntropySize(10); // Generate a user id

    const existingUser = await prisma.user.findFirst({ // find the user by username
      where: { // where the username is equal to the username
        username: {
          equals: username, // the username
          mode: "insensitive", // case insensitive
        },
      },
    });

    if (existingUser) { // if the user exists
      return {
        error: "Username is already taken",
      };
    }

    // Find the user by email
    const existingEmail = await prisma.user.findFirst({
      where: { // where the email is equal to the email
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // If the email is already taken
    if (existingEmail) {
      return {
        error: "Email is already taken", // return an error
      };
    }

    // Create the user through a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.create({ // create the user
        data: { // with the following data
          id: userId, // the user id
          username, // the username
          displayName: username, // the display name
          email, // the email
          passwordHash, // the password hash
        },
      });
      await streamServerClient.upsertUser({ // upsert the user on the stream server
        id: userId, // the user id
        username, // the username
        name: username, // the display name
      });
    })

    // Create a session for the user
    const session = await lucia.createSession(userId, {});
    // Create a session cookie
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set( // set the session cookie
      sessionCookie.name, // the session cookie name
      sessionCookie.value, // the session cookie value
      sessionCookie.attributes, // the session cookie attributes
    );

    // Redirect the user to the home page
    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return { error: "Something went wrong. Please try again" };
  }
}
