import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function PATCH() {
    try {
        // Validate the request to ensure the user is logged in
        const { user } = await validateRequest();

        // If the user is not logged in, return an error
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Mark all notifications as read for the user
        await prisma.notification.updateMany({
            where: {
                recipientId: user.id, // recipientId is the user ID
                read: false, // read is false
            },
            data: {
                read: true, // set read to true
            },
        });

        // Return a success response
        return new Response();
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}