import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Google } from "arctic"; // import the Google class from the Arctic library
import { Lucia, Session, User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "./lib/prisma";

// Create a new Prisma adapter
const adapter = new PrismaAdapter(prisma.session, prisma.user);

// Create a new Lucia instance
export const lucia = new Lucia(adapter, {
  sessionCookie: { // session cookie configuration
    expires: false, // session cookie never expires
    attributes: { // session cookie attributes
      secure: process.env.NODE_ENV === "production", // secure cookie in production
    },
  },
  // Get the user attributes from the database user attributes
  getUserAttributes(databaseUserAttributes) {
    return { // return the user attributes
      id: databaseUserAttributes.id, // user id
      username: databaseUserAttributes.username, // username
      displayName: databaseUserAttributes.displayName, // display name
      avatarUrl: databaseUserAttributes.avatarUrl, // avatar URL
      googleId: databaseUserAttributes.googleId, // Google ID
    };
  },
});

// Extend the Register interface
declare module "lucia" { // declare module for Lucia
  interface Register { // Register interface
    Lucia: typeof lucia; // add the Lucia instance to the Register interface
    DatabaseUserAttributes: DatabaseUserAttributes; // add the DatabaseUserAttributes interface to the Register interface
  }
}

// Database user attributes
interface DatabaseUserAttributes {
  id: string; // user id
  username: string; // username
  displayName: string; // display name
  avatarUrl: string | null; // avatar URL
  googleId: string | null; // Google ID
}

// Google OAuth configuration
export const google = new Google( // create a new Google instance
  process.env.GOOGLE_CLIENT_ID!, // Google client ID
  process.env.GOOGLE_CLIENT_SECRET!, // Google client secret
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`, // Google callback URL
);

// Validate the request
export const validateRequest = cache( // cache the validateRequest function
  async (): Promise< // return a promise
    { user: User; session: Session } | { user: null; session: null } // return the user and session or null
  > => {
    // Get the session ID from the session cookie
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

    // If the session ID does not exist
    if (!sessionId) {
      return { // return the user and session as null
        user: null, // user is null
        session: null, // session is null
      };
    }

    // Validate the session
    const result = await lucia.validateSession(sessionId);

    // If the session is invalid
    try {
      if (result.session && result.session.fresh) { // if the session is fresh and exists
        const sessionCookie = lucia.createSessionCookie(result.session.id); // create a new session cookie
        (await cookies()).set( // set the session cookie
          sessionCookie.name, // session cookie name
          sessionCookie.value, // session cookie value
          sessionCookie.attributes, // session cookie attributes
        );
      }
      if (!result.session) { // if the session does not exist
        const sessionCookie = lucia.createBlankSessionCookie(); // create a blank session cookie
        (await cookies()).set( // set the session cookie
          sessionCookie.name, // session cookie name
          sessionCookie.value, // session cookie value
          sessionCookie.attributes, // session cookie attributes
        );
      }
    } catch { } // catch any errors

    // Return the result
    return result;
  },
);