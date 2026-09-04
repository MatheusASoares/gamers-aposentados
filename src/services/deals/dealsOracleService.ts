// src/services/deals/dealsOracleService.ts

import { prisma } from "@/lib/prisma";
import {
    OracleGameRecommendation,
    OracleRecommendationsResponse,
    OracleGameTier,
} from "@/types/deals";
import { dealsCache } from "./dealsCache";
import { SteamStoreClient } from "./steamStoreClient";

interface RawOracleItem {
    title: string;
    category: OracleGameTier;
    pitch: string;
    highlight_reason: string;
}

const FALLBACK_ORACLE_ITEMS: RawOracleItem[] = [
    {
        title: "Persona 5 Royal",
        category: "AAA",
        pitch: "JRPG moderno impecável com combate por turnos refinado e trilha sonora inesquecível.",
        highlight_reason: "Para quem ama a era de ouro dos RPGs clássicos",
    },
    {
        title: "Dragon's Dogma: Dark Arisen",
        category: "AAA",
        pitch: "RPG de ação visceral que entrega liberdade total de combate e chefes épicos.",
        highlight_reason: "Combate recompensador sem enrolação",
    },
    {
        title: "NieR: Automata",
        category: "AAA",
        pitch: "Roteiro maduro com filosofia profunda e jogabilidade dinâmica e elegante.",
        highlight_reason: "Obra-prima de narrativa e combate ágil",
    },
    {
        title: "Sea of Stars",
        category: "INDIE",
        pitch: "Carta de amor aos RPGs 16-bit com direção de arte pixelada deslumbrante.",
        highlight_reason: "O sucessor espiritual da vibe de Chrono Trigger",
    },
    {
        title: "Dave the Diver",
        category: "INDIE",
        pitch: "Exploração submarina de dia e gerenciamento de sushi à noite. Loop viciante em sessões curtas.",
        highlight_reason: "Perfeito para relaxar após um dia cansativo",
    },
    {
        title: "Dead Cells",
        category: "INDIE",
        pitch: "Combate ágil estilo rogue-lite com movimentação fluida e armas variadas.",
        highlight_reason: "Para quem gosta de ação rápida e progressão constante",
    },
    {
        title: "Blasphemous 2",
        category: "INDIE",
        pitch: "Metroidvania sombrio com pixel art magistral e combate afiado.",
        highlight_reason: "Evoca os melhores momentos de Castlevania",
    },
    {
        title: "Chained Echoes",
        category: "HIDDEN_GEM",
        pitch: "JRPG solo que resgata batalhas com mechas e exploração rica da era SNES.",
        highlight_reason: "Uma das maiores pérolas indie dos últimos anos",
    },
    {
        title: "CrossCode",
        category: "HIDDEN_GEM",
        pitch: "Ação retrô frenética com puzzles inteligentes e história envolvente.",
        highlight_reason: "Subestimado pelo mainstream, adorado por veteranos",
    },
    {
        title: "Astlibra Revision",
        category: "HIDDEN_GEM",
        pitch: "ARPG 2D colossal com progressão profunda e chefes grandiosos.",
        highlight_reason: "Cultuado por fãs dedicados de RPG de ação",
    },
];

