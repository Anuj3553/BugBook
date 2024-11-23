import { google, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    // Get the authorization code and state from the query parameters
    const code = req.nextUrl.searchParams.get("code");
    // Get the state from the query parameters
    const state = req.nextUrl.searchParams.get("state");

    // Get the stored state and code verifier from the cookies
    const storedState = (await cookies()).get("state")?.value;
    // Get the stored code verifier from the cookies
    const storedCodeVerifier = (await cookies()).get("code_verifier")?.value;

    // Check if the code, state, stored state, and stored code verifier are valid
    if (
        !code || // check if the code is not valid
        !state || // check if the state is not valid
        !storedState || // check if the stored state is not valid
        !storedCodeVerifier || // check if the stored code verifier is not valid
        state !== storedState // check if the state is not equal to the stored state
    ) {
        return new Response(null, { status: 400 }); // return a 400 Bad Request response
    }

    try {
        // Validate the authorization code
        const tokens = await google.validateAuthorizationCode(
            code, // authorization code
            storedCodeVerifier, // code verifier
        );

        // Get the user information from Google
        const googleUser = await kyInstance // make a request to the Google API
            .get("https://www.googleapis.com/oauth2/v1/userinfo", { // Google user information endpoint
                headers: {
                    Authorization: `Bearer ${tokens.accessToken()}`, // access token
                },
            })
            .json<{ id: string; name: string }>(); // parse the JSON response

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                googleId: googleUser.id, // Google ID
            },
        });

        // Check if the user already exists
        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, {}); // create a new session
            const sessionCookie = lucia.createSessionCookie(session.id); // create a new session cookie
            (await cookies()).set( // set the session cookie
                sessionCookie.name, // session cookie name
                sessionCookie.value, // session cookie value
                sessionCookie.attributes, // session cookie attributes
            );
            // Redirect to the home page
            return new Response(null, {
                status: 302, // redirect status
                headers: {
                    Location: "/", // redirect to the home page
                },
            });
        }

        // Generate a new user ID from the entropy size of 10 bytes (e.g., 1234567890)
        const userId = generateIdFromEntropySize(10);

        // Generate a username from the Google user name and user ID (e.g., john-doe-1234)
        const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

        // Create a new user
        await prisma.$transaction(async (tx) => { // create a new transaction
            await tx.user.create({ // create a new user
                data: { // user data
                    id: userId, // user ID
                    username, // username
                    displayName: googleUser.name, // display name
                    googleId: googleUser.id, // Google ID
                    passwordHash: "", // Add a default or generated password hash
                },
            });
            await streamServerClient.upsertUser({ // upsert the user
                id: userId, // user ID
                username, // username
                name: username, // name
            });
        });

        // Create a new session
        const session = await lucia.createSession(userId, {});
        // Create a new session cookie
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set( // set the session cookie
            sessionCookie.name, // session cookie name
            sessionCookie.value, // session cookie value
            sessionCookie.attributes, // session cookie attributes
        );

        // Redirect to the home page
        return new Response(null, {
            status: 302, // redirect status
            headers: {
                Location: "/", // redirect to the home page
            },
        });
    } catch (error) {
        console.error(error);
        if (error instanceof OAuth2RequestError) { // check if the error is an OAuth2 request error
            return new Response(null, { // return a response
                status: 400, // return a 400 Bad Request response
            });
        }
        // Return a 500 Internal Server Error response
        return new Response(null, {
            status: 500,
        });
    }
}