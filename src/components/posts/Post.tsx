import { Post as PostData } from "@prisma/client"

interface PostProps {
    post: PostData;
}

export default function Post({ post }: PostProps) {
    return (
        <article>
            {post.content}
        </article>
    )
}

