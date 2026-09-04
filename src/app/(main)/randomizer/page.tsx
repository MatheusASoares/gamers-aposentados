import { Metadata } from "next";
import { RandomizerClient } from "@/components/game/RandomizerClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isGuildMaster } from "@/lib/permissions";
import { getActiveGuild } from "@/app/lib/guild-actions";

export const metadata: Metadata = {
    title: "Randomizer | Gamers Aposentados",
    description: "Sorteie o próximo jogo da sua backlog proporcionalmente entre os membros da guilda.",
};

export default async function RandomizerPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const activeGuild = await getActiveGuild();
    const isMaster = isGuildMaster(session.user);
    const isGuildActiveMember = activeGuild
        ? activeGuild.members.some((m) => m.userId === session.user.id && m.isActive)
        : isMaster;

    const canAddGames = isGuildActiveMember || isMaster;
    const isLeader = activeGuild?.myRole === "LEADER" || isMaster;

    return (
        <main className="w-full">
            <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-6 md:px-8 lg:px-12">
                <RandomizerClient
                    currentUserId={session.user.id}
                    currentUserName={session.user.name || session.user.username || "Player"}
                    currentUserEmail={session.user.email || ""}
                    canAddGames={canAddGames}
                    isLeader={isLeader}
                    activeGuild={
                        activeGuild
                            ? {
                                  id: activeGuild.id,
                                  name: activeGuild.name,
                                  level: activeGuild.level,
                                  myRole: activeGuild.myRole,
                                  myIsActive: activeGuild.myIsActive,
                                  activeMembers: activeGuild.members
                                      .filter((m) => m.isActive)
                                      .map((m) => ({
                                          id: m.id,
                                          userId: m.userId,
                                          name: m.name,
                                          role: m.role,
                                      })),
                              }
                            : null
                    }
                />
            </div>
        </main>
    );
}
