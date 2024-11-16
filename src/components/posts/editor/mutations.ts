import { useToast } from "@/hooks/use-toast";
import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPost } from "./actions";
import { PostsPage } from "@/lib/types";
import { useSession } from "@/app/(main)/SessionProvider";


export function useSubmitPostMutation() {
    const { toast } = useToast();

    const queryClient = useQueryClient();

    const { user } = useSession();

    const mutation = useMutation({
        mutationFn: submitPost, // The mutation function (submitPost) should be defined in actions
        onSuccess: async (newPost) => {
            const queryFilter = {
                queryKey: ["post-feed"],
                predicate(query) {
                    return (
                        query.queryKey.includes("for-you") ||
                        (query.queryKey.includes("user-posts") &&
                            query.queryKey.includes(user?.id))
                    )
                }
            } satisfies QueryFilters;

            await queryClient.cancelQueries(queryFilter)

            // Option 1: Update the query data directly but Faster than Option 2
            queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
                queryFilter,
                // @ts-expect-error: TypeScript cannot infer the type of lastPage
                (oldData) => {
                    const firstPage = oldData?.pages[0];

                    if (firstPage) {
                        return {
                            pageParams: oldData?.pageParams,
                            pages: [
                                {
                                    data: {
                                        // @ts-expect-error: TypeScript cannot infer the type of lastPage
                                        posts: [newPost, ...firstPage.data.posts],
                                        // @ts-expect-error: TypeScript cannot infer the type of lastPage
                                        nextCursor: firstPage.data.nextCursor,
                                    },
                                },
                                ...oldData.pages.slice(1)
                            ],
                        };
                    }
                },
            );

            queryClient.invalidateQueries({
                queryKey: queryFilter.queryKey,
                predicate(query) {
                    return queryFilter.predicate(query) && !query.state.data;
                },
            });

            toast({
                description: "Post created successfully.",
            })
        },
        onError: (error) => {
            console.error(error);

            toast({
                variant: "destructive",
                description: "Failed to post. Please try again.",
            });
        },
    });

    return mutation;
}
