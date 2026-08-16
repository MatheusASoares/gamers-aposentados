import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
        <div className="bg-background flex min-h-screen">
            <Sidebar className="fixed top-0 left-0 z-50 hidden h-full md:flex" />

            <div className="flex min-h-screen flex-1 flex-col md:ml-64">
                <Header />
                <main className="mx-auto w-full max-w-[1600px] flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>

            <LevelUpCelebrationListener
                userLevel={userLevel}
                userId={session?.user?.id}
                userTheme={userTheme}
            />
        </div>
    );
}
