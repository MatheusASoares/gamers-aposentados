import { getTwitchToken, sanitizeApicalypseQuery } from "@/app/lib/igdb";
import { prisma } from "@/lib/prisma";

export async function backfillArtworks() {
    const games = await prisma.game.findMany({
        where: {
            artwork_url: null
        }
    });

    if (games.length === 0) {
        console.log("No games to update.");
        return;
    }

    const clientId = process.env.IGDB_CLIENT_ID;
    const token = await getTwitchToken();

    if (!clientId || !token) {
        console.error("No credentials for IGDB.");
        return;
    }

    console.log(`Found ${games.length} games to backfill.`);

    for (const game of games) {
        try {
            const cleanTitle = sanitizeApicalypseQuery(game.title.replace(/ - pC| - stEam| - Ps[1-5]| - [sS]nes/ig, "").trim());
            const response = await fetch("https://api.igdb.com/v4/games", {
                method: "POST",
                headers: {
                    "Client-ID": clientId,
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "text/plain",
                },
                body: `search "${cleanTitle}"; fields name, cover.image_id, artworks.image_id, screenshots.image_id; limit 1;`,
                cache: "no-store",
            });

            const data = await response.json();
            let landscapeId = null;

            if (data && data.length > 0) {
                const igdbGame = data[0];
                if (igdbGame.artworks && igdbGame.artworks.length > 0) {
                    landscapeId = igdbGame.artworks[0].image_id;
                } else if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
                    landscapeId = igdbGame.screenshots[0].image_id;
                }
            }

            if (landscapeId) {
                const url = `https://images.igdb.com/igdb/image/upload/t_1080p/${landscapeId}.jpg`;
                await prisma.game.update({
                    where: { id: game.id },
                    data: { artwork_url: url }
                });
                console.log(`Updated ${game.title} with artwork.`);
            } else {
                console.log(`No artwork found for ${game.title}`);
            }
        } catch (e) {
            console.error(`Error updating ${game.title}:`, e);
        }
        
        // Sleep to avoid rate limiting
        await new Promise(r => setTimeout(r, 250));
    }
}
