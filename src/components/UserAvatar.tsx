import Image from "next/image"
import avatarPlaceholder from "@/assets/avatar-placeholder.png"
import { cn } from "@/lib/utils"

interface useAvatarProps {
    avatarUrl: string | null | undefined
    size?: number
    className?: string
}

export default function UserAvatar({
    avatarUrl,
    size,
    className
}: useAvatarProps) {
    return <Image
        src={avatarUrl || avatarPlaceholder}
        alt="User avatar"
        width={size ?? 500}
        height={size ?? 500}
        className={cn("aspect-square w-[48px] h-[48px]  flex-none rounded-full bg-secondary object-cover", className)}
    />
}