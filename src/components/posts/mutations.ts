import { useToast } from "@/hooks/use-toast";
import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { deletePost } from "./actions";
import { PostsPage } from "@/lib/types";

export function useDeletePostMutation() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();

    const mutation = useMutation({
        mutationFn: deletePost,
        onSuccess: async (deletedPost) => {
            const queryFilter: QueryFilters = { queryKey: ["post-feed"] };

            // Cancel ongoing queries related to the "post-feed"
            await queryClient.cancelQueries(queryFilter);

            queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
                queryFilter,
                (oldData) => {
                    const firstPage = oldData?.pages[0];

                    if (firstPage) {
                        return {
                            pageParams: oldData?.pageParams,
                            pages: oldData.pages.map((page) => ({
                                data: {
                                    posts: page.data.posts.filter((post) => post.id !== deletedPost.id),
                                    nextCursor: page.data.nextCursor,
                                },
                            })),
                        };
                    }

                    return oldData; // Preserve old data if no pages are found
                }
            );

            // Show success toast
            toast({
                description: "Post deleted successfully.",
            });

            // Redirect if the current page is the deleted post's page
            if (pathname === `/posts/${deletedPost.id}`) {
                router.push(`/users/${deletedPost.user.username}`);
            }
        },
        onError: (error) => {
            console.error(error);

            // Show error toast
            toast({
                variant: "destructive",
                description: "Failed to delete post. Please try again.",
            });
        },
    });

    return mutation;
}
