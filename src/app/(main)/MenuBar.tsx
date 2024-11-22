import { Button } from "@/components/ui/button";
import { Bookmark, Home } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import MessagesButton from "./MessagesButton";
import streamServerClient from "@/lib/stream";

// MenuBarProps interface
interface MenuBarProps {
    className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
    // Validate the request to ensure the user is logged in
    const { user } = await validateRequest();

    // If the user is not logged in, return null
    if (!user) return null;

    // Get the unread notifications count and unread messages count
    const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
        prisma.notification.count({
            where: {
                recipientId: user.id,
                read: false,
            },
        }),
        (await streamServerClient.getUnreadCount(user.id)).total_unread_count,
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
            <MessagesButton initialState={{ unreadCount: unreadMessagesCount }} />
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