import { getAvailableYears, getQuestHistoryByYear } from "@/app/lib/history-actions";
import { HistoryClient } from "@/components/history/HistoryClient";
import { auth } from "@/auth";
import { getActiveGuild, getAllGuildsForSelector } from "@/app/lib/guild-actions";

export const metadata = {
    title: "Gamers Aposentados - Quests History",
    description: "Historical registry of completed and dropped quests.",
};

export default async function QuestsHistoryPage({
    searchParams,
}: {
    searchParams?: Promise<{ guildId?: string }>;
}) {
    const session = await auth();
    const currentUserId = session?.user?.id || "";
    const activeGuild = await getActiveGuild();
    const allGuilds = await getAllGuildsForSelector();

    const params = searchParams ? await searchParams : {};
    const selectedGuildId = params.guildId || activeGuild?.id;
    const selectedGuild = allGuilds.find((g) => g.id === selectedGuildId) || activeGuild;

    let availableYears = await getAvailableYears(selectedGuildId);
    
    // Fallback if DB is empty
    if (!availableYears || availableYears.length === 0) {
        availableYears = [new Date().getFullYear()];
    }

    const latestYear = availableYears[0];
    const initialType = "MAIN";
    
    // Fetch initial data for SSR
    const initialData = await getQuestHistoryByYear(latestYear, initialType, selectedGuildId);

    return (
        <div className="flex h-full w-full flex-col font-sans">
            <HistoryClient 
                availableYears={availableYears} 
                initialYear={latestYear} 
                initialData={initialData}
                currentUserId={currentUserId}
                activeGuildId={selectedGuildId}
                activeGuildName={selectedGuild?.name || "Minha Guilda"}
                availableGuilds={allGuilds}
            />
        </div>
    );
}
