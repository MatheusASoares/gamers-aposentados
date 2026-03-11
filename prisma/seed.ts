import "dotenv/config";
import { PrismaClient, QuestType, GameStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// IGDB HELPERS (replicating src/app/lib/igdb.ts for seed context)
// ============================================================
let cachedToken: string | null = null;
let tokenExpirationTime: number = 0;

async function getTwitchToken(): Promise<string | null> {
    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("❌ IGDB credentials missing. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET.");
        return null;
    }

    if (cachedToken && Date.now() < tokenExpirationTime) {
        return cachedToken;
    }

    const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: "POST" },
    );

    if (!response.ok) {
        console.error("❌ Failed to fetch Twitch token:", response.statusText);
        return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpirationTime = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;
    return cachedToken;
}

async function fetchIGDBCover(title: string): Promise<string | null> {
    const clientId = process.env.IGDB_CLIENT_ID;
    const token = await getTwitchToken();
    if (!clientId || !token) return null;

    // Override map for titles that don't match well on IGDB
    const searchOverrides: Record<string, string> = {
        "Dragons Dogma Dark Arisen": "Dragon's Dogma",
        "Donkey Kong (1981)": "Donkey Kong",
        "Jack Chan": "Jackie Chan Adventures",
        "Tomb Raider Classic 1996": "Tomb Raider",
        "Champions Of Norath": "Champions of Norrath",
        "Shadow of the Colossus (2005)": "Shadow of the Colossus",
        "NFS Underground 1": "Need for Speed Underground",
        "Need For Speed Underground 1": "Need for Speed Underground",
        "As Aventuras de Batman e Robin": "The Adventures of Batman & Robin",
        "Super Mario Bros. (1985)": "Super Mario Bros",
        "The Outer Worlds: Spacer's Choice Edition": "The Outer Worlds",
        "The Legend of Zelda - 1987": "The Legend of Zelda",
        "Dishonored Definitive Edition": "Dishonored",
        "The Legend of Zelda: Link's Awakening (1993)": "Link's Awakening",
        "Dragon Quest (1989)": "Dragon Quest",
        "Batman Arkham Knight": "Batman Arkham Knight",
        "Death Stranding 1": "Death Stranding",
    };
    const searchTerm = searchOverrides[title] || title;

    try {
        // Small delay to respect rate limits (4 requests/sec)
        await new Promise((r) => setTimeout(r, 260));

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": clientId,
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "text/plain",
            },
            body: `search "${searchTerm.replace(/"/g, "")}"; fields name, cover.image_id, category, parent_game, version_parent; limit 10;`,
        });

        if (!response.ok) return null;

        const games = await response.json();

        // Filter to base games only
        const baseGame = games.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (g: any) =>
                (g.category === 0 || g.category === undefined) &&
                !g.parent_game &&
                !g.version_parent &&
                g.cover?.image_id,
        );

        if (baseGame?.cover?.image_id) {
            return `https://images.igdb.com/igdb/image/upload/t_cover_big/${baseGame.cover.image_id}.jpg`;
        }

        return null;
    } catch {
        return null;
    }
}

// ============================================================
// HELPER: Extract game title and platform from raw strings
// ============================================================
function parseGame(raw: string): { title: string; platform: string | null } {
    const trimmed = raw.trim();
    if (!trimmed) return { title: "", platform: null };

    // Patterns like "Game - Platform", "Game Platform", "Game (Platform)"
    const platformMap: Record<string, string> = {
        steam: "Steam",
        epic: "Epic",
        ps1: "PS1",
        ps2: "PS2",
        ps5: "PS5",
        snes: "SNES",
        nes: "NES",
        gba: "GBA",
        "3ds": "3DS",
        pc: "PC",
        arcade: "Arcade",
        switch: "Switch",
    };

    // Try pattern: "Title - PLATFORM" or "Title - PLATFORM or PLATFORM"
    const dashMatch = trimmed.match(
        /^(.+?)\s*[-–]\s*(Steam|Epic|PS1|PS2|PS5|SNES|NES|GBA|3DS|PC|Arcade|Switch|Ps1|Ps2|Ps5|snes|STEAM).*$/i,
    );
    if (dashMatch) {
        const title = dashMatch[1].trim();
        const rawPlatform = dashMatch[2].trim().toLowerCase();
        return {
            title,
            platform: platformMap[rawPlatform] || dashMatch[2].trim(),
        };
    }

    // Try pattern: "Title PLATFORM" (platform at end, preceded by space)
    const suffixMatch = trimmed.match(
        /^(.+?)\s+(Steam|Epic|PS1|PS2|PS5|SNES|NES|GBA|3DS|PC|Arcade|Switch|Ps1|Ps2|Ps5|snes|STEAM)$/i,
    );
    if (suffixMatch) {
        const title = suffixMatch[1].trim();
        const rawPlatform = suffixMatch[2].trim().toLowerCase();
        return {
            title,
            platform: platformMap[rawPlatform] || suffixMatch[2].trim(),
        };
    }

    // No platform found — default to Steam (per user's answer)
    return { title: trimmed, platform: "Steam" };
}