export class DealsOracleService {
    /**
     * Extrai o perfil de gostos do usuário a partir dos favoritos, reviews, progresso e deals monitorados.
     */
    static async getUserTasteProfile(userId?: string) {
        if (!userId) {
            return {
                favorites: [
                    "Chrono Trigger",
                    "Castlevania: Symphony of the Night",
                    "Hades",
                    "Sea of Stars",
                    "Elden Ring",
                ],
                excludedTitles: new Set<string>([
                    "chrono trigger",
                    "castlevania: symphony of the night",
                    "hades",
                    "sea of stars",
                    "elden ring",
                ]),
                tasteSummary: "Aventureiro veterano com paixão por RPGs, Indies aclamados e Metroidvanias.",
            };
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    favoriteGames: { select: { title: true } },
                    reviews: {
                        where: { rating: { gte: 4 } },
                        include: { game: { select: { title: true } } },
                        take: 10,
                    },
                    gameProgress: {
                        where: { status: { in: ["COMPLETED", "ACTIVE"] } },
                        include: { game: { select: { title: true } } },
                        take: 15,
                    },
                    trackedDeals: { select: { title: true } },
                },
            });

            // Buscar jogos descartados/já jogados no banco
            let dismissedTitles: string[] = [];
            try {
                const dismissedRows = await prisma.$queryRaw<Array<{ game_title: string }>>`
                    SELECT game_title FROM user_dismissed_deals WHERE user_id = ${userId}
                `;
                dismissedTitles = dismissedRows.map((r) => r.game_title.toLowerCase().trim());
            } catch {
                dismissedTitles = [];
            }

            const favorites: string[] = [];
            const excludedTitles = new Set<string>(dismissedTitles);

            if (user?.favoriteGames) {
                for (const g of user.favoriteGames) {
                    favorites.push(g.title);
                    excludedTitles.add(g.title.toLowerCase().trim());
                }
            }

            if (user?.reviews) {
                for (const r of user.reviews) {
                    if (r.game?.title) {
                        if (!favorites.includes(r.game.title)) {
                            favorites.push(r.game.title);
                        }
                        excludedTitles.add(r.game.title.toLowerCase().trim());
                    }
                }
            }

            if (user?.gameProgress) {
                for (const p of user.gameProgress) {
                    if (p.game?.title) {
                        excludedTitles.add(p.game.title.toLowerCase().trim());
                    }
                }
            }

            if (user?.trackedDeals) {
                for (const td of user.trackedDeals) {
                    excludedTitles.add(td.title.toLowerCase().trim());
                }
            }

            // Se o usuário ainda não cadastrou favoritos, injetar base clássica da guilda
            if (favorites.length === 0) {
                favorites.push(
                    "Chrono Trigger",
                    "Castlevania: Symphony of the Night",
                    "Hades",
                    "Sea of Stars",
                );
            }

            return {
                favorites: favorites.slice(0, 8),
                excludedTitles,
                tasteSummary: `Perfil calibrado com base em ${favorites.length} jogos curtidos e histórico de jogatina.`,
            };
        } catch (err) {
            console.error("[DealsOracleService] getUserTasteProfile error:", err);
            return {
                favorites: ["Chrono Trigger", "Castlevania: Symphony of the Night", "Hades"],
                excludedTitles: new Set<string>(),
                tasteSummary: "Perfil clássico de Gamer Aposentado.",
            };
        }
    }

    /**
     * Consulta o Gemini Flash para obter as 10 recomendações estruturadas em cotas.
     */
    private static async queryGeminiForRecommendations(
        favorites: string[],
        excludedTitles: Set<string>,
    ): Promise<RawOracleItem[]> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("[DealsOracleService] GEMINI_API_KEY not found, using fallback portfolio.");
            return FALLBACK_ORACLE_ITEMS;
        }

        const excludedListFormatted = Array.from(excludedTitles).slice(0, 30).join(", ");
        const favoritesFormatted = favorites.join(", ");

        const prompt = `
Você é o Oráculo Curador do "Gamers Aposentados", uma guilda de jogadores experientes e adultos que amam jogos de qualidade, mas têm pouco tempo livre e odeiam enrolação.

PERFIL DO JOGADOR:
- Jogos que ele ama ou deu nota alta: ${favoritesFormatted}
- JOGOS QUE ELE JÁ JOGOU, FAVORITOU OU DESCARTOU (ESTRITAMENTE PROIBIDO SUGERIR): ${excludedListFormatted}

SUA MISSÃO:
Selecione exatamente 10 jogos para PC disponíveis na Steam que se encaixem rigorosamente nesta DISTRIBUIÇÃO DE COTAS:

1. [3x AAA]: Superproduções consagradas ou clássicos AAA refinados que combinam com o gosto dele.
2. [4x INDIE]: Jogos independentes aclamados com notas muito altas na Steam (>= 85% de aprovação).
3. [3x HIDDEN_GEM]: Pérolas cultas menos conhecidas pelo mainstream, mas verdadeiras obras-primas.

REGRAS RÍGIDAS DE FILTRAGEM (PADRÃO GAMER APOSENTADO):
- PROIBIDO sugerir jogos 'Live-Service', Free-to-play, MMOs infinitos, battle royales ou que dependam de passe de batalha.
- Foco em jogos de campanha com começo, meio e fim (ou roguelites com partidas rápidas de 30 a 45 min).
- O campo 'title' DEVE ser o nome exato comercial do jogo na loja Steam.
- O campo 'category' DEVE ser exatamente 'AAA', 'INDIE' ou 'HIDDEN_GEM'.

SAÍDA OBRIGATÓRIA:
Retorne APENAS um JSON válido contendo uma lista de 10 objetos com este formato exato:
[
  {
    "title": "Nome Exato na Steam",
    "category": "AAA",
    "pitch": "Frase curta de 1 a 2 linhas explicando por que vale a pena pro perfil dele",
    "highlight_reason": "ex: Para quem ama combate por turnos inteligente"
  }
]
`;

        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const res = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(12000),
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.7,
                    },
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.warn(`[DealsOracleService] Gemini call failed (${res.status}):`, errText);
                return FALLBACK_ORACLE_ITEMS;
            }

            const data = await res.json();
            const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textOutput) return FALLBACK_ORACLE_ITEMS;

            const parsed = JSON.parse(textOutput);
            const items: RawOracleItem[] = Array.isArray(parsed)
                ? parsed
                : parsed?.results || parsed?.recommendations || [];

            if (items.length >= 6) {
                return items.slice(0, 10).map((item) => ({
                    title: String(item.title || "").trim(),
                    category: ["AAA", "INDIE", "HIDDEN_GEM"].includes(item.category)
                        ? item.category
                        : "INDIE",
                    pitch: String(item.pitch || "").trim(),
                    highlight_reason: String(item.highlight_reason || "").trim(),
                }));
            }

            return FALLBACK_ORACLE_ITEMS;
        } catch (err) {
            console.error("[DealsOracleService] queryGemini error:", err);
            return FALLBACK_ORACLE_ITEMS;
        }
    }

    /**
     * Enriquece os jogos sugeridos com dados e preços ao vivo da Steam Store.
     */
    private static async enrichWithSteamData(
        rawItems: RawOracleItem[],
    ): Promise<OracleGameRecommendation[]> {
        const enriched = await Promise.all(
            rawItems.map(async (item): Promise<OracleGameRecommendation> => {
                try {
                    // 1. Buscar jogo na Steam
                    const searchResults = await SteamStoreClient.searchGames(item.title);
                    const bestMatch = searchResults[0];

                    let steamAppId = bestMatch?.steamAppId;
                    let coverImage = bestMatch?.coverImage;

                    // Fallback de capa se não encontrar
                    if (!coverImage && steamAppId) {
                        coverImage = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`;
                    }

                    // 2. Buscar preço em BRL e avaliações se tiver appId
                    let priceBR: number | undefined;
                    let regularPriceBR: number | undefined;
                    let discountPercent = 0;
                    let reviews = undefined;

                    if (steamAppId) {
                        const [priceObj, reviewObj] = await Promise.all([
                            SteamStoreClient.getAppPrice(steamAppId, "BR"),
                            SteamStoreClient.getAppReviewsSummary(steamAppId),
                        ]);

                        if (priceObj) {
                            priceBR = priceObj.currentPrice;
                            regularPriceBR = priceObj.regularPrice;
                            discountPercent = priceObj.discountPercent || 0;
                        }

                        if (reviewObj) {
                            reviews = reviewObj;
                        }
                    }

                    const isOnSale = discountPercent > 0;

                    return {
                        title: item.title,
                        tier: item.category,
                        pitch: item.pitch,
                        highlightReason: item.highlight_reason,
                        steamAppId: steamAppId ?? undefined,
                        coverImage:
                            coverImage ||
                            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
                        priceBR,
                        regularPriceBR,
                        discountPercent,
                        isOnSale,
                        steamReviews: reviews,
                        dealUrl: steamAppId
                            ? `https://store.steampowered.com/app/${steamAppId}`
                            : `https://store.steampowered.com/search/?term=${encodeURIComponent(item.title)}`,
                    };
                } catch (err) {
                    console.warn(`[DealsOracleService] enrich error for ${item.title}:`, err);
                    return {
                        title: item.title,
                        tier: item.category,
                        pitch: item.pitch,
                        highlightReason: item.highlight_reason,
                        isOnSale: false,
                        dealUrl: `https://store.steampowered.com/search/?term=${encodeURIComponent(item.title)}`,
                    };
                }
            }),
        );

        return enriched;
    }

    /**
     * Retorna a lista completa de recomendações do Oráculo, separadas em 'onSale' e 'onRadar'.
     */
    static async getOracleRecommendations(
        userId?: string,
        forceRefresh: boolean = false,
    ): Promise<OracleRecommendationsResponse> {
        const cacheKey = `deals:oracle:${userId || "guest"}`;

        if (!forceRefresh) {
            const cached = dealsCache.get<OracleRecommendationsResponse>(cacheKey);
            if (cached) {
                return { ...cached, cached: true };
            }
        }

        // 1. Extrair perfil e histórico de exclusão
        const { favorites, excludedTitles, tasteSummary } =
            await DealsOracleService.getUserTasteProfile(userId);

        // 2. Consultar Gemini Flash
        const rawItems = await DealsOracleService.queryGeminiForRecommendations(
            favorites,
            excludedTitles,
        );

        // 3. Enriquecer com preços reais da Steam
        const enrichedItems = await DealsOracleService.enrichWithSteamData(rawItems);

        // 4. Filtrar qualquer jogo que possa ter colidido com exclusão
        const filtered = enrichedItems.filter(
            (item) => !excludedTitles.has(item.title.toLowerCase().trim()),
        );

        const recommendations = filtered.length >= 6 ? filtered : enrichedItems;

        const onSale = recommendations.filter((r) => r.isOnSale);
        const onRadar = recommendations.filter((r) => !r.isOnSale);

        const response: OracleRecommendationsResponse = {
            recommendations,
            onSale,
            onRadar,
            tasteSummary,
            generatedAt: new Date().toISOString(),
            cached: false,
        };

        // Cache por 12 horas
        dealsCache.set(cacheKey, response, 12 * 60 * 60 * 1000);

        return response;
    }

    /**
     * Registra que o usuário já jogou ou descartou um jogo para nunca mais recomendar.
     */
    static async dismissGame(
        userId: string | null | undefined,
        gameTitle: string,
        steamAppId?: number,
    ): Promise<void> {
        const normalizedTitle = gameTitle.toLowerCase().trim();

        if (userId) {
            try {
                await prisma.$executeRaw`
                    INSERT INTO user_dismissed_deals (id, user_id, game_title, steam_app_id, reason, created_at)
                    VALUES (gen_random_uuid(), ${userId}, ${normalizedTitle}, ${steamAppId || null}, 'already_played', NOW())
                    ON CONFLICT (user_id, game_title) DO NOTHING
                `;
            } catch (err) {
                console.warn("[DealsOracleService] Failed to persist dismissed deal in db:", err);
            }
        }

        // Invalidar cache do usuário para recalcular na próxima consulta
        const cacheKey = `deals:oracle:${userId || "guest"}`;
        dealsCache.delete(cacheKey);
    }
}
