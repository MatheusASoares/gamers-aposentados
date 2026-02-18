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
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10 w-full">
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
