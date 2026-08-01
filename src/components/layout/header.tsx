import { auth } from "@/auth";
import { Breadcrumbs } from "./breadcrumbs";
import { AuthButtons } from "./auth-buttons";

import { MobileNav } from "./mobile-nav";

export async function Header() {
    const session = await auth();
    const user = session?.user;

    return (
        <header className="sticky top-0 z-[60] flex h-16 w-full items-center justify-between border-b border-theme bg-theme-card px-6 backdrop-blur-md transition-colors duration-400 select-none cursor-default">
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
