import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ReactNode } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LevelUpCelebrationListener } from "@/components/gamification/LevelUpCelebrationListener";

export default async function MainLayout({ children }: { children: ReactNode }) {
    const session = await auth();
    let userLevel = 1;
    let userTheme = "cyberpunk";

    if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { level: true, equipped_theme: true },
        });
        if (dbUser) {
            userLevel = dbUser.level;
            userTheme = dbUser.equipped_theme || "cyberpunk";
        }
    }

    return (
        <div className="bg-background flex min-h-screen w-full overflow-x-hidden">
            {/* Desktop Sidebar (100% inalterada, fixa e visível a partir de md:) */}
            <Sidebar className="fixed top-0 left-0 z-50 hidden h-full md:flex" />

            <div className="flex min-h-screen flex-1 flex-col min-w-0 w-full overflow-x-hidden md:ml-64">
                <Header />
                <main className="w-full flex-1 overflow-x-hidden p-2 sm:p-4 pb-24 md:p-0 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar (Visível exclusivamente no mobile < md) */}
            <BottomNav />

            <LevelUpCelebrationListener
                userLevel={userLevel}
                userId={session?.user?.id}
                userTheme={userTheme}
            />
        </div>
    );
}

