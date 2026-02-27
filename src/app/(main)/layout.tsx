import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-background flex min-h-screen">
            <Sidebar className="fixed top-0 left-0 z-50 hidden h-full md:flex" />

            <div className="flex min-h-screen flex-1 flex-col md:ml-64">
                <Header />
                <main className="mx-auto w-full max-w-[1600px] flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
