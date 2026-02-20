import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSave() {
    try {
        // find a user first
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found in the DB. This could be the issue!");
            return;
        }

        const userId = user.id;

        const candidates = [
            { id: "100", nome: "Test Game 1 IGDB", imageUrl: "" },
            { id: "101", nome: "Test Game 2 IGDB", imageUrl: "" }
        ];
        const winnerId = "100";
        const typeEnum: any = "SIDE_QUEST";

        const result = await prisma.$transaction(async (tx) => {
            const savedGames = await Promise.all(candidates.map(async (candidate) => {
                const existingGame = await tx.game.findFirst({
                    where: { title: candidate.nome }
                });

                if (existingGame) return existingGame;

                return tx.game.create({
                    data: {
                        title: candidate.nome,
                        cover_url: candidate.imageUrl,
                        quest_type: typeEnum,
                        status: "SUGGESTED",
                        nominated_by_id: userId
                    }
                });
            }));

            const winnerCandidate = candidates.find(c => c.id === winnerId);
            const savedWinner = savedGames.find(g => g.title === winnerCandidate?.nome);

            if (!savedWinner) throw new Error("Erro ao identificar o jogo vencedor.");

            await tx.game.update({
                where: { id: savedWinner.id },
                data: {
                    status: "ACTIVE",
                    start_date: new Date()
                }
            });

            const pool = await tx.pool.create({
                data: {
                    type: typeEnum,
                    status: "CLOSED",
                    winner_game_id: savedWinner.id,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                }
            });

            await Promise.all(savedGames.map(game => {
                return tx.poolEntry.create({
                    data: {
                        pool_id: pool.id,
                        game_id: game.id,
                        user_id: userId
                    }
                });
            }));

            return pool.id;
        });

        console.log("Success! Pool ID:", result);

        // cleanup
        await prisma.poolEntry.deleteMany({ where: { pool_id: result } });
        await prisma.pool.delete({ where: { id: result } });

    } catch (e) {
        console.error("Captured Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testSave();
