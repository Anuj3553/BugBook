"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { NotificationsPage } from "@/lib/types";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import Notification from "./Notification";

// Notifications component
export default function Notifications() {
    const {
        data, // data is the notifications data
        fetchNextPage, // fetchNextPage is a function to fetch the next page of notifications
        hasNextPage, // hasNextPage is a boolean to check if there is a next page
        isFetching, // isFetching is a boolean to check if the notifications are being fetched
        isFetchingNextPage, // isFetchingNextPage is a boolean to check if the next page is being fetched
        status, // status is the status of the notifications query
    } = useInfiniteQuery({
        queryKey: ["notifications"], // queryKey is the key for the query
        queryFn: ({ pageParam }) => // queryFn is the function to fetch the notifications
            kyInstance
                .get(
                    "/api/notifications",
                    pageParam ? { searchParams: { cursor: pageParam } } : {}, // If there is a pageParam, set the cursor
                )
                .json<NotificationsPage>(),// json<NotificationsPage>() is the type of the response
        initialPageParam: null as string | null, // initialPageParam is the initial pageParam
        getNextPageParam: (lastPage) => lastPage.nextCursor, // getNextPageParam is the function to get the next pageParam
    });

    const queryClient = useQueryClient(); // queryClient is the query client

    const { mutate } = useMutation({ // mutate is the mutation function
        mutationFn: () => kyInstance.patch("/api/notifications/mark-as-read"), // mutationFn is the function to mark notifications as read
        onSuccess: () => { // onSuccess is the function to run on success
            queryClient.setQueryData(["unread-notification-count"], { // setQueryData to update the unread notification count
                unreadCount: 0, // set the unreadCount to 0
            });
        },
        // onError is the function to run on error
        onError(error) {
            console.error("Failed to mark notifications as read", error);
        },
    });

    // useEffect to call mutate on mount
    useEffect(() => {
        mutate(); // Call mutate
    }, [mutate]); // Call mutate on mount

    const notifications = data?.pages.flatMap((page) => page.notifications) || []; // notifications is the flatMap of the notifications

    // Return the notifications
    if (status === "pending") {
        return <PostsLoadingSkeleton />;
    }

    // Return the notifications
    if (status === "success" && !notifications.length && !hasNextPage) {
        return (
            <p className="text-center text-muted-foreground">
                You don&apos;t have any notifications yet.
            </p>
        );
    }

    // Return the notifications
    if (status === "error") {
        return (
            <p className="text-center text-destructive">
                An error occurred while loading notifications.
            </p>
        );
    }

    return (
        <InfiniteScrollContainer
            className="space-y-5"
            onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
        >
            {notifications.map((notification) => (
                <Notification key={notification.id} notification={notification} />
            ))}
            {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
        </InfiniteScrollContainer>
    );
}