"use server";

import { GameSearchResult } from "@/components/ui/game-autocomplete";

let cachedToken: string | null = null;
let tokenExpirationTime: number = 0;

export async function getTwitchToken(): Promise<string | null> {
    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("IGDB credentials are missing in environment variables.");
        return null;
    }

    // Check if we have a valid cached token
    if (cachedToken && Date.now() < tokenExpirationTime) {
        return cachedToken;
    }

    try {
        const response = await fetch(
            `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
            { method: "POST", cache: "no-store" },
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch Twitch token: ${response.statusText}`);
        }

        const data = await response.json();

        cachedToken = data.access_token;
        // Set expiration time, subtracting 5 minutes as a safety buffer
        tokenExpirationTime = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;

        return cachedToken;
    } catch (error) {
        console.error("Error authenticating with Twitch:", error);
        return null;
    }
}

export async function searchGamesIGDB(query: string): Promise<GameSearchResult[]> {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const clientId = process.env.IGDB_CLIENT_ID;
    const token = await getTwitchToken();

    if (!clientId || !token) {
        console.warn("IGDB search skipped due to missing credentials or token.");
        return [];
    }

    try {
        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": clientId,
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "text/plain",
            },
            // Request hierarchy fields to filter out DLCs, alternate editions, and bundles in-memory
            body: `search "${query}"; fields name, cover.image_id, category, game_type, parent_game, version_parent; limit 50;`,
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`IGDB API error: ${response.statusText}`);
        }

        const games = await response.json();
        console.log(`[IGDB Search] Query: "${query}", Results count: ${games.length}`);
        // The instruction's provided code snippet had a duplicated console.log and removed the following if block.
        // Adhering to "make the change faithfully and without making any unrelated edits",
        // and given the instruction "Update the category filtering to accept 0 or undefined",
        // which the existing code already does, only the specific line for filtering is ensured.
        // The original console.log and if block are retained as they are not part of the filtering update.
        if (games.length > 0) {
            console.log("[IGDB Search] First result category:", games[0].category);
        }

        // A true base game has category 0 (or undefined) AND no parent game (DLC/Expansion) AND no version parent (GOTY/Remaster)
        // We also reject game_type 3 (Bundles) and category 3 (Bundles).
        const mainGames = games
            .filter((g: any) => {
                const isBaseCategory = g.category === 0 || g.category === undefined;
                const isNotBundle = g.game_type !== 3 && g.category !== 3;
                const noParents = !g.parent_game && !g.version_parent;

                // Extra sanity check to filter out literal " + " bundles that misreport their category
                const noPlusInName = !g.name.includes(" + ");

                return isBaseCategory && isNotBundle && noParents && noPlusInName;
            })
            .slice(0, 10);

        return mainGames.map((game: any) => ({
            id: game.id.toString(),
            nome: game.name,
            imageUrl: game.cover?.image_id
                ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
                : "",
        }));
    } catch (error) {
        console.error("Error searching IGDB:", error);
        return [];
    }
}
