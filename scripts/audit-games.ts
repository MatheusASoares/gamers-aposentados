import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

// Interfaces
interface CSVGame {
    id: string;
    title: string;
    igdb_id: string;
    cover_url: string;
    nominator: string;
    comment: string;
}

interface IGDBGameResponse {
    id: number;
    name: string;
    cover?: {
        image_id: string;
    };
}

// Helper to normalize string for comparison (removes spaces, punctuation, accents)
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, "")      // Remove all non-alphanumeric chars
        .replace(/\s+/g, "");            // Remove spaces
}

// Helper to extract image ID from cover URL
function extractImageId(url: string | null | undefined): string | null {
    if (!url) return null;
    const match = url.match(/\/([^\/]+)\.[a-zA-Z0-9]+$/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

async function fetchTwitchToken(): Promise<string> {
    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("IGDB credentials are missing in environment variables.");
    }

    const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: "POST" }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch Twitch token: ${response.statusText}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
}

async function fetchIGDBGamesInBatches(ids: number[], clientId: string, token: string): Promise<Map<number, IGDBGameResponse>> {
    const results = new Map<number, IGDBGameResponse>();
    const batchSize = 100;

    for (let i = 0; i < ids.length; i += batchSize) {
        const batchIds = ids.slice(i, i + batchSize);
        console.log(`Fetching batch of ${batchIds.length} games from IGDB...`);

        try {
            const response = await fetch("https://api.igdb.com/v4/games", {
                method: "POST",
                headers: {
                    "Client-ID": clientId,
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "text/plain",
                },
                body: `fields name, cover.image_id; where id = (${batchIds.join(",")}); limit 100;`,
            });

            if (!response.ok) {
                console.error(`IGDB API error for batch: ${response.statusText} (${response.status})`);
                continue;
            }

            const games = (await response.json()) as IGDBGameResponse[];
            for (const game of games) {
                results.set(game.id, game);
            }
        } catch (error) {
            console.error("Error fetching batch from IGDB:", error);
        }
    }

    return results;
}

// Function to escape fields for CSV output
function escapeCSVField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

async function main() {
    const csvPath = path.join(process.cwd(), "production_games_list.csv");
    const outputPath = path.join(process.cwd(), "production_games_audit_result.csv");

    console.log(`Reading CSV from: ${csvPath}`);
    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found!");
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, "utf8");
    const lines = fileContent.split(/\r?\n/);

    const games: CSVGame[] = [];
    const igdbIdsToQuery: number[] = [];

    // Parse CSV line by line, skipping header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Custom regex to parse the 5 columns while handling trailing notes/comments after the last quote
        // Columns: "id","title","igdb_id","cover_url","nominator" followed by optional extra text
        const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"(.*)$/);

        if (match) {
            const [, id, title, igdb_id, cover_url, nominator, comment] = match;
            games.push({
                id,
                title,
                igdb_id,
                cover_url,
                nominator,
                comment: comment ? comment.trim().replace(/^[\*, \s]+/, "") : "",
            });

            const parsedId = parseInt(igdb_id, 10);
            if (!isNaN(parsedId)) {
                igdbIdsToQuery.push(parsedId);
            }
        } else {
            // Fallback for comma-separated without quotes just in case, though the CSV seems strictly quoted
            const parts = line.split(",");
            if (parts.length >= 5) {
                const id = parts[0].replace(/^"|"$/g, "");
                const title = parts[1].replace(/^"|"$/g, "");
                const igdb_id = parts[2].replace(/^"|"$/g, "");
                const cover_url = parts[3].replace(/^"|"$/g, "");
                const nominator = parts[4].replace(/^"|"$/g, "");
                games.push({
                    id,
                    title,
                    igdb_id,
                    cover_url,
                    nominator,
                    comment: parts.slice(5).join(",").trim(),
                });

                const parsedId = parseInt(igdb_id, 10);
                if (!isNaN(parsedId)) {
                    igdbIdsToQuery.push(parsedId);
                }
            } else {
                console.warn(`Line ${i + 1} could not be parsed: "${line}"`);
            }
        }
    }

    console.log(`Parsed ${games.length} games from CSV.`);

    // Authenticate with Twitch
    console.log("Authenticating with Twitch for IGDB access...");
    const clientId = process.env.IGDB_CLIENT_ID;
    if (!clientId) {
        console.error("IGDB_CLIENT_ID is not set in environment variables!");
        process.exit(1);
    }
    const token = await fetchTwitchToken();
    console.log("Authentication successful.");

    // Query IGDB in batch
    const uniqueIds = Array.from(new Set(igdbIdsToQuery));
    console.log(`Querying ${uniqueIds.length} unique IGDB IDs...`);
    const igdbData = await fetchIGDBGamesInBatches(uniqueIds, clientId, token);
    console.log(`Retrieved data for ${igdbData.size} games from IGDB.`);

    // Perform audit
    const auditedRows: string[] = [];
    // Header
    auditedRows.push([
        "id",
        "igdb_id",
        "csv_title",
        "igdb_title",
        "title_match",
        "csv_cover_url",
        "igdb_cover_url",
        "cover_match",
        "nominator",
        "comment",
        "audit_status"
    ].join(","));

    let okCount = 0;
    let titleMismatchCount = 0;
    let coverMismatchCount = 0;
    let bothMismatchCount = 0;
    let notFoundCount = 0;

    for (const game of games) {
        const parsedId = parseInt(game.igdb_id, 10);
        const igdbGame = !isNaN(parsedId) ? igdbData.get(parsedId) : undefined;

        if (!igdbGame) {
            // Not found on IGDB
            notFoundCount++;
            auditedRows.push([
                game.id,
                game.igdb_id,
                game.title,
                "NOT_FOUND",
                "Not Found",
                game.cover_url,
                "",
                "Not Found",
                game.nominator,
                game.comment,
                "NOT_FOUND"
            ].map(escapeCSVField).join(","));
            continue;
        }

        // Compare Title
        const csvTitle = game.title;
        const igdbTitle = igdbGame.name;

        const isStrictTitle = csvTitle === igdbTitle;
        const isCaseTitle = csvTitle.toLowerCase() === igdbTitle.toLowerCase();
        const isNormTitle = normalizeTitle(csvTitle) === normalizeTitle(igdbTitle);

        let titleMatch = "Mismatch";
        if (isStrictTitle) {
            titleMatch = "Match";
        } else if (isCaseTitle) {
            titleMatch = "Case Mismatch";
        } else if (isNormTitle) {
            titleMatch = "Punctuation Mismatch";
        }

        // Compare Cover
        const csvCoverUrl = game.cover_url;
        const csvImageId = extractImageId(csvCoverUrl);
        const igdbImageId = igdbGame.cover?.image_id || null;
        const igdbCoverUrl = igdbImageId 
            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${igdbImageId}.jpg` 
            : "";

        let coverMatch = "Mismatch";
        if (!csvImageId && !igdbImageId) {
            coverMatch = "Match (Both Empty)";
        } else if (csvImageId && !igdbImageId) {
            coverMatch = "Missing on IGDB";
        } else if (!csvImageId && igdbImageId) {
            coverMatch = "Missing on CSV";
        } else if (csvImageId === igdbImageId) {
            coverMatch = "Match";
        }

        // Audit Status
        let auditStatus = "OK";
        const hasTitleIssue = titleMatch === "Mismatch";
        const hasCoverIssue = coverMatch === "Mismatch" || coverMatch === "Missing on IGDB" || coverMatch === "Missing on CSV";

        if (hasTitleIssue && hasCoverIssue) {
            auditStatus = "BOTH_MISMATCH";
            bothMismatchCount++;
        } else if (hasTitleIssue) {
            auditStatus = "TITLE_MISMATCH";
            titleMismatchCount++;
        } else if (hasCoverIssue) {
            auditStatus = "COVER_MISMATCH";
            coverMismatchCount++;
        } else {
            // Either perfect match or minor case/punctuation mismatch
            if (titleMatch !== "Match") {
                auditStatus = `MINOR_TITLE_DEVIATION (${titleMatch.toUpperCase().replace(" ", "_")})`;
            }
            okCount++;
        }

        auditedRows.push([
            game.id,
            game.igdb_id,
            game.title,
            igdbTitle,
            titleMatch,
            game.cover_url,
            igdbCoverUrl,
            coverMatch,
            game.nominator,
            game.comment,
            auditStatus
        ].map(escapeCSVField).join(","));
    }

    fs.writeFileSync(outputPath, auditedRows.join("\n"), "utf8");
    console.log(`\nAudit completed successfully! Saved to: ${outputPath}`);
    console.log("\nSummary:");
    console.log(`- OK (Perfect Match or Minor Deviation): ${okCount}`);
    console.log(`- Title Mismatches (Significant): ${titleMismatchCount}`);
    console.log(`- Cover Mismatches: ${coverMismatchCount}`);
    console.log(`- Both Mismatch: ${bothMismatchCount}`);
    console.log(`- Not Found on IGDB: ${notFoundCount}`);
}

main().catch((err) => {
    console.error("Unhandled error during audit:", err);
    process.exit(1);
});
