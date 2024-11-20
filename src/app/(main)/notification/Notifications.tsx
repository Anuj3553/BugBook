"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { NotificationsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Notification from "./Notification";

// The component to render the notifications
export default function Notifications() {
    const {
        data, // The resolved data
        fetchNextPage, // The function to fetch the next page
        hasNextPage, // Whether or not there is another page available
        isFetching, // Whether or not the query is currently fetching
        isFetchingNextPage, // Whether or not the next page is currently being fetched
        status, // The status of the query
    } = useInfiniteQuery({ // The hook to use infinite queries
        queryKey: ["notifications"], // The key for the query
        queryFn: ({ pageParam }) => // The function to fetch the data
            kyInstance // The ky instance
                .get(
                    "/api/notifications", // The endpoint
                    pageParam ? { searchParams: { cursor: pageParam } } : {}, // The search params for the query
                )
                .json<NotificationsPage>(), // The type of the response
        initialPageParam: null as string | null, // The initial page param
        getNextPageParam: (lastPage) => lastPage.nextCursor, // The function to get the next page param
    });

    // The notifications from the data
    const notifications = data?.pages.flatMap((page) => page.notifications) || [];

    // The JSX to render while loading notifications
    if (status === "pending") {
        return <PostsLoadingSkeleton />;
    }

    // The JSX to render if there are no notifications
    if (status === "success" && !notifications.length && !hasNextPage) {
        return (
            <p className="text-center text-muted-foreground">
                You don&apos;t have any notification yet.
            </p>
        );
    }

    // The JSX to render if an error occurred while loading notifications
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