import { Post as PostData } from "@prisma/client"
import Link from "next/link";
import UserAvatar from "../UserAvatar";
import { formatRelativeDate } from "@/lib/utils";
import { useSession } from "@/app/(main)/SessionProvider";
import PostMoreButton from "./PostMoreButton";

type UserForPost = {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: Date;
    bio: string | null;
    followers: { followerId: string }[];
    _count: { posts: number; followers: number };
};

interface PostProps {
    post: PostData & { user: UserForPost };
}

export default function Post({ post }: PostProps) {
    const { user } = useSession()
    return (
        <article className="group/post space-y-3 rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                    <Link href={`/users/${post.user.username}`}>
                        <UserAvatar avatarUrl={post.user.avatarUrl} className="cursor-pointer" />
                    </Link>
                    <div>
                        <Link href={`/users/${post.user.displayName}`}
                            className="block font-medium hover:underline"
                        >
                            <span>{post.user.username}</span>
                        </Link>
                        <Link
                            href={`/posts/${post.id}`}
                            className="block text-sm text-muted-foreground hover:underline"
                        >
                            {formatRelativeDate(post.createdAt)}
                        </Link>
                    </div>
                </div>
                {post.user.id === user.id && (
                    <PostMoreButton post={post} className="opacity-0 transition-opacity group-hover/post:opacity-100" />
                )}
            </div>
            <div className="whitespace-pre-line break-words">{post.content}</div>
        </article>
    )
}

