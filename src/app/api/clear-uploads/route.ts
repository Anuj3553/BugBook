import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization"); // Get the Authorization header

        // Check if the Authorization header is valid
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { 
            return Response.json(
                { message: "Invalid authorization header" },
                { status: 401 },
            );
        }

        // Find all media that are not associated with a post and were created more than 24 hours ago
        const unusedMedia = await prisma.media.findMany({
            where: {
                postId: null, // If postId is null, the media is not associated with a post
                ...(process.env.NODE_ENV === "production" // If in production, only delete media that are more than 24 hours old
                    ? {
                        createdAt: {
                            lte: new Date(Date.now() - 1000 * 60 * 60 * 24),
                        },
                    }
                    : {}),
            },
            select: {
                id: true, // Select the id of the media
                url: true, // Select the url of the media
            },
        });

        // Delete the files from UploadThing
        new UTApi().deleteFiles( 
            unusedMedia.map(
                (m) =>
                    m.url.split(`/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`)[1],
            ),
        );

        // Delete the media from the database
        await prisma.media.deleteMany({
            where: {
                id: {
                    in: unusedMedia.map((m) => m.id), // Delete the media that were found
                },
            },
        });

        return new Response();
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}