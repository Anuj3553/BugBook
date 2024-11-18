import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const fileRouter = {
    // define the avatar upload route
    avatar: f({
        image: { maxFileSize: "512KB" }
    })
        // add a middleware to validate the user
        .middleware(async () => {
            const { user } = await validateRequest();

            if (!user) {
                throw new UploadThingError("Unauthorized");
            }

            return { user };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // get the user from the metadata
            const oldAvatarUrl = metadata.user.avatarUrl;

            // delete the old avatar
            if (oldAvatarUrl) {
                const key = oldAvatarUrl.split(
                    `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`
                )[1]

                await new UTApi().deleteFiles(key)
            }

            // update the user with the new avatar
            const newAvatarUrl = file.url.replace(
                "/f/",
                `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
            );

            // update the user with the new avatar
            await prisma.user.update({
                where: { id: metadata.user.id },
                data: {
                    avatarUrl: newAvatarUrl,
                },
            });

            return { avatarUrl: newAvatarUrl };
        }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;