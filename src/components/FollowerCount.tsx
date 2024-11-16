"use client"

import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface FollowCountProps {
    userId: string;
    initialState: FollowerInfo;
}

export default function FollowerCount({ userId, initialState }: FollowCountProps) {
    const { data } = useFollowerInfo(userId, initialState);

    return (
        <span>
            Followers: {" "}
            <span className="font-semibold">
                {formatNumber(data.followers)}
            </span>
        </span>
    );
}
