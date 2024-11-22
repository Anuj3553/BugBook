"use server"

import { loginSchema, LoginValues } from "@/lib/validation"
import { isRedirectError } from "next/dist/client/components/redirect"
import { verify } from "@node-rs/argon2"
import { lucia } from "@/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma"

export async function login(
    credentials: LoginValues
): Promise<{ error: string }> {
    try {
        // Parse the login values
        const { username, password } = loginSchema.parse(credentials)

        // Find the user by username
        const existingUser = await prisma.user.findFirst({ // findFirst means find the first user that matches the query
            where: { // where the username is equal to the username
                username: {
                    equals: username, // the username
                    mode: "insensitive" // case insensitive
                }
            }
        })

        // If the user does not exist or the user does not have a password hash
        if (!existingUser || !existingUser.passwordHash) {
            return { 
                error: "Invalid username or password"
            }
        }

        // Verify the password
        const validPassword = await verify(existingUser.passwordHash, password, {
            memoryCost: 19456, // 128MB
            timeCost: 2, // 2 iterations
            outputLen: 32, // 32 bytes
            parallelism: 1 // 1 thread
        })

        // If the password is invalid
        if (!validPassword) {
            return {
                error: "Invalid username or password"
            }
        }

        // Create a new session
        const session = await lucia.createSession(existingUser.id, {});
        // Create a new session cookie
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
        console.error(error)
        return {
            error: "Something went wrong. Please try again."
        }
    }
}