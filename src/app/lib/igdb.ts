"use server";

import { GameSearchResult } from "@/components/ui/game-autocomplete";

import { unstable_cache } from "next/cache";

interface IGDBGame {
    id: number;
    name: string;
    category?: number;
    game_type?: number;
    parent_game?: number;
    version_parent?: number;
    cover?: { image_id: string };
}

async function fetchNewTwitchToken(): Promise<string> {
    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("IGDB credentials are missing in environment variables.");
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
        return data.access_token;
    } catch (error) {
        console.error("Error authenticating with Twitch:", error);
        throw error;
    }
}

export const getTwitchToken = unstable_cache(
    async () => {
        return fetchNewTwitchToken();
    },
    ["igdb-twitch-token"], // Cache key
    {
        revalidate: 86400, // Revalidate every 24 hours (86400 seconds)
    },
);

import { sanitizeApicalypseQuery } from "@/lib/igdb-utils";
export { sanitizeApicalypseQuery };

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
        const sanitizedQuery = sanitizeApicalypseQuery(query);
        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": clientId,
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "text/plain",
            },
            // Request hierarchy fields to filter out DLCs, alternate editions, and bundles in-memory
            body: `search "${sanitizedQuery}"; fields name, cover.image_id, category, game_type, parent_game, version_parent; limit 50;`,
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`IGDB API error: ${response.statusText}`);
        }

        const games = await response.json();

        // A true base game has category 0 (or undefined) AND no parent game (DLC/Expansion) AND no version parent (GOTY/Remaster)
        // We also reject game_type 3 (Bundles) and category 3 (Bundles).
        const mainGames = games
            .filter((g: IGDBGame) => {
                const isBaseCategory = g.category === 0 || g.category === undefined;
                const isNotBundle = g.game_type !== 3 && g.category !== 3;
                const noParents = !g.parent_game && !g.version_parent;

                // Extra sanity check to filter out literal " + " bundles that misreport their category
                const noPlusInName = !g.name.includes(" + ");

                return isBaseCategory && isNotBundle && noParents && noPlusInName;
            })
            .slice(0, 10);

        return mainGames.map((game: IGDBGame) => ({
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

export async function getGameContextIGDB(title: string): Promise<{ summary?: string; storyline?: string } | null> {
    if (!title || title.trim().length === 0) {
        return null;
    }

    const clientId = process.env.IGDB_CLIENT_ID;
    const token = await getTwitchToken();

    if (!clientId || !token) {
        console.warn("IGDB context search skipped due to missing credentials or token.");
        return null;
    }

    try {
        const sanitizedTitle = sanitizeApicalypseQuery(title);
        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": clientId,
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "text/plain",
            },
            body: `search "${sanitizedTitle}"; fields name, summary, storyline; limit 1;`,
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`IGDB API error: ${response.statusText}`);
        }

        const games = await response.json();
        if (games && games.length > 0) {
            return {
                summary: games[0].summary || undefined,
                storyline: games[0].storyline || undefined,
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching game context from IGDB:", error);
        return null;
    }
}

