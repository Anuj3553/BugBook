import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NotificationCountInfo } from "@/lib/types";

export async function GET() {
    try {
        // Validate the request to ensure the user is logged in
        const { user } = await validateRequest();

        // If the user is not logged in, return an error
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the unread notification count for the user
        const unreadCount = await prisma.notification.count({
            where: {
                recipientId: user.id, // recipientId is the user ID
                read: false, // read is false
            },
        });

        // Return the unread notification count
        const data: NotificationCountInfo = {
            unreadCount,
        };

        // Return the data
        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}