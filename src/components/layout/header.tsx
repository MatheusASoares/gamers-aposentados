import { auth } from "@/auth";
import { Breadcrumbs } from "./breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { User, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthButtons } from "./auth-buttons";

import { MobileNav } from "./mobile-nav";

export async function Header() {
    const session = await auth();
    const user = session?.user;

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-white/5 bg-zinc-950/60 px-6 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <MobileNav />
                <Breadcrumbs />
            </div>

            <div className="flex items-center gap-6">
                {/* User Profile / Auth Actions */}
                <AuthButtons user={user} />
            </div>
        </header>
    );
}
