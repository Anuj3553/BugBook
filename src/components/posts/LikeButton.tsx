import { LikeInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { QueryKey, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
    postId: string;
    initialState: LikeInfo
}

export default function LikeButton({ postId, initialState }: LikeButtonProps) {
    const { toast } = useToast();

    const queryClient = useQueryClient();

    const queryKey: QueryKey = ['like-info', postId]; // The query key for the like info

    const { data } = useQuery({
        queryKey: ['like-info', postId],
        queryFn: async () => kyInstance.get(`/api/posts/${postId}/likes`).json<LikeInfo>(),
        initialData: initialState,
        staleTime: Infinity,
    });

    const { mutate } = useMutation({
        mutationFn: () => data.isLikedByUser
            ? kyInstance.delete(`/api/posts/${postId}/likes`)
            : kyInstance.post(`/api/posts/${postId}/likes`),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey }); // Cancel the query to
            const previousState = queryClient.getQueryData<LikeInfo>(queryKey); // Get the previous state
            queryClient.setQueryData<LikeInfo>(queryKey, () => ({
                likes:
                    (previousState?.likes || 0) +
                    (previousState?.isLikedByUser ? -1 : 1),
                isLikedByUser: !previousState?.isLikedByUser,
            }));

            return { previousState };
        },
        // If the mutation fails, use the context to roll back
        onError(error, variables, context) {
            queryClient.setQueryData(queryKey, context?.previousState)
            console.log(error)
            toast({
                variant: 'destructive',
                description: 'Something went wrong. Please try again.',
            });
        },
    });

    return (
        <button onClick={() => mutate()} className="flex items-center gap-2">
            <Heart className={cn("size-5", data.isLikedByUser && "fill-red-500 text-red-500")} />
            {/* Add the tabular-nums class for better alignment so that the number of likes doesn't jump around */}
            <span className="text-sm font-medium tabular-nums">
                {data.likes} <span className="hidden sm:inline">likes</span> 
            </span>
        </button>
    )
}