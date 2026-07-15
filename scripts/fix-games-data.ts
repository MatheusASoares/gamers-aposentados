import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

// Command line arguments helper
const isCommit = process.argv.includes("--commit");

// Robust CSV parser
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .replace(/\s+/g, "");
}

async function main() {
    console.log(`=== Games Data Correction Script ===`);
    console.log(`Mode: ${isCommit ? "COMMIT (Changes will be applied)" : "DRY-RUN (Simulating only)"}\n`);

    const auditCsvPath = path.join(process.cwd(), "production_games_audit_result.csv");
    if (!fs.existsSync(auditCsvPath)) {
        console.error("Audited games CSV file not found! Please run the audit script first.");
        process.exit(1);
    }

    const fileContent = fs.readFileSync(auditCsvPath, "utf8");
    const lines = fileContent.split(/\r?\n/);
    
    // Load all current games in the database to build a cache and check conflicts
    const allDbGames = await prisma.game.findMany();
    const dbGamesMap = new Map(allDbGames.map(g => [g.id, g]));

    let updatedCount = 0;
    let conflictCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = parseCSVLine(line);
        if (row.length < 11) {
            console.warn(`Line ${i + 1} has insufficient columns: "${line}"`);
            continue;
        }

        const [
            gameId,
            csvIgdbId,
            csvTitle,
            igdbTitle,
            titleMatch,
            , // csvCoverUrl
            igdbCoverUrl,
            coverMatch
        ] = row;

        let dbGame = dbGamesMap.get(gameId);
        if (!dbGame) {
            // Fallback: search by normalized title for local DB where UUIDs differ
            const normCsvTitle = normalizeTitle(csvTitle);
            dbGame = allDbGames.find(g => normalizeTitle(g.title) === normCsvTitle);
        }

        if (!dbGame) {
            // Game not found in DB
            continue;
        }

        // Determine correct values
        const correctTitle = (titleMatch !== "Match" && igdbTitle && igdbTitle !== "NOT_FOUND") ? igdbTitle : dbGame.title;
        const correctCoverUrl = (coverMatch !== "Match" && igdbCoverUrl && igdbCoverUrl !== "NOT_FOUND") ? igdbCoverUrl : dbGame.cover_url;
        const correctIgdbId = (csvIgdbId && csvIgdbId !== "null" && csvIgdbId !== "") ? csvIgdbId : dbGame.igdb_id;

        // Check if anything needs updating
        const titleNeedsUpdate = dbGame.title !== correctTitle;
        const coverNeedsUpdate = dbGame.cover_url !== correctCoverUrl;
        const igdbIdNeedsUpdate = dbGame.igdb_id !== correctIgdbId;

        if (titleNeedsUpdate || coverNeedsUpdate || igdbIdNeedsUpdate) {
            // Check for IGDB ID uniqueness conflicts in the active database
            let hasConflict = false;
            if (igdbIdNeedsUpdate && correctIgdbId) {
                const conflictingGame = allDbGames.find(g => g.igdb_id === correctIgdbId && g.id !== dbGame.id);
                if (conflictingGame) {
                    hasConflict = true;
                    conflictCount++;
                    console.warn(`[CONFLICT] Skip updating IGDB ID to "${correctIgdbId}" for game "${dbGame.title}" because it conflicts with game "${conflictingGame.title}" (ID: ${conflictingGame.id})`);
                }
            }

            // Prepare update data
            const dataToUpdate: Record<string, string | null> = {};
            if (titleNeedsUpdate) dataToUpdate.title = correctTitle;
            if (coverNeedsUpdate) dataToUpdate.cover_url = correctCoverUrl;
            if (igdbIdNeedsUpdate && !hasConflict) dataToUpdate.igdb_id = correctIgdbId;

            if (Object.keys(dataToUpdate).length > 0) {
                updatedCount++;
                console.log(`Update Game: "${dbGame.title}" (ID: ${dbGame.id})`);
                if (titleNeedsUpdate) console.log(`  -> Title: "${dbGame.title}" ===> "${correctTitle}"`);
                if (coverNeedsUpdate) console.log(`  -> Cover URL: "${dbGame.cover_url || "None"}" ===> "${correctCoverUrl}"`);
                if (igdbIdNeedsUpdate && !hasConflict) console.log(`  -> IGDB ID: "${dbGame.igdb_id || "None"}" ===> "${correctIgdbId}"`);

                if (isCommit) {
                    await prisma.game.update({
                        where: { id: dbGame.id },
                        data: dataToUpdate
                    });
                }
            }
        }
    }

    console.log(`\n==================================================`);
    if (isCommit) {
        console.log(`Successfully updated ${updatedCount} games in the database.`);
        if (conflictCount > 0) {
            console.log(`Skipped ${conflictCount} IGDB ID updates due to unique constraint conflicts.`);
        }
    } else {
        console.log(`Dry-run simulation completed. Would update ${updatedCount} games.`);
        if (conflictCount > 0) {
            console.log(`Would skip ${conflictCount} IGDB ID updates due to unique constraint conflicts.`);
        }
        console.log(`Run with --commit to apply these changes: npx tsx scripts/fix-games-data.ts --commit`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
