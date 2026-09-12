import { auth } from "@/auth";
import { cookies } from "next/headers";
import { Breadcrumbs } from "./breadcrumbs";
import { AuthButtons } from "./auth-buttons";
import { AppLogo } from "./app-logo";
import { GuildSwitcher } from "@/components/guild/GuildSwitcher";
import { getActiveGuild, getUserGuilds } from "@/app/lib/guild-actions";

export async function Header() {
    const session = await auth();
    const user = session?.user;
    const cookieStore = await cookies();
    const equippedTheme = cookieStore.get("gp_theme")?.value || session?.user?.equipped_theme || "cyberpunk";

    const [activeGuild, userGuilds] = user
        ? await Promise.all([getActiveGuild(), getUserGuilds()])
        : [null, []];

    return (
        <header className="sticky top-0 z-[60] flex h-16 w-full items-center justify-between border-b border-theme bg-theme-card px-3 sm:px-4 md:px-6 backdrop-blur-md transition-colors duration-400 select-none gap-2">
            {/* Desktop Left: Breadcrumbs + GuildSwitcher */}
            <div className="hidden items-center gap-4 md:flex min-w-0">
                <Breadcrumbs />
                {user && (
                    <div className="border-l border-zinc-800/80 pl-4">
                        <GuildSwitcher activeGuild={activeGuild} userGuilds={userGuilds} />
                    </div>
                )}
            </div>

            {/* Mobile: Compact Logo + Flexible Centered GuildSwitcher */}
            <div className="flex flex-1 items-center justify-between gap-2 min-w-0 md:hidden">
                <AppLogo theme={equippedTheme} variant="compact" />
                {user && (
                    <div className="flex-1 min-w-0 flex items-center justify-center px-1">
                        <GuildSwitcher activeGuild={activeGuild} userGuilds={userGuilds} />
                    </div>
                )}
            </div>

            {/* Right Controls: User Profile / Auth */}
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
                <AuthButtons user={user} />
            </div>
        </header>
    );
}

