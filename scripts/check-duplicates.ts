import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Analyzing local database for duplicate games...");

    // 1. Get all games
    const allGames = await prisma.game.findMany({
        include: {
            reviews: true,
            poolEntries: true,
            wonPools: true,
            progress: true,
            favoritedBy: true,
            favoritedByYear: true,
            contracts: true,
        }
    });

    console.log(`Total games in database: ${allGames.length}`);

    // Group by igdb_id (excluding null)
    const igdbGroups = new Map<string, typeof allGames>();
    // Group by normalized title
    const titleGroups = new Map<string, typeof allGames>();

    function normalize(title: string): string {
        return title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "")
            .replace(/\s+/g, "");
    }

    for (const game of allGames) {
        if (game.igdb_id) {
            const list = igdbGroups.get(game.igdb_id) || [];
            list.push(game);
            igdbGroups.set(game.igdb_id, list);
        }

        const normTitle = normalize(game.title);
        const list = titleGroups.get(normTitle) || [];
        list.push(game);
        titleGroups.set(normTitle, list);
    }

    // Find duplicates by igdb_id
    console.log("\n=== Duplicates by igdb_id ===");
    let igdbDupCount = 0;
    for (const [igdb_id, list] of igdbGroups.entries()) {
        if (list.length > 1) {
            igdbDupCount++;
            console.log(`IGDB ID: ${igdb_id} (${list.length} records)`);
            for (const g of list) {
                console.log(`  - ID: ${g.id}`);
                console.log(`    Title: "${g.title}"`);
                console.log(`    Cover: ${g.cover_url}`);
                console.log(`    Nominator ID: ${g.nominated_by_id}`);
                console.log(`    Relations:`);
                console.log(`      * Reviews: ${g.reviews.length}`);
                console.log(`      * Pool Entries: ${g.poolEntries.length}`);
                console.log(`      * Won Pools: ${g.wonPools.length}`);
                console.log(`      * Game Progress: ${g.progress.length}`);
                console.log(`      * Favorited By: ${g.favoritedBy.length}`);
                console.log(`      * Favorited By Year: ${g.favoritedByYear.length}`);
                console.log(`      * Campaign Contracts: ${g.contracts.length}`);
            }
        }
    }

    if (igdbDupCount === 0) {
        console.log("No duplicates found by igdb_id.");
    }

    // Find duplicates by title
    console.log("\n=== Duplicates by Normalized Title ===");
    let titleDupCount = 0;
    for (const [normTitle, list] of titleGroups.entries()) {
        if (list.length > 1) {
            titleDupCount++;
            console.log(`Normalized Title: ${normTitle} (${list.length} records)`);
            for (const g of list) {
                console.log(`  - ID: ${g.id}`);
                console.log(`    Title: "${g.title}"`);
                console.log(`    IGDB ID: ${g.igdb_id}`);
                console.log(`    Cover: ${g.cover_url}`);
                console.log(`    Relations:`);
                console.log(`      * Reviews: ${g.reviews.length}`);
                console.log(`      * Pool Entries: ${g.poolEntries.length}`);
                console.log(`      * Won Pools: ${g.wonPools.length}`);
                console.log(`      * Game Progress: ${g.progress.length}`);
                console.log(`      * Favorited By: ${g.favoritedBy.length}`);
                console.log(`      * Favorited By Year: ${g.favoritedByYear.length}`);
                console.log(`      * Campaign Contracts: ${g.contracts.length}`);
            }
        }
    }

    if (titleDupCount === 0) {
        console.log("No duplicates found by Normalized Title.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
