import { useToast } from "@/hooks/use-toast";
import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPost } from "./actions";
import { PostsPage } from "@/lib/types";

export function useSubmitPostMutation() {
    const { toast } = useToast();

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: submitPost, // The mutation function (submitPost) should be defined in actions
        onSuccess: async (newPost) => {
            const queryFilter: QueryFilters = { queryKey: ["post-feed", "for-you"] };

            await queryClient.cancelQueries(queryFilter)

            // Option 1: Update the query data directly but Faster than Option 2
            queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
                queryFilter,
                (oldData) => {
                    const firstPage = oldData?.pages[0];

                    if (firstPage) {
                        return {
                            pageParams: oldData?.pageParams,
                            pages: [
                                {
                                    data: {
                                        posts: [newPost, ...firstPage.data.posts],
                                        nextCursor: firstPage.data.nextCursor,
                                    },
                                },
                                ...oldData.pages.slice(1)
                            ],
                        };
                    }
                },
            );

            // Option 2: Invalidate the query to refetch the data but Slower than Option 1
            // queryClient.invalidateQueries(queryFilter);

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