// ============================================================
// HELPER: Normalize a game title for de-duplication
// ============================================================
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[''""":!.,\-–()\[\]]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// ============================================================
// POOL DATA STRUCTURES
// ============================================================
interface PoolData {
    month: number | null;
    year: number;
    type: QuestType;
    nominations: {
        player: "matheus" | "lucas" | "ygnos";
        rawGames: string[];
    }[];
    winner: string | null; // raw winner string
}

// ============================================================
// ALL HISTORICAL POOL DATA
// ============================================================
const allPools: PoolData[] = [
    // ===================== SIDE QUEST 2024 =====================
    {
        month: 11,
        year: 2024,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Super Metroid SNES",
                    "Pepsi Man PS1",
                    "Castlevania Symphony PS1",
                    "Shadow of The Colossus",
                    "Prince Of Persia 1",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "HiFi Rush",
                    "Hollow Knight",
                    "Metal Gear Solid - PS1",
                    "Chrono Trigger",
                    "Slay the Spire",
                ],
            },
            {
                player: "ygnos",
                rawGames: [
                    "Illusion of Gaia",
                    "Demon's Crest",
                    "Chaos Legion",
                    "Gauntlet",
                    "Titan Souls",
                ],
            },
        ],
        winner: "Demon's Crest",
    },
    {
        month: 12,
        year: 2024,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: ["Alundra PS1", "Celeste PC", "Ico PS2"],
            },
            {
                player: "matheus",
                rawGames: [
                    "The Legend of Zelda: A Link to the Past - SNES",
                    "Dragons Dogma Dark Arisen - Steam",
                    "HiFi Rush - Steam",
                ],
            },
            {
                player: "ygnos",
                rawGames: ["Titan Souls - Steam", "Hero Siege - Steam", "Besiege - Steam"],
            },
        ],
        winner: "HiFi Rush",
    },

    // ===================== SIDE QUEST 2025 =====================
    {
        month: 1,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Tomb Raider Underworld Steam",
                    "Creatures Nightmare PS1",
                    "Simpsons Hit and Run PS2",
                ],
            },
            {
                player: "matheus",
                rawGames: ["Chrono Trigger - SNES", "Sifu - Steam", "Donkey Kong (1981) - Arcade"],
            },
            { player: "ygnos", rawGames: [] },
        ],
        winner: "Creatures Nightmare PS1",
    },
    {
        month: 2,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: ["Batman Arkham City", "Dead Cells", "Death Gambit", "Jack Chan - PS1"],
            },
            {
                player: "matheus",
                rawGames: [
                    "Tomb Raider Classic 1996",
                    "Portal - Steam",
                    "Control - Epic",
                    "Celeste - Epic",
                ],
            },
            { player: "ygnos", rawGames: [] },
        ],
        winner: "Dead Cells",
    },
    {
        month: 3,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "A Plague Tale Innocence",
                    "Shadow of The Tomb Raider",
                    "Champions Of Norath - PS2",
                    "Metal Gear Solid - PS1",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Shadow of the Colossus (2005)",
                    "Portal - Steam",
                    "Sifu - Epic",
                    "Detroit Become Human - Steam",
                ],
            },
            { player: "ygnos", rawGames: [] },
        ],
        winner: "Detroit Become Human",
    },
    {
        month: 4,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "NFS Underground 1 - PS2",
                    "Little Nightmares - Steam",
                    "As Aventuras de Batman e Robin - SNES",
                    "Legacy of Kain Soul Reaver - PS1",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Super Mario Bros. (1985)",
                    "The Outer Worlds: Spacer's Choice Edition - Epic",
                    "Sifu - Steam",
                    "The Legend of Zelda - 1987",
                ],
            },
            { player: "ygnos", rawGames: [] },
        ],
        winner: "Super Mario Bros. (1985)",
    },
    {
        month: 5,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Bioshock - Steam",
                    "Cat Quest - Epic",
                    "Prince of Persia - PS2",
                    "Bomberman 4 - SNES",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Dishonored Definitive Edition - Epic",
                    "Torchlight II - Epic",
                    "The Incredible Adventures of Van Helsing Final Cut - Steam",
                    "The Legend of Zelda: Link's Awakening (1993) - GBA",
                ],
            },
        ],
        winner: "Prince of Persia - PS2",
    },
    // June 2025 — no pool (vacation month)
    {
        month: 7,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Blasphemous",
                    "Astral Ascent",
                    "Children of Morta",
                    "Shadow Hearts PS2",
                ],
            },
            {
                player: "matheus",
                rawGames: ["Steamworld Dig 2", "Limbo", "Celeste - Epic", "Bioshock"],
            },
        ],
        winner: "Children of Morta",
    },
    {
        month: 8,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Alundra PS1",
                    "Legacy of Kain 1 Remastered Steam",
                    "Dungeons of Hinterberg Steam",
                    "Simpsons Hit and Run PS2",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Titan Quest - Steam",
                    "Moonlighter - Steam",
                    "Blasphemous - Steam",
                    "Castlevania: Symphony of the Night - PS1",
                ],
            },
        ],
        winner: "Dungeons of Hinterberg",
    },
    {
        month: 9,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Kingdom Hearts 1",
                    "Chrono Trigger",
                    "Final Fantasy X - PS2",
                    "Baldur's Gate Dark Alliance PS2",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Grim Dawn",
                    "The Incredible Adventures of Van Helsing Final Cut - Steam",
                    "Titan Quest - Steam",
                    "Dragon Quest - 3DS",
                ],
            },
        ],
        winner: "Titan Quest",
    },
    {
        month: 10,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            // Unanimous choice — Hades 2 (no traditional pool)
            { player: "lucas", rawGames: ["Hades 2"] },
            { player: "matheus", rawGames: ["Hades 2"] },
        ],
        winner: "Hades 2",
    },
    {
        month: 11,
        year: 2025,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Blasphemous",
                    "The Mask - SNES",
                    "Jack Chan - PS1",
                    "X-Men Origins: Wolverine",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Chrono Trigger - Steam",
                    "Shadow Gambit: The Cursed Crew - Steam",
                    "Midnight Club: Street Racing - PS2",
                    "Castlevania: Aria of Sorrow - GBA",
                ],
            },
        ],
        winner: "Castlevania: Aria of Sorrow",
    },
    // December 2025 — no pool (vacation month)

    // ===================== SIDE QUEST 2026 =====================
    {
        month: 1,
        year: 2026,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Batman Arkham Origins - Steam",
                    "Need For Speed Underground 1 - PS2",
                    "Tomb Raider Underworld - Steam",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Sifu - Steam",
                    "Streets of Rage 4 - Steam",
                    "Dragon Quest (1989) - NES",
                ],
            },
        ],
        winner: "Streets of Rage 4",
    },
    {
        month: 2,
        year: 2026,
        type: "SIDE_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Death Gambit - Epic",
                    "Astral Ascent - Steam",
                    "Gauntlet Seven Sorrows - PS2",
                ],
            },
            {
                player: "matheus",
                rawGames: ["Celeste - Epic", "Jusant - Steam", "Ico - PS2"],
            },
        ],
        winner: "Gauntlet Seven Sorrows",
    },

    // ===================== MAIN QUEST 2025 =====================
    {
        month: 1, // 1st quarter
        year: 2025,
        type: "MAIN_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "The Witcher 3 Wild Hunt",
                    "No Rest for the Wicked",
                    "Hitman 2",
                    "Batman Arkham Knight",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Chrono Trigger - SNES",
                    "Baldur's Gate 3 - Steam",
                    "Yakuza Like a Dragon - Steam",
                    "Kingdom Come Deliverance - Epic",
                ],
            },
        ],
        winner: "No Rest for the Wicked",
    },
    {
        month: 4, // 2nd quarter
        year: 2025,
        type: "MAIN_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Dragon Age Inquisition",
                    "Yakuza Like a Dragon",
                    "Batman Arkham City Epic",
                    "GhostWire Epic",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "Chrono Trigger - Steam",
                    "Kingdom Come Deliverance - Epic",
                    "Disco Elysium - Steam",
                    "Hogwarts Legacy - Steam",
                ],
            },
        ],
        winner: "Disco Elysium",
    },
    {
        month: 7, // 3rd quarter
        year: 2025,
        type: "MAIN_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: [
                    "Kingdom Hearts 1 PS2",
                    "Death Stranding 1 Epic",
                    "Final Fantasy X PS2",
                    "Chrono Cross PS1",
                ],
            },
            {
                player: "matheus",
                rawGames: [
                    "The Outer Worlds - Epic",
                    "Fallout New Vegas - Epic",
                    "Kingdom Come Deliverance - Epic",
                    "Chrono Trigger - Steam",
                ],
            },
        ],
        winner: "Death Stranding 1",
    },

    // ===================== MAIN QUEST 2026 =====================
    {
        month: 1, // 1st quarter
        year: 2026,
        type: "MAIN_QUEST",
        nominations: [
            {
                player: "lucas",
                rawGames: ["Yakuza: Like A Dragon - Steam", "Mad Max - Steam"],
            },
            {
                player: "matheus",
                rawGames: ["Chrono Trigger - Steam", "Kingdom Come Deliverance - Steam"],
            },
        ],
        winner: "Mad Max",
    },
];

// ============================================================
// REVIEW DATA (from Reviews CSVs)
// ============================================================
interface ReviewData {
    year: number;
    month: number | string;
    gameTitle: string;
    type: QuestType;
    matheus: "Yes" | "No";
    lucas: "Yes" | "No";
    matheusScore: number | null;
    lucasScore: number | null;
}

const allReviews: ReviewData[] = [
    // Side Quest Reviews
    {
        year: 2024,
        month: 11,
        gameTitle: "Demon's Crest",
        type: "SIDE_QUEST",
        matheus: "Yes",
        lucas: "Yes",
        matheusScore: 6,
        lucasScore: null,
    },
    {
        year: 2024,
        month: 12,
        gameTitle: "HiFi Rush",
        type: "SIDE_QUEST",
        matheus: "Yes",
        lucas: "No",
        matheusScore: 9,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 1,
        gameTitle: "Creatures Nightmare",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 2,
        gameTitle: "Dead Cells",
        type: "SIDE_QUEST",
        matheus: "Yes",
        lucas: "No",
        matheusScore: 9,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 3,
        gameTitle: "Detroit Become Human",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 4,
        gameTitle: "Super Mario Bros. (1985)",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 5,
        gameTitle: "Prince of Persia",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "Yes",
        matheusScore: null,
        lucasScore: null,
    },
    // June 2025 — no pool
    {
        year: 2025,
        month: 7,
        gameTitle: "Children of Morta",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "Yes",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 8,
        gameTitle: "Dungeons of Hinterberg",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "Yes",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 9,
        gameTitle: "Titan Quest",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 10,
        gameTitle: "Hades 2",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 11,
        gameTitle: "Castlevania: Aria of Sorrow",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    // December 2025 — no pool
    {
        year: 2026,
        month: 1,
        gameTitle: "Streets of Rage 4",
        type: "SIDE_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2026,
        month: 2,
        gameTitle: "Gauntlet Seven Sorrows",
        type: "SIDE_QUEST",
        matheus: "Yes",
        lucas: "Yes",
        matheusScore: 5,
        lucasScore: null,
    },

    // Main Quest Reviews
    {
        year: 2025,
        month: 1,
        gameTitle: "No Rest for the Wicked",
        type: "MAIN_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 4,
        gameTitle: "Disco Elysium",
        type: "MAIN_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2025,
        month: 7,
        gameTitle: "Death Stranding 1",
        type: "MAIN_QUEST",
        matheus: "No",
        lucas: "No",
        matheusScore: null,
        lucasScore: null,
    },
    {
        year: 2026,
        month: 1,
        gameTitle: "Mad Max",
        type: "MAIN_QUEST",
        matheus: "No",
        lucas: "Yes",
        matheusScore: null,
        lucasScore: null,
    },
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
    console.log("🧹 Clearing existing data...");
    await prisma.poolEntry.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.review.deleteMany();
    await prisma.gameProgress.deleteMany();
    await prisma.game.deleteMany();
    // Don't delete accounts/sessions to protect OAuth data
    await prisma.user.deleteMany();

    // ----------------------------------------------------------
    // 1. CREATE USERS
    // ----------------------------------------------------------
    console.log("👤 Creating users...");
    const matheus = await prisma.user.create({
        data: {
            username: "matheus",
            email: "matheus31also@gmail.com",
            name: "Matheus",
        },
    });
    const lucas = await prisma.user.create({
        data: {
            username: "oCobralJhonson",
            email: "lucasedu17gomes@gmail.com",
            name: "Lucas",
        },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const leticia = await prisma.user.create({
        data: {
            username: "lele",
            email: "lsoares.english@gmail.com",
            name: "Letícia Soares",
        },
    });
    const ygnos = await prisma.user.create({
        data: {
            username: "ygnos",
            email: "yanhyuuga@gmail.com",
            name: "Ygnos, The Mage",
        },
    });

    const playerMap: Record<string, string> = {
        matheus: matheus.id,
        lucas: lucas.id,
        ygnos: ygnos.id,
    };

    // ----------------------------------------------------------
    // 2. CREATE GAMES (de-duplicated by normalized title)
    // ----------------------------------------------------------
    console.log("🎮 Creating games...");

    // Collect all unique games from all pools, tracking quest_type from pool context
    const gameCache = new Map<
        string,
        { title: string; platform: string | null; nominatedBy: string; questType: QuestType }
    >();

    for (const pool of allPools) {
        for (const nom of pool.nominations) {
            for (const rawGame of nom.rawGames) {
                const parsed = parseGame(rawGame);
                if (!parsed.title) continue;
                const key = normalizeTitle(parsed.title);
                if (!gameCache.has(key)) {
                    gameCache.set(key, {
                        title: parsed.title,
                        platform: parsed.platform,
                        nominatedBy: nom.player,
                        questType: pool.type, // Use the pool's quest type
                    });
                }
            }
        }
    }

    // Create all games in DB with IGDB cover lookup
    const dbGames = new Map<string, string>(); // normalizedTitle -> dbId
    const totalGames = gameCache.size;
    let gameIndex = 0;

    for (const [key, gameData] of gameCache) {
        gameIndex++;
        // Fetch cover from IGDB
        let coverUrl: string | null = null;
        coverUrl = await fetchIGDBCover(gameData.title);
        const status = coverUrl ? "✅" : "⬜";
        process.stdout.write(`\r   ${status} [${gameIndex}/${totalGames}] ${gameData.title}`);

        const game = await prisma.game.create({
            data: {
                title: gameData.title,
                platform: gameData.platform,
                quest_type: gameData.questType,
                cover_url: coverUrl,
                nominated_by_id: playerMap[gameData.nominatedBy],
            },
        });
        dbGames.set(key, game.id);
    }
    console.log(); // newline after progress

    console.log(`   Created ${dbGames.size} unique games.`);

    // ----------------------------------------------------------
    // 3. CREATE POOLS + ENTRIES
    // ----------------------------------------------------------
    console.log("🎲 Creating pools and entries...");

    let poolCount = 0;
    let entryCount = 0;

    // Track which game won which pool for progress tracking
    const winnerMap: { gameId: string; poolType: QuestType }[] = [];

    for (const poolData of allPools) {
        // Find winner game ID
        let winnerGameId: string | null = null;
        if (poolData.winner) {
            const winnerParsed = parseGame(poolData.winner);
            const winnerKey = normalizeTitle(winnerParsed.title);
            winnerGameId = dbGames.get(winnerKey) || null;

            if (!winnerGameId) {
                // Try fuzzy match
                for (const [key, id] of dbGames) {
                    if (key.includes(winnerKey) || winnerKey.includes(key)) {
                        winnerGameId = id;
                        break;
                    }
                }
            }

            if (winnerGameId) {
                winnerMap.push({
                    gameId: winnerGameId,
                    poolType: poolData.type,
                });
            }
        }

        const pool = await prisma.pool.create({
            data: {
                month: poolData.month,
                year: poolData.year,
                type: poolData.type,
                status: "CLOSED",
                winner_game_id: winnerGameId,
            },
        });
        poolCount++;

        // Create entries for each nomination
        for (const nom of poolData.nominations) {
            for (const rawGame of nom.rawGames) {
                const parsed = parseGame(rawGame);
                if (!parsed.title) continue;
                const key = normalizeTitle(parsed.title);
                const gameId = dbGames.get(key);

                if (!gameId) {
                    // Try fuzzy match
                    let foundId: string | null = null;
                    for (const [k, id] of dbGames) {
                        if (k.includes(key) || key.includes(k)) {
                            foundId = id;
                            break;
                        }
                    }
                    if (foundId) {
                        await prisma.poolEntry.create({
                            data: {
                                pool_id: pool.id,
                                game_id: foundId,
                                user_id: playerMap[nom.player],
                            },
                        });
                        entryCount++;
                    } else {
                        console.warn(`   ⚠️ Could not find game: "${parsed.title}" (key: ${key})`);
                    }
                } else {
                    await prisma.poolEntry.create({
                        data: {
                            pool_id: pool.id,
                            game_id: gameId,
                            user_id: playerMap[nom.player],
                        },
                    });
                    entryCount++;
                }
            }
        }
    }

    console.log(`   Created ${poolCount} pools with ${entryCount} entries.`);

    // ----------------------------------------------------------
    // 4. CREATE GAME PROGRESS + REVIEWS
    // ----------------------------------------------------------
    console.log("📊 Creating game progress and reviews...");

    let progressCount = 0;
    let reviewCount = 0;

    for (const review of allReviews) {
        // Find the game in our DB
        const reviewKey = normalizeTitle(review.gameTitle);
        let gameId = dbGames.get(reviewKey);

        if (!gameId) {
            // Fuzzy match
            for (const [key, id] of dbGames) {
                if (key.includes(reviewKey) || reviewKey.includes(key)) {
                    gameId = id;
                    break;
                }
            }
        }

        if (!gameId) {
            console.warn(`   ⚠️ Could not find game for review: "${review.gameTitle}"`);
            continue;
        }

        // Process Matheus
        const matheusStatus: GameStatus = review.matheus === "Yes" ? "COMPLETED" : "DROPPED";
        await prisma.gameProgress.create({
            data: {
                user_id: matheus.id,
                game_id: gameId,
                status: matheusStatus,
                progress_percentage: matheusStatus === "COMPLETED" ? 100 : 0,
                start_date: new Date(
                    review.year,
                    typeof review.month === "number" ? review.month - 1 : 0,
                    1,
                ),
                end_date:
                    matheusStatus === "COMPLETED"
                        ? new Date(
                              review.year,
                              typeof review.month === "number" ? review.month - 1 : 0,
                              28,
                          )
                        : null,
            },
        });
        progressCount++;

        // Create review if Matheus has a score
        if (review.matheusScore !== null) {
            await prisma.review.create({
                data: {
                    rating: review.matheusScore,
                    user_id: matheus.id,
                    game_id: gameId,
                },
            });
            reviewCount++;
        }

        // Process Lucas
        const lucasStatus: GameStatus = review.lucas === "Yes" ? "COMPLETED" : "DROPPED";
        await prisma.gameProgress.create({
            data: {
                user_id: lucas.id,
                game_id: gameId,
                status: lucasStatus,
                progress_percentage: lucasStatus === "COMPLETED" ? 100 : 0,
                start_date: new Date(
                    review.year,
                    typeof review.month === "number" ? review.month - 1 : 0,
                    1,
                ),
                end_date:
                    lucasStatus === "COMPLETED"
                        ? new Date(
                              review.year,
                              typeof review.month === "number" ? review.month - 1 : 0,
                              28,
                          )
                        : null,
            },
        });
        progressCount++;

        // Create review if Lucas has a score
        if (review.lucasScore !== null) {
            await prisma.review.create({
                data: {
                    rating: review.lucasScore,
                    user_id: lucas.id,
                    game_id: gameId,
                },
            });
            reviewCount++;
        }
    }

    console.log(`   Created ${progressCount} game progress records and ${reviewCount} reviews.`);

    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------
    console.log("\n✅ Seeding complete!");
    console.log(`   👤 4 users (Matheus, Lucas, Letícia, Ygnos)`);
    console.log(`   🎮 ${dbGames.size} unique games`);
    console.log(`   🎲 ${poolCount} pools with ${entryCount} entries`);
    console.log(`   📊 ${progressCount} progress records`);
    console.log(`   ⭐ ${reviewCount} reviews`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
