import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Locating the latest closed SIDE_QUEST pool...");
        const lastClosedPool = await prisma.pool.findFirst({
            where: {
                type: "SIDE_QUEST",
                status: "CLOSED",
            },
            orderBy: {
                created_at: "desc",
            },
        });

        if (!lastClosedPool) {
            console.log("No closed SIDE_QUEST pools found.");
            return;
        }

        console.log(`Found pool ${lastClosedPool.id} (Winner Game ID: ${lastClosedPool.winner_game_id}).`);

        const winnerGameId = lastClosedPool.winner_game_id;

        if (winnerGameId) {
            console.log("Resetting progress for this game...");
            // We can delete the game progress entries associated with this game 
            // so they are no longer marked as ACTIVE or SUGGESTED.
            const deleteProgress = await prisma.gameProgress.deleteMany({
                where: {
                    game_id: winnerGameId,
                },
            });
            console.log(`Deleted ${deleteProgress.count} progress entries.`);
        }

        console.log("Re-opening the pool...");
        await prisma.pool.update({
            where: {
                id: lastClosedPool.id,
            },
            data: {
                status: "OPEN",
                winner_game_id: null,
            },
        });

        console.log("Success! The pool has been reset to OPEN and the winner cleared.");
    } catch (error) {
        console.error("Error executing cleanup:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
