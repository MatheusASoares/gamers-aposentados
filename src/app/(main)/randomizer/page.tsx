import { Metadata } from "next";
import { RandomizerClient } from "@/components/game/RandomizerClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isRandomizerPlayer, getOtherPlayerName } from "@/lib/randomizer-players";

export const metadata: Metadata = {
    title: "Randomizer | Gamers Aposentados",
    description: "Sorteie o próximo jogo da sua backlog",
};

export default async function RandomizerPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const canAddGames = isRandomizerPlayer(session.user.email);
    const otherPlayerName = getOtherPlayerName(session.user.email);

    return (
        <main className="w-full">
            <div className="mx-auto max-w-[1920px] px-6 py-8 md:px-8 lg:px-12">
                <RandomizerClient
                    currentUserId={session.user.id}
                    currentUserName={session.user.name || session.user.username || "Player"}
                    currentUserEmail={session.user.email || ""}
                    canAddGames={canAddGames}
                    otherPlayerName={otherPlayerName}
                />
            </div>
        </main>
    );
}
