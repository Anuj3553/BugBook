import { Media, Post as PostData } from "@prisma/client"
import Link from "next/link";
import UserAvatar from "../UserAvatar";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useSession } from "@/app/(main)/SessionProvider";
import PostMoreButton from "./PostMoreButton";
import Linkify from "../ui/Linkify";
import UserTooltip from "../UserTooltip";
import Image from "next/image";

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
    post: PostData & { user: UserForPost } & { attachments: Media[] };
}

export default function Post({ post }: PostProps) {
    const { user } = useSession()
    return (
        <article className="group/post space-y-3 rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                    <UserTooltip user={post.user}>
                        <Link href={`/users/${post.user.username}`}>
                            <UserAvatar avatarUrl={post.user.avatarUrl} size={1000} className="cursor-pointer" />
                        </Link>
                    </UserTooltip>
                    <div>
                        <UserTooltip user={post.user}>
                            <Link href={`/users/${post.user.username}`}
                                className="block font-medium hover:underline"
                            >
                                <span>{post.user.username}</span>
                            </Link>
                        </UserTooltip>
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
            <Linkify>
                <div className="whitespace-pre-line break-words">{post.content}</div>
            </Linkify>
            {/* Check if there are any attachments */}
            {!!post.attachments.length && (
                <MediaPreviews attachments={post.attachments} />
            )}
        </article>
    )
}

interface MediaPreviewsProps {
    attachments: Media[]
}

function MediaPreviews({ attachments }: MediaPreviewsProps) {
    return (
        <div className={cn("flex flex-col gap-3", attachments.length > 1 && "sm:grid sm:grid-cols-2")}>
            {attachments.map(media => (
                <MediaPreview key={media.id} media={media} />
            ))}
        </div>
    );
}

interface MediaPreviewProps {
    media: Media
}

function MediaPreview({ media }: MediaPreviewProps) {
    if (media.type === "IMAGE") {
        return (
            <Image
                src={media.url}
                alt="Attachment"
                width={500}
                height={500}
                className="mx-auto size-fit max-h-[30rem] rounded-2xl"
            />
        );
    }
    if (media.type === "VIDEO") {
        return (
            <div>
                <video
                    src={media.url}
                    controls
                    className="mx-auto size-fit max-h-[30rem] rounded-2xl"
                />
            </div>
        )
    }

    return <p className="text-destructive">Unsupported media type</p>
}
