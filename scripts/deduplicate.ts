import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

// Command line arguments helper
const isCommit = process.argv.includes("--commit");

function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .replace(/\s+/g, "");
}

async function main() {
    console.log(`=== Database Deduplication Script ===`);
    console.log(`Mode: ${isCommit ? "COMMIT (Changes will be applied)" : "DRY-RUN (Simulating only)"}\n`);

    // 1. Load CSV mappings for games (mapping game UUID -> igdb_id)
    const csvPath = path.join(process.cwd(), "production_games_list.csv");
    const csvMappings = new Map<string, { igdb_id: string; title: string }>();
    const csvTitleToIgdbId = new Map<string, string>();

    if (fs.existsSync(csvPath)) {
        const fileContent = fs.readFileSync(csvPath, "utf8");
        const lines = fileContent.split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"(.*)$/);
            if (match) {
                const [, id, title, igdb_id] = match;
                csvMappings.set(id, { igdb_id, title });
                
                // Also map normalized title to igdb_id as fallback for local DB where UUIDs differ
                const normTitle = normalizeTitle(title);
                csvTitleToIgdbId.set(normTitle, igdb_id);
            }
        }
        console.log(`Loaded ${csvMappings.size} game mappings from CSV.`);
    } else {
        console.warn("production_games_list.csv not found, using DB values only.");
    }

    // 2. Fetch all games with their relations
    const allGames = await prisma.game.findMany({
        include: {
            reviews: true,
            poolEntries: true,
            wonPools: true,
            progress: true,
            favoritedBy: true,
            favoritedByYear: true,
            contracts: {
                include: {
                    user_progresses: true
                }
            },
        }
    });

    console.log(`Loaded ${allGames.length} games from database.`);

    // Helper to get igdb_id for a game (using CSV UUID mapping, CSV Title mapping, or DB value)
    function getGameIgdbId(game: typeof allGames[0]): string | null {
        // Try UUID mapping from CSV first
        const csvMapping = csvMappings.get(game.id);
        if (csvMapping?.igdb_id) return csvMapping.igdb_id;

        // Try normalized title mapping from CSV (fallback for local DB)
        const csvIgdbId = csvTitleToIgdbId.get(normalizeTitle(game.title));
        if (csvIgdbId) return csvIgdbId;

        // Fallback to database value
        return game.igdb_id || null;
    }

    // 3. Group games by resolved igdb_id OR normalized title
    const groups: (typeof allGames)[] = [];

    for (const game of allGames) {
        const igdbId = getGameIgdbId(game);

        // Check if there is an existing group that matches this game
        const foundGroup = groups.find(g => 
            g.some(existing => {
                const existingIgdbId = getGameIgdbId(existing);

                // Match by igdb_id if both have one
                if (igdbId && existingIgdbId) {
                    return igdbId === existingIgdbId;
                }
                // Otherwise match by normalized titles
                return normalizeTitle(game.title) === normalizeTitle(existing.title);
            })
        );

        if (foundGroup) {
            foundGroup.push(game);
        } else {
            groups.push([game]);
        }
    }

    const duplicateGroups = groups.filter(g => g.length > 1);

    if (duplicateGroups.length === 0) {
        console.log("No duplicate games found in the database. Nothing to clean!");
        return;
    }

    console.log(`Found ${duplicateGroups.length} duplicate groups to process.`);

    for (const group of duplicateGroups) {
        // Calculate relation weight for each game to pick the best to keep
        const scoredGames = group.map(g => {
            const score = 
                g.reviews.length * 10 + 
                g.progress.length * 5 + 
                g.poolEntries.length * 3 + 
                g.wonPools.length * 10 + 
                g.contracts.length * 5 + 
                g.favoritedBy.length * 2 + 
                g.favoritedByYear.length * 2;
            return { game: g, score };
        });

        // Sort desc by score, then by having a non-null igdb_id, then by created_at (older first)
        scoredGames.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            
            const aIgdbId = getGameIgdbId(a.game);
            const bIgdbId = getGameIgdbId(b.game);

            // Prefer the one with igdb_id
            if (aIgdbId && !bIgdbId) return -1;
            if (!aIgdbId && bIgdbId) return 1;

            return a.game.created_at.getTime() - b.game.created_at.getTime();
        });

        const keepGame = scoredGames[0].game;
        const deleteGames = scoredGames.slice(1).map(sg => sg.game);

        // Determine correct igdb_id to set on kept game
        let targetIgdbId = getGameIgdbId(keepGame);

        if (!targetIgdbId) {
            for (const dg of deleteGames) {
                const dgIgdbId = getGameIgdbId(dg);
                if (dgIgdbId) {
                    targetIgdbId = dgIgdbId;
                    break;
                }
            }
        }

        console.log(`\n--------------------------------------------------`);
        console.log(`Processing Group (Titles: ${group.map(g => `"${g.title}"`).join(", ")})`);
        console.log(`KEEP: ID "${keepGame.id}" | Title: "${keepGame.title}" | Target IGDB ID: "${targetIgdbId || "None"}" | Score: ${scoredGames[0].score}`);
        console.log(`  Relations: Reviews: ${keepGame.reviews.length}, Progress: ${keepGame.progress.length}, PoolEntries: ${keepGame.poolEntries.length}, WonPools: ${keepGame.wonPools.length}`);

        for (const deleteGame of deleteGames) {
            const deleteScore = scoredGames.find(sg => sg.game.id === deleteGame.id)?.score || 0;
            console.log(`DELETE: ID "${deleteGame.id}" | Title: "${deleteGame.title}" | Score: ${deleteScore}`);
            console.log(`  Relations to migrate: Reviews: ${deleteGame.reviews.length}, Progress: ${deleteGame.progress.length}, PoolEntries: ${deleteGame.poolEntries.length}, WonPools: ${deleteGame.wonPools.length}`);

            if (isCommit) {
                // Perform deduplication inside a transaction
                await prisma.$transaction(async (tx) => {
                    // Update IGDB ID on keep game if needed
                    if (targetIgdbId && keepGame.igdb_id !== targetIgdbId) {
                        console.log(`  -> Setting IGDB ID "${targetIgdbId}" on keep game`);
                        await tx.game.update({
                            where: { id: keepGame.id },
                            data: { igdb_id: targetIgdbId }
                        });
                        keepGame.igdb_id = targetIgdbId; // Update in-memory reference
                    }

                    // 1. Migrate Reviews
                    for (const review of deleteGame.reviews) {
                        const existingReview = await tx.review.findUnique({
                            where: {
                                user_id_game_id: {
                                    user_id: review.user_id,
                                    game_id: keepGame.id
                                }
                            }
                        });

                        if (!existingReview) {
                            console.log(`  -> Moving review from user "${review.user_id}" to game "${keepGame.title}"`);
                            await tx.review.update({
                                where: { id: review.id },
                                data: { game_id: keepGame.id }
                            });
                        } else {
                            // Collision: keep the review with better rating/longer comment
                            const keepCurrent = 
                                review.rating > existingReview.rating || 
                                (review.rating === existingReview.rating && (review.review_text?.length || 0) > (existingReview.review_text?.length || 0));

                            if (keepCurrent) {
                                console.log(`  -> Replacing existing review from user "${review.user_id}" with duplicate review`);
                                await tx.review.delete({ where: { id: existingReview.id } });
                                await tx.review.update({
                                    where: { id: review.id },
                                    data: { game_id: keepGame.id }
                                });
                            } else {
                                console.log(`  -> Deleting redundant review from user "${review.user_id}"`);
                                await tx.review.delete({ where: { id: review.id } });
                            }
                        }
                    }

                    // 2. Migrate Game Progress
                    for (const prog of deleteGame.progress) {
                        const existingProgress = await tx.gameProgress.findUnique({
                            where: {
                                user_id_game_id: {
                                    user_id: prog.user_id,
                                    game_id: keepGame.id
                                }
                            }
                        });

                        if (!existingProgress) {
                            console.log(`  -> Moving progress for user "${prog.user_id}" to game "${keepGame.title}"`);
                            await tx.gameProgress.update({
                                where: { id: prog.id },
                                data: { game_id: keepGame.id }
                            });
                        } else {
                            // Collision: keep the one with higher progress percentage / end date
                            const keepCurrent = 
                                prog.status === "COMPLETED" || 
                                (prog.status === "ACTIVE" && existingProgress.status !== "COMPLETED") ||
                                prog.progress_percentage > existingProgress.progress_percentage;

                            if (keepCurrent) {
                                console.log(`  -> Replacing existing progress for user "${prog.user_id}" with duplicate progress`);
                                await tx.gameProgress.delete({ where: { id: existingProgress.id } });
                                await tx.gameProgress.update({
                                    where: { id: prog.id },
                                    data: { game_id: keepGame.id }
                                });
                            } else {
                                console.log(`  -> Deleting redundant progress for user "${prog.user_id}"`);
                                await tx.gameProgress.delete({ where: { id: prog.id } });
                            }
                        }
                    }

                    // 3. Migrate Pool Entries
                    for (const entry of deleteGame.poolEntries) {
                        const existingEntry = await tx.poolEntry.findUnique({
                            where: {
                                pool_id_game_id: {
                                    pool_id: entry.pool_id,
                                    game_id: keepGame.id
                                }
                            }
                        });

                        if (!existingEntry) {
                            console.log(`  -> Moving pool entry in pool "${entry.pool_id}" to game "${keepGame.title}"`);
                            await tx.poolEntry.update({
                                where: { id: entry.id },
                                data: { game_id: keepGame.id }
                            });
                        } else {
                            console.log(`  -> Deleting redundant pool entry in pool "${entry.pool_id}"`);
                            await tx.poolEntry.delete({ where: { id: entry.id } });
                        }
                    }

                    // 4. Migrate Won Pools (winner_game_id in Pool)
                    const wonPools = await tx.pool.findMany({
                        where: { winner_game_id: deleteGame.id }
                    });
                    for (const pool of wonPools) {
                        console.log(`  -> Re-pointing pool victory (Pool ID: "${pool.id}") to game "${keepGame.title}"`);
                        await tx.pool.update({
                            where: { id: pool.id },
                            data: { winner_game_id: keepGame.id }
                        });
                    }

                    // 5. Migrate Campaign Contracts
                    for (const contract of deleteGame.contracts) {
                        const existingContract = await tx.campaignContract.findUnique({
                            where: {
                                game_id_sequence_order: {
                                    game_id: keepGame.id,
                                    sequence_order: contract.sequence_order
                                }
                            }
                        });

                        if (!existingContract) {
                            console.log(`  -> Moving campaign contract "${contract.title}" to game "${keepGame.title}"`);
                            await tx.campaignContract.update({
                                where: { id: contract.id },
                                data: { game_id: keepGame.id }
                            });
                        } else {
                            console.log(`  -> Merging progress for campaign contract "${contract.title}"`);
                            // Move user progress
                            for (const up of contract.user_progresses) {
                                const existingUP = await tx.campaignContractProgress.findUnique({
                                    where: {
                                        user_id_contract_id: {
                                            user_id: up.user_id,
                                            contract_id: existingContract.id
                                        }
                                    }
                                });

                                if (!existingUP) {
                                    await tx.campaignContractProgress.update({
                                        where: { id: up.id },
                                        data: { contract_id: existingContract.id }
                                    });
                                } else {
                                    // Keep better status
                                    const isBetter = up.status === "COMPLETED" || (up.status === "AVAILABLE" && existingUP.status === "LOCKED");
                                    if (isBetter) {
                                        await tx.campaignContractProgress.delete({ where: { id: existingUP.id } });
                                        await tx.campaignContractProgress.update({
                                            where: { id: up.id },
                                            data: { contract_id: existingContract.id }
                                        });
                                    } else {
                                        await tx.campaignContractProgress.delete({ where: { id: up.id } });
                                    }
                                }
                            }
                            // Delete redundant contract
                            await tx.campaignContract.delete({ where: { id: contract.id } });
                        }
                    }

                    // 6. Migrate Favorites (implicit many-to-many)
                    for (const user of deleteGame.favoritedBy) {
                        const isFavorited = keepGame.favoritedBy.some(u => u.id === user.id);
                        if (!isFavorited) {
                            console.log(`  -> Connecting favorite for user "${user.id}" to game "${keepGame.title}"`);
                            await tx.game.update({
                                where: { id: keepGame.id },
                                data: { favoritedBy: { connect: { id: user.id } } }
                            });
                        }
                    }

                    for (const user of deleteGame.favoritedByYear) {
                        const isFavorited = keepGame.favoritedByYear.some(u => u.id === user.id);
                        if (!isFavorited) {
                            console.log(`  -> Connecting current year favorite for user "${user.id}" to game "${keepGame.title}"`);
                            await tx.game.update({
                                where: { id: keepGame.id },
                                data: { favoritedByYear: { connect: { id: user.id } } }
                            });
                        }
                    }

                    // 7. Delete the duplicate game itself
                    console.log(`  -> Deleting duplicate game "${deleteGame.title}" (ID: "${deleteGame.id}")`);
                    await tx.game.delete({
                        where: { id: deleteGame.id }
                    });
                });
            } else {
                // Dry run log simulation
                if (targetIgdbId && keepGame.igdb_id !== targetIgdbId) {
                    console.log(`  [Dry-Run] Would update keepGame's IGDB ID to "${targetIgdbId}"`);
                }
                for (const review of deleteGame.reviews) {
                    console.log(`  [Dry-Run] Would migrate review from user "${review.user_id}"`);
                }
                for (const prog of deleteGame.progress) {
                    console.log(`  [Dry-Run] Would migrate progress for user "${prog.user_id}"`);
                }
                for (const entry of deleteGame.poolEntries) {
                    console.log(`  [Dry-Run] Would migrate pool entry in pool "${entry.pool_id}"`);
                }
                if (deleteGame.wonPools.length > 0) {
                    console.log(`  [Dry-Run] Would migrate ${deleteGame.wonPools.length} pool victories`);
                }
                for (const contract of deleteGame.contracts) {
                    console.log(`  [Dry-Run] Would migrate campaign contract "${contract.title}"`);
                }
                if (deleteGame.favoritedBy.length > 0) {
                    console.log(`  [Dry-Run] Would migrate ${deleteGame.favoritedBy.length} user favorites`);
                }
                console.log(`  [Dry-Run] Would delete game record "${deleteGame.title}" (ID: "${deleteGame.id}")`);
            }
        }
    }

    console.log(`\n==================================================`);
    if (isCommit) {
        console.log(`Deduplication completed successfully! All changes committed to the database.`);
    } else {
        console.log(`Dry-run simulation completed successfully. No changes were made to the database.`);
        console.log(`Run with --commit to apply these changes: npx tsx scripts/deduplicate.ts --commit`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
