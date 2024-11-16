"use client"

import { useToast } from "@/hooks/use-toast";
import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/lib/types";
import { Button } from "./button";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

interface FollowButtonProps {
    userId: string,
    initialState: FollowerInfo
}

export default function FollowButton({
    userId,
    initialState
}: FollowButtonProps) {
    const { toast } = useToast()

    // Get the query client
    const queryClient = useQueryClient()

    // Fetch the follower info
    const { data } = useFollowerInfo(userId, initialState)

    // Define the query key
    const queryKey: QueryKey = ['follower-info', userId]

    // Mutate the follower info
    const { mutate } = useMutation({
        // Define the mutation function
        mutationFn: async () => data.isFollowedByUser
            ? await kyInstance.delete(`/api/users/${userId}/followers`)
            : await kyInstance.post(`/api/users/${userId}/followers`),
        // Invalidate the query on success
        onMutate: async () => {
            // Define the query key
            const queryKey: QueryKey = ['follower-info', userId]

            // Cancel the query to prevent it from updating
            await queryClient.cancelQueries({ queryKey })
            const previousState = queryClient.getQueryData<FollowerInfo>(queryKey)

            // Optimistically update the query data
            queryClient.setQueryData<FollowerInfo>(queryKey, () => ({
                followers: (previousState?.followers || 0) + (data.isFollowedByUser ? -1 : 1),
                isFollowedByUser: !previousState?.isFollowedByUser
            }));

            // Return the previous state
            return { previousState };
        },
        // If the mutation fails, use the context to roll back
        onError(error, variables, context) {
            queryClient.setQueryData(queryKey, context?.previousState)
            console.log(error)
            toast({
                variant: 'destructive',
                description: 'Something went wrong. Please try again.',
            })
        }
    });

    return (
        <Button
            variant={data.isFollowedByUser ? 'secondary' : 'default'}
            onClick={() => mutate()}
        >
            {data.isFollowedByUser ? 'Unfollow' : 'Follow'}
        </Button>
    )
}