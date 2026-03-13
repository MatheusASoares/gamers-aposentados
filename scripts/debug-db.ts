import { prisma } from "../src/lib/prisma";

async function check() {
    const pools = await prisma.pool.findMany({
        where: { year: 2026 },
        include: { winner_game: true, entries: { include: { game: true, user: true } } }
    });

    console.log(`Found ${pools.length} pools for 2026.`);
    for (const pool of pools) {
        console.log(`--- Pool: ${pool.type} - Month: ${pool.month} ---`);
        console.log("WINNER:", pool.winner_game?.title);
        console.log("ENTRIES:");
        for (const e of pool.entries) {
            console.log(` - ${e.game.title} (Nominated by ${e.user.name})`);
        }
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
