import { Button } from "@/components/ui/button";
import { Bookmark, Home, Mail } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

// MenuBarProps interface
interface MenuBarProps {
    className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
    // Validate the request to ensure the user is logged in
    const { user } = await validateRequest();

    // If the user is not logged in, return null
    if (!user) return null;

    // Get the unread notifications count
    const [unreadNotificationsCount] = await Promise.all([ // Promise.all to run multiple promises concurrently
        prisma.notification.count({ // count the notifications
            where: { 
                recipientId: user.id, // recipientId is the user ID
                read: false, // read is false
            },
        }),
    ]);

    return (
        <div className={className}>
            {/* Home */}
            <Button
                variant={'ghost'}
                className="flex items-center justify-start gap-3"
                title="Home"
                asChild
            >
                <Link href="/">
                    <Home />
                    <span className="hidden lg:inline">Home</span>
                </Link>
            </Button>
            {/* Notification */}
            <NotificationsButton
                initialState={{ unreadCount: unreadNotificationsCount }} // initialState is the initial state of the notifications
            />
            {/* Messages */}
            <Button
                variant={'ghost'}
                className="flex items-center justify-start gap-3"
                title="Messages"
                asChild
            >
                <Link href="/messages">
                    <Mail />
                    <span className="hidden lg:inline">Messages</span>
                </Link>
            </Button>
            {/* Bookmarks */}
            <Button
                variant={'ghost'}
                className="flex items-center justify-start gap-3"
                title="Bookmarks"
                asChild
            >
                <Link href="/bookmarks">
                    <Bookmark />
                    <span className="hidden lg:inline">Bookmarks</span>
                </Link>
            </Button>
        </div>
    );
}