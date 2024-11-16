"use client"

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import kyInstance from "@/lib/ky";
import PostsLoadingSkelton from "@/components/posts/PostsLoadingSkelton";

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
        queryFn: ({ pageParam }) =>
            kyInstance.get(
                "/api/posts/for-you",
                pageParam ? { searchParams: { cursor: pageParam } } : {}
            ).json<PostsPage>(),
        initialPageParam: null as string | null,
        // @ts-expect-error: TypeScript cannot infer the type of lastPage
        getNextPageParam: (lastPage) => lastPage?.data?.nextCursor
    });

    // @ts-expect-error: TypeScript cannot infer the type of lastPage
    const posts = data?.pages?.flatMap((page) => page?.data.posts ?? []) || [];

    if (status === "pending") {
        return <PostsLoadingSkelton />;
    }

    if (status === "success" && !posts.length && !hasNextPage) {
        return <p className="text-center text-muted-foreground">
            No one has posted anything yet.
        </p>;
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
