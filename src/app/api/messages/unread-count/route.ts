import { validateRequest } from "@/auth";
import streamServerClient from "@/lib/stream";
import { MessageCountInfo } from "@/lib/types";

// Get the unread message count
export async function GET() {
    try {
        // Validate the request
        const { user } = await validateRequest();

        // If the user is not found, return an error
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the unread message count
        const { total_unread_count } = await streamServerClient.getUnreadCount( // get the unread count
            user.id, // the user id
        );

        // Return the unread message count
        const data: MessageCountInfo = {
            unreadCount: total_unread_count, // the total unread count
        };

        // Return the data
        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}