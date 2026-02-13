import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar className="fixed left-0 top-0 h-full hidden md:flex z-50" />

            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
