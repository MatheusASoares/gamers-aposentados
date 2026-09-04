// src/services/deals/curatedGames.ts

export interface CuratedGame {
    title: string;
    steamAppId: number;
    slug: string;
    priority?: number;
}

/**
 * Curated pool of high-caliber, evergreen, popular AAA and anticipated titles.
 * These games are continually checked so that when they are on sale or hit an All-Time Low,
 * they are guaranteed to appear in the Deals Showcase.
 */
export const CURATED_GAMES_POOL: CuratedGame[] = [
    { title: "Crimson Desert", steamAppId: 3321460, slug: "crimson-desert", priority: 10 },
    { title: "ELDEN RING", steamAppId: 1245620, slug: "elden-ring", priority: 10 },
    { title: "Baldur's Gate 3", steamAppId: 1086940, slug: "baldurs-gate-3", priority: 10 },
    { title: "Cyberpunk 2077", steamAppId: 1091500, slug: "cyberpunk-2077", priority: 10 },
    { title: "Black Myth: Wukong", steamAppId: 2358720, slug: "black-myth-wukong", priority: 10 },
    { title: "Monster Hunter Wilds", steamAppId: 2246340, slug: "monster-hunter-wilds", priority: 9 },
    { title: "Monster Hunter: World", steamAppId: 582010, slug: "monster-hunter-world", priority: 8 },
    { title: "Red Dead Redemption 2", steamAppId: 1174180, slug: "red-dead-redemption-2", priority: 9 },
    { title: "Grand Theft Auto V", steamAppId: 271590, slug: "grand-theft-auto-v", priority: 8 },
    { title: "Hades II", steamAppId: 1145350, slug: "hades-ii", priority: 9 },
    { title: "Hades", steamAppId: 1145360, slug: "hades", priority: 8 },
    { title: "God of War", steamAppId: 1593500, slug: "god-of-war", priority: 9 },
    { title: "God of War Ragnarök", steamAppId: 2322010, slug: "god-of-war-ragnarok", priority: 9 },
    { title: "The Witcher 3: Wild Hunt", steamAppId: 292030, slug: "the-witcher-3-wild-hunt", priority: 9 },
    { title: "Ghost of Tsushima DIRECTOR'S CUT", steamAppId: 2215430, slug: "ghost-of-tsushima-directors-cut", priority: 9 },
    { title: "Marvel's Spider-Man Remastered", steamAppId: 1817070, slug: "marvels-spider-man-remastered", priority: 8 },
    { title: "Dragon's Dogma 2", steamAppId: 2054970, slug: "dragons-dogma-2", priority: 8 },
    { title: "Persona 3 Reload", steamAppId: 2161700, slug: "persona-3-reload", priority: 8 },
    { title: "Persona 5 Royal", steamAppId: 1687950, slug: "persona-5-royal", priority: 8 },
    { title: "Metaphor: ReFantazio", steamAppId: 2679460, slug: "metaphor-refantazio", priority: 9 },
    { title: "Final Fantasy VII Remake Intergrade", steamAppId: 1462040, slug: "final-fantasy-vii-remake-intergrade", priority: 8 },
    { title: "Resident Evil 4", steamAppId: 2050650, slug: "resident-evil-4", priority: 8 },
    { title: "Silent Hill 2", steamAppId: 2124490, slug: "silent-hill-2", priority: 8 },
    { title: "Helldivers 2", steamAppId: 553850, slug: "helldivers-2", priority: 9 },
    { title: "Armored Core VI Fires of Rubicon", steamAppId: 1888160, slug: "armored-core-vi-fires-of-rubicon", priority: 8 },
    { title: "Sekiro: Shadows Die Twice", steamAppId: 814380, slug: "sekiro-shadows-die-twice", priority: 9 },
    { title: "Lies of P", steamAppId: 1627720, slug: "lies-of-p", priority: 8 },
    { title: "Hogwarts Legacy", steamAppId: 990080, slug: "hogwarts-legacy", priority: 8 },
    { title: "Kingdom Come: Deliverance II", steamAppId: 1771300, slug: "kingdom-come-deliverance-ii", priority: 9 },
    { title: "Kingdom Come: Deliverance", steamAppId: 379430, slug: "kingdom-come-deliverance", priority: 7 },
    { title: "S.T.A.L.K.E.R. 2: Heart of Chornobyl", steamAppId: 1643320, slug: "stalker-2-heart-of-chornobyl", priority: 8 },
    { title: "Manor Lords", steamAppId: 1363080, slug: "manor-lords", priority: 8 },
    { title: "Balatro", steamAppId: 2379780, slug: "balatro", priority: 9 },
    { title: "Forza Horizon 5", steamAppId: 1551360, slug: "forza-horizon-5", priority: 8 },
    { title: "Diablo IV", steamAppId: 2344520, slug: "diablo-iv", priority: 7 },
    { title: "Doom: The Dark Ages", steamAppId: 3017860, slug: "doom-the-dark-ages", priority: 8 },
    { title: "DOOM Eternal", steamAppId: 782330, slug: "doom-eternal", priority: 8 },
    { title: "Dead Space", steamAppId: 1693980, slug: "dead-space", priority: 8 },
    { title: "Death Stranding Director's Cut", steamAppId: 1850570, slug: "death-stranding-directors-cut", priority: 8 },
    { title: "Horizon Zero Dawn Complete Edition", steamAppId: 1151640, slug: "horizon-zero-dawn-complete-edition", priority: 8 },
    { title: "Horizon Forbidden West Complete Edition", steamAppId: 2420110, slug: "horizon-forbidden-west-complete-edition", priority: 8 },
    { title: "No Man's Sky", steamAppId: 275850, slug: "no-mans-sky", priority: 7 },
    { title: "Sea of Thieves", steamAppId: 1172620, slug: "sea-of-thieves", priority: 7 },
    { title: "The Last of Us Part I", steamAppId: 1888930, slug: "the-last-of-us-part-i", priority: 8 },
    { title: "Uncharted: Legacy of Thieves Collection", steamAppId: 1659420, slug: "uncharted-legacy-of-thieves-collection", priority: 8 },
    { title: "Cyberpunk 2077: Phantom Liberty", steamAppId: 2138330, slug: "cyberpunk-2077-phantom-liberty", priority: 7 },
    { title: "Clair Obscur: Expedition 33", steamAppId: 1903430, slug: "clair-obscur-expedition-33", priority: 8 },
];

/**
 * Returns list of App IDs in the curated pool.
 */
export function getCuratedAppIds(): number[] {
    return CURATED_GAMES_POOL.map((g) => g.steamAppId);
}

/**
 * Finds a curated game by title or steamAppId.
 */
export function findCuratedGame(query: string | number): CuratedGame | undefined {
    if (typeof query === "number") {
        return CURATED_GAMES_POOL.find((g) => g.steamAppId === query);
    }
    const clean = query.trim().toLowerCase();
    return CURATED_GAMES_POOL.find(
        (g) => g.title.toLowerCase() === clean || g.slug === clean,
    );
}
