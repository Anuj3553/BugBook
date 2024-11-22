"use client";

import { Button } from "@/components/ui/button";
import kyInstance from "@/lib/ky";
import { MessageCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import Link from "next/link";

// Messages button component props
interface MessagesButtonProps {
    initialState: MessageCountInfo;
}

// Messages button component
export default function MessagesButton({ initialState }: MessagesButtonProps) {
    const { data } = useQuery({ // useQuery is used to fetch data
        queryKey: ["unread-messages-count"], // the query key
        queryFn: () => // the query function
            kyInstance.get("/api/messages/unread-count").json<MessageCountInfo>(), // get the unread count
        initialData: initialState, // the initial data
        refetchInterval: 60 * 1000, // the refetch interval
    });

    return (
        <Button
            variant="ghost"
            className="flex items-center justify-start gap-3"
            title="Messages"
            asChild
        >
            <Link href="/messages">
                <div className="relative">
                    <Mail />
                    {!!data.unreadCount && ( // if the unread count exists
                        <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
                            {data.unreadCount}
                        </span>
                    )}
                </div>
                <span className="hidden lg:inline">Messages</span>
            </Link>
        </Button>
    );
}