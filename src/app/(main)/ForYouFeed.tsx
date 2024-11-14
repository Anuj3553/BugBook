"use client"

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import kyInstance from "@/lib/ky";

export default function ForYouFeed() {

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ["post-feed", "for-you"],
        queryFn: async ({ pageParam }) => {
            const response = await kyInstance.get(
                "/api/posts/for-you",
                pageParam ? { searchParams: { cursor: pageParam } } : {}
            );
            return response.json<PostsPage>();
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor
    });

    // Collect all posts from each page
    const posts = data?.pages?.reduce((acc, page) => {
        if (page.data?.posts && Array.isArray(page.data.posts)) {
            acc.push(...page.data.posts); // Spread posts from each page
        }
        return acc;
    }, [] as typeof data.pages[0]["data"]["posts"]) || [];

    if (status === "pending") {
        return <Loader2 className="mx-auto animate-spin" />;
    }

    if (status === "error") {
        return <p className="text-center text-destructive">
            An error occurred while loading posts.
        </p>;
    }

    return (
        <InfiniteScrollContainer
            className="space-y-5"
            onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
        >
            {posts.map((post) => (
                <Post key={post.id} post={post} />
            ))}
            {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
        </InfiniteScrollContainer>
    );
}
