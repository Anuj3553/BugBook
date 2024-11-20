import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { notificationsInclude, NotificationsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // Get the cursor from the query string
        const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

        // Set the page size
        const pageSize = 10;

        // Validate the request to ensure the user is logged in
        const { user } = await validateRequest();

        // If the user is not logged in, return an error
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the notifications for the user
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: user.id, // Find notifications where the recipient ID is the user's ID
            },
            include: notificationsInclude, // Include the issuer and post
            orderBy: { createdAt: "desc" }, // Order the notifications by createdAt in descending order
            take: pageSize + 1, // Take the page size + 1 to check if there are more notifications
            cursor: cursor ? { id: cursor } : undefined, // Set the cursor
        });

        // Get the next cursor
        const nextCursor = notifications.length > pageSize ? notifications[pageSize].id : null;

        // Return the notifications and the next cursor
        const data: NotificationsPage = {
            notifications: notifications.slice(0, pageSize),
            nextCursor,
        };

        // Return the data
        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}