import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";

export async function GET(req: Request, props: { params: Promise<{ username: string }> }) {
    const params = await props.params;

    const {
        username
    } = params;

    try {
        const { user: loggedInUser } = await validateRequest();

        if (!loggedInUser) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findFirst({
            where: {
                // Find the user by their username
                username: {
                    equals: username, // equals means the value must be exactly equal to the provided value
                    mode: "insensitive", // insensitive means the search is case-insensitive
                },
            },
            select: getUserDataSelect(loggedInUser.id), // getUserDataSelect is a function that returns a Prisma select object
        })

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json(user);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}