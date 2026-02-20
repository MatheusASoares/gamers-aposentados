"use server";

import { GameSearchResult } from "@/components/ui/game-autocomplete";

let cachedToken: string | null = null;
let tokenExpirationTime: number = 0;

async function getTwitchToken(): Promise<string | null> {
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
            { method: 'POST', cache: 'no-store' }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch Twitch token: ${response.statusText}`);
        }

        const data = await response.json();

        cachedToken = data.access_token;
        // Set expiration time, subtracting 5 minutes as a safety buffer
        tokenExpirationTime = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

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
        const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain',
            },
            // Search by name, request the id, name, and cover image hash
            body: `search "${query}"; fields name, cover.image_id; limit 10;`,
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`IGDB API error: ${response.statusText}`);
        }

        const games = await response.json();

        return games.map((game: any) => ({
            id: game.id.toString(),
            nome: game.name,
            imageUrl: game.cover?.image_id
                ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
                : ''
        }));
    } catch (error) {
        console.error("Error searching IGDB:", error);
        return [];
    }
}
