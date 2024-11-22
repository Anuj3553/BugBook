"use server";

import { lucia, validateRequest } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  // Validate the request
  const { session } = await validateRequest();

  // If the session is not found, throw an error
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Invalidate the session
  await lucia.invalidateSession(session.id);

  // Create a new session cookie
  const sessionCookie = lucia.createBlankSessionCookie();

  // Set the session cookie
  (await cookies()).set(
    sessionCookie.name, // the session cookie name
    sessionCookie.value, // the session cookie value
    sessionCookie.attributes, // the session cookie attributes
  );

  // Redirect the user to the login page
  return redirect("/login");
}
