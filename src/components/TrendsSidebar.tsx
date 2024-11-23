import { validateRequest } from "@/auth"
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import UserAvatar from "./UserAvatar";
import { unstable_cache } from "next/cache";
import { formatNumber } from "@/lib/utils";
import FollowButton from "./ui/FollowButton";
import UserTooltip from "./UserTooltip";

export default function TrendsSidebar() {
    return (
        <div className="no-scrollbar sticky top-[5.25rem] h-[87vh] overflow-y-auto whitespace-nowrap hidden w-72 flex-none space-y-5 md:block lg:w-80 ">
            <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
                <WhoToFollow />
                <TrendingTopics />
            </Suspense>
        </div>
    )
}

async function WhoToFollow() {
    const { user } = await validateRequest();

    if (!user) return null;

    const usersToFollow = await prisma.user.findMany({
        where: {
            NOT: {
                id: user.id
            },
            followers: {
                none: {
                    followerId: user.id,
                },
            },
        },
        select: getUserDataSelect(user.id),
        take: 5
    });

    return (
        <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
            <div className="text-xl font-bold">Who to follow</div>
            {usersToFollow.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                    <UserTooltip user={user}>
                        <Link
                            href={`/users/${user.username}`}
                            className="flex items-center gap-3"
                        >
                            <UserAvatar avatarUrl={user.avatarUrl} size={1000} className="flex-none" />
                            <div>
                                <p className="line-clamp-1 break-all font-semibold hover:underline">
                                    {user.displayName}
                                </p>
                                <p className="line-clamp-1 break-all">
                                    @{user.username}
                                </p>
                            </div>
                        </Link>
                    </UserTooltip>

                    <FollowButton
                        // The FollowButton component expects a userId prop
                        userId={user.id}
                        // The FollowButton component expects an object with the following shape:
                        initialState={{
                            followers: user._count.followers,
                            isFollowedByUser: user.followers.some(
                                ({ followerId }) => followerId === user.id
                            ),
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

const getTrendingTopics = unstable_cache(
    async () => {
        // Get the top 5 most used hashtags
        const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
            SELECT LOWER(unnest(regexp_matches(content, '#\[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) as count
            FROM posts
            GROUP BY (hashtag)
            ORDER BY count DESC, hashtag ASC
            LIMIT 5 
        `;

        // The result is an array of objects with the following shape:
        return result.map(row => ({
            hashtag: row.hashtag,
            count: Number(row.count)
        }))
    },
    ["trending_topics"], // cache key
    {
        revalidate: 1 * 60, // 1 minute
    },
)

async function TrendingTopics() {
    const trendingTopics = await getTrendingTopics();

    return (
        <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
            <div className="text-xl font-bold">Trending topics</div>
            {trendingTopics.map(({ hashtag, count }) => {
                const title = hashtag.split("#")[1];

                return <Link key={title} href={`/hashtag/${title}`} className="block">
                    <p className="line-clamp-1 break-all font-semibold hover:underline">
                        {hashtag}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {formatNumber(count)} {count === 1 ? "post" : "posts"}
                    </p>
                </Link>
            })}
        </div>
    )
}
