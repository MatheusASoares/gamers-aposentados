import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserLinkProps {
    userId: string;
    name?: string | null;
    username?: string | null;
    className?: string;
}

export function UserLink({ userId, name, username, className }: UserLinkProps) {
    const display = name || username || "Anônimo";

    return (
        <Link
            href={`/profile/${userId}`}
            className={cn("text-white transition-colors hover:text-[#bd0df2] hover:underline", className)}
        >
            {display}
        </Link>
    );
}
