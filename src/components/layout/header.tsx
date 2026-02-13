import { auth } from "@/auth";
import { Breadcrumbs } from "./breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { User, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // I need to check if I have Avatar component, probably not. I'll check after writing.

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

                {/* User Profile */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium leading-none">{user?.name || "Guest"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Pro Player</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                        {user?.image ? (
                            <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
