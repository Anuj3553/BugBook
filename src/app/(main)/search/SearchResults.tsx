"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface SearchResultsProps {
    query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
    const {
        data, // The data of the query
        fetchNextPage, // Function to fetch the next page
        hasNextPage, // Whether there is a next page
        isFetching, // Whether the query is fetching
        isFetchingNextPage, // Whether the next page is fetching
        status, // The status of the query
    } = useInfiniteQuery({ // Use an infinite query to fetch the search results
        queryKey: ["post-feed", "search", query], // The query key
        queryFn: ({ pageParam }) => // The query function
            kyInstance // Use the ky instance to make the request
                .get("/api/search", { // Make a GET request to the search API
                    searchParams: {
                        q: query, // Set the search query
                        ...(pageParam ? { cursor: pageParam } : {}), // Set the cursor if it exists
                    },
                })
                .json<PostsPage>(), // Parse the JSON response
        initialPageParam: null as string | null, // The initial page parameter
        getNextPageParam: (lastPage) => lastPage.nextCursor, // Get the next page parameter
        gcTime: 0, // Disable garbage collection
    });

    // Get the posts from the data
    const posts = data?.pages.flatMap((page) => page.posts) || [];

    // Render the search results
    if (status === "pending") {
        return <PostsLoadingSkeleton />; // Show the loading skeleton
    }

    // Show a message if no posts are found
    if (status === "success" && !posts.length && !hasNextPage) {
        return (
            <p className="text-center text-muted-foreground">
                No posts found for this query.
            </p>
        );
    }

    if (status === "error") {
        return (
            <p className="text-center text-destructive">
                An error occurred while loading posts.
            </p>
        );
    }

    return (
        <InfiniteScrollContainer
            className="space-y-5"
            onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()} // Fetch the next page when the bottom is reached
        >
            {posts.map((post) => (
                <Post key={post.id} post={post} />
            ))}
            {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
        </InfiniteScrollContainer>
    );
}