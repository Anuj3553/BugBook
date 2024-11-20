import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { notificationsInclude, NotificationsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // Get the cursor from the query parameters
        const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

        // The number of notifications to fetch
        const pageSize = 10;

        // Validate the request to ensure the user is logged in
        const { user } = await validateRequest();

        // If the user is not logged in, return an error
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch the notifications
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: user.id // Fetch notifications for the current user
            },
            include: notificationsInclude, // Include the notification data
            orderBy: { createdAt: "desc" }, // Order the notifications by creation date
            take: pageSize + 1, // Fetch one more notification than the page size to determine if there are more notifications
            cursor: cursor ? { id: cursor } : undefined, // Use the cursor to fetch the next page of notifications
        })

        // Determine the next cursor
        const nextCursor = notifications.length > pageSize ? notifications[pageSize].id : null;

        // Return the notifications and the next cursor
        const data: NotificationsPage = {
            notifications: notifications.slice(0, pageSize), // Return only the notifications for the current page
            nextCursor, // Return the next cursor
        }

        // Return the data
        return Response.json(data);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}