import { getAvailableYears, getQuestHistoryByYear } from "@/app/lib/history-actions";
import { HistoryClient } from "@/components/history/HistoryClient";
import { auth } from "@/auth";

export const metadata = {
    title: "Gamers Aposentados - Quests History",
    description: "Historical registry of completed and dropped quests.",
};

export default async function QuestsHistoryPage() {
    const session = await auth();
    const currentUserId = session?.user?.id || "";

    let availableYears = await getAvailableYears();
    
    // Fallback if DB is empty
    if (!availableYears || availableYears.length === 0) {
        availableYears = [new Date().getFullYear()];
    }

    const latestYear = availableYears[0];
    const initialType = "MAIN";
    
    // Fetch initial data for SSR
    const initialData = await getQuestHistoryByYear(latestYear, initialType);

    return (
        <div className="flex h-full w-full flex-col font-sans">
            <HistoryClient 
                availableYears={availableYears} 
                initialYear={latestYear} 
                initialData={initialData}
                currentUserId={currentUserId}
            />
        </div>
    );
}
