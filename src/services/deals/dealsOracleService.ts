// src/services/deals/dealsOracleService.ts

import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import {
    OracleGameRecommendation,
    OracleRecommendationsResponse,
    OracleGameTier,
    WinningRegion,
} from "@/types/deals";
import { dealsCache } from "./dealsCache";
import { SteamStoreClient } from "./steamStoreClient";
import { CurrencyService } from "./currencyService";

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

            // Buscar jogos possuídos (Já Tenho / Na Biblioteca)
            let ownedTitles: string[] = [];
            try {
                const ownedRows = await prisma.$queryRaw<Array<{ title: string }>>`
                    SELECT title FROM user_owned_deals WHERE user_id = ${userId}
                `;
                ownedTitles = ownedRows.map((o) => o.title.trim());
            } catch (ownedErr) {
                console.warn("[DealsOracleService] Failed to load owned deals for taste profile:", ownedErr);
                ownedTitles = [];
            }

            const favorites: string[] = [];
            const excludedTitles = new Set<string>(dismissedTitles);

            // Jogos possuídos na biblioteca: NUNCA recomendar, mas usar como inspiração de gosto
            for (const ot of ownedTitles) {
                excludedTitles.add(ot.toLowerCase().trim());
                if (!favorites.some((f) => f.toLowerCase().trim() === ot.toLowerCase().trim())) {
                    favorites.push(ot);
                }
            }

            if (user?.favoriteGames) {
                for (const g of user.favoriteGames) {
                    if (!favorites.some((f) => f.toLowerCase().trim() === g.title.toLowerCase().trim())) {
                        favorites.push(g.title);
                    }
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
     * Consulta o Gemini Flash para obter as recomendações estruturadas em cotas.
     * Utiliza o SDK oficial com thinkingBudget: 0 para respostas ultrarrápidas (< 5s),
     * suporta contagem dinâmica para completar vagas faltantes e evita repetições.
     */
    private static async queryGeminiForRecommendations(
        favorites: string[],
        excludedTitles: Set<string>,
        count: number = 10,
        currentTitlesOnScreen: string[] = [],
    ): Promise<RawOracleItem[]> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("[DealsOracleService] GEMINI_API_KEY not found, using fallback portfolio.");
            return FALLBACK_ORACLE_ITEMS.slice(0, count);
        }

        const randomSeed = Math.floor(Math.random() * 1000000);
        const excludedListFormatted = Array.from(excludedTitles).slice(0, 40).join(", ");
        const favoritesFormatted = favorites.join(", ");
        const onScreenFormatted = currentTitlesOnScreen.slice(0, 15).join(", ");

        let quotaInstruction = `1. [3x AAA]: Superproduções consagradas ou clássicos AAA refinados que combinam com o gosto dele.
2. [4x INDIE]: Jogos independentes aclamados com notas muito altas na Steam (>= 85% de aprovação).
3. [3x HIDDEN_GEM]: Pérolas cultas menos conhecidas pelo mainstream, mas verdadeiras obras-primas.`;

        if (count < 10) {
            quotaInstruction = `Selecione exatamente ${count} jogos variados para PC distribuídos de forma equilibrada entre as categorias 'AAA', 'INDIE' e 'HIDDEN_GEM'.`;
        }

        const prompt = `
Você é o Oráculo Curador do "Gamers Aposentados", uma guilda de jogadores experientes e adultos que amam jogos de qualidade, mas têm pouco tempo livre e odeiam enrolação.

PERFIL DO JOGADOR:
- Jogos que ele ama, possui na biblioteca ou deu nota alta (REFERÊNCIAS DE GOSTO PARA VOCÊ SE INSPIRAR): ${favoritesFormatted}
- JOGOS QUE ELE JÁ TEM NA BIBLIOTECA, JÁ JOGOU, FAVORITOU OU DESCARTOU (ESTRITAMENTE PROIBIDO SUGERIR): ${excludedListFormatted}
${onScreenFormatted ? `- JOGOS QUE JÁ ESTÃO SENDO EXIBIDOS NA TELA (NÃO REPETIR NESTA RODADA): ${onScreenFormatted}` : ""}

SESSÃO DE GARIMPO #${randomSeed}:
Explore recomendações diversificadas, criativas e autênticas. Não traga sempre os mesmos títulos óbvios; varie entre clássicos cultuados, indie hits e joias escondidas.

SUA MISSÃO:
Selecione exatamente ${count} jogos para PC disponíveis na Steam que se encaixem rigorosamente nesta distribuição:
${quotaInstruction}

REGRAS RÍGIDAS DE FILTRAGEM (PADRÃO GAMER APOSENTADO):
- PROIBIDO sugerir jogos 'Live-Service', Free-to-play, MMOs infinitos, battle royales ou que dependam de passe de batalha.
- Foco em jogos de campanha com começo, meio e fim (ou roguelites com partidas rápidas de 30 a 45 min).
- O campo 'title' DEVE ser o nome exato comercial do jogo na loja Steam.
- O campo 'category' DEVE ser exatamente 'AAA', 'INDIE' ou 'HIDDEN_GEM'.

SAÍDA OBRIGATÓRIA:
Retorne APENAS um JSON válido contendo uma lista de ${count} objetos com este formato exato:
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
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.95,
                    thinkingConfig: {
                        thinkingBudget: 0,
                    },
                },
            });

            const textOutput = response.text;
            if (!textOutput) return FALLBACK_ORACLE_ITEMS.slice(0, count);

            const parsed = JSON.parse(textOutput);
            const items: RawOracleItem[] = Array.isArray(parsed)
                ? parsed
                : parsed?.results || parsed?.recommendations || [];

            if (items.length >= Math.min(count, 3)) {
                return items.slice(0, count).map((item) => ({
                    title: String(item.title || "").trim(),
                    category: ["AAA", "INDIE", "HIDDEN_GEM"].includes(item.category)
                        ? item.category
                        : "INDIE",
                    pitch: String(item.pitch || "").trim(),
                    highlight_reason: String(item.highlight_reason || "").trim(),
                }));
            }

            return FALLBACK_ORACLE_ITEMS.slice(0, count);
        } catch (err) {
            console.error("[DealsOracleService] queryGemini error:", err);
            return FALLBACK_ORACLE_ITEMS.slice(0, count);
        }
    }

    /**
     * Enriquece os jogos sugeridos com dados e preços ao vivo da Steam Store.
     */
    private static async enrichWithSteamData(
        rawItems: RawOracleItem[],
    ): Promise<OracleGameRecommendation[]> {
        // Fetch current USD -> BRL exchange rate for comparison
        let rate = 5.85;
        try {
            const currencyData = await CurrencyService.getUsdBrlRate();
            if (currencyData?.rate) {
                rate = currencyData.rate;
            }
        } catch (e) {
            console.warn("[DealsOracleService] Failed to fetch live currency rate, using fallback 5.85:", e);
        }

        const enriched = await Promise.all(
            rawItems.map(async (item): Promise<OracleGameRecommendation> => {
                try {
                    // 1. Buscar jogo na Steam
                    const searchResults = await SteamStoreClient.searchGames(item.title);
                    const bestMatch = searchResults[0];

                    const steamAppId = bestMatch?.steamAppId;
                    let coverImage = bestMatch?.coverImage;

                    // Fallback de capa se não encontrar
                    if (!coverImage && steamAppId) {
                        coverImage = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`;
                    }

                    // 2. Buscar preços em BRL e USD e avaliações se tiver appId
                    let priceBR: number | undefined;
                    let regularPriceBR: number | undefined;
                    let priceUS: number | undefined;
                    let regularPriceUS: number | undefined;
                    let discountPercent = 0;
                    let reviews = undefined;
                    let winningRegion: WinningRegion = "EQUAL";
                    let savingsPercent = 0;
                    let absoluteSavingsBRL = 0;
                    let isFamilySharing = false;

                    if (steamAppId) {
                        const [priceObjBR, priceObjUS, reviewObj, isFS] = await Promise.all([
                            SteamStoreClient.getAppPrice(steamAppId, "BR"),
                            SteamStoreClient.getAppPrice(steamAppId, "US"),
                            SteamStoreClient.getAppReviewsSummary(steamAppId),
                            SteamStoreClient.isFamilySharingSupported(steamAppId),
                        ]);

                        isFamilySharing = isFS;

                        if (priceObjBR) {
                            priceBR = priceObjBR.currentPrice;
                            regularPriceBR = priceObjBR.regularPrice;
                            discountPercent = priceObjBR.discountPercent || 0;
                        }

                        if (priceObjUS) {
                            priceUS = priceObjUS.currentPrice;
                            regularPriceUS = priceObjUS.regularPrice;
                            if (!discountPercent && priceObjUS.discountPercent) {
                                discountPercent = priceObjUS.discountPercent;
                            }
                        }

                        if (reviewObj) {
                            reviews = reviewObj;
                        }

                        // Comparação de Regiões US x BR
                        if (priceBR !== undefined && priceUS !== undefined) {
                            const priceUsInUsd = priceUS;
                            const priceBrInUsd = CurrencyService.convertBrlToUsd(priceBR, rate);
                            const priceUsInBrl = CurrencyService.convertUsdToBrl(priceUS, rate);
                            const priceBrInBrl = priceBR;

                            const diffUsd = Number((priceUsInUsd - priceBrInUsd).toFixed(2));

                            if (Math.abs(diffUsd) < 0.05 || (priceUsInUsd === 0 && priceBrInBrl === 0)) {
                                winningRegion = "EQUAL";
                                savingsPercent = 0;
                                absoluteSavingsBRL = 0;
                            } else if (priceBrInUsd < priceUsInUsd) {
                                winningRegion = "BR";
                                absoluteSavingsBRL = Number((priceUsInBrl - priceBrInBrl).toFixed(2));
                                savingsPercent =
                                    priceUsInUsd > 0
                                        ? Math.min(100, Math.round(((priceUsInUsd - priceBrInUsd) / priceUsInUsd) * 100))
                                        : 0;
                            } else {
                                winningRegion = "US";
                                absoluteSavingsBRL = Number((priceBrInBrl - priceUsInBrl).toFixed(2));
                                savingsPercent =
                                    priceBrInUsd > 0
                                        ? Math.min(100, Math.round(((priceBrInUsd - priceUsInUsd) / priceBrInUsd) * 100))
                                        : 0;
                            }
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
                        priceUS,
                        regularPriceUS,
                        discountPercent,
                        isOnSale,
                        steamReviews: reviews,
                        winningRegion,
                        savingsPercent,
                        absoluteSavingsBRL,
                        isFamilySharing,
                        priceCheckedAt: new Date().toISOString(),
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
                        priceCheckedAt: new Date().toISOString(),
                        dealUrl: `https://store.steampowered.com/search/?term=${encodeURIComponent(item.title)}`,
                    };
                }
            }),
        );

        return enriched;
    }

    /**
     * Revalida os preços e promoções ao vivo na Steam para uma lista existente de recomendações.
     * Não invoca a IA Gemini (zero custo de tokens), executando rapidamente via chamadas paralelas na Steam.
     */
    static async refreshRecommendationsPrices(
        recs: OracleGameRecommendation[],
    ): Promise<OracleGameRecommendation[]> {
        if (!Array.isArray(recs) || recs.length === 0) {
            return [];
        }

        let rate = 5.85;
        try {
            const currencyData = await CurrencyService.getUsdBrlRate();
            if (currencyData?.rate) {
                rate = currencyData.rate;
            }
        } catch (e) {
            console.warn("[DealsOracleService] Failed to fetch currency rate for price refresh, using fallback:", e);
        }

        const nowIso = new Date().toISOString();

        const updated = await Promise.all(
            recs.map(async (item): Promise<OracleGameRecommendation> => {
                try {
                    let steamAppId = item.steamAppId;

                    if (!steamAppId && item.title) {
                        const searchResults = await SteamStoreClient.searchGames(item.title);
                        if (searchResults[0]?.steamAppId) {
                            steamAppId = searchResults[0].steamAppId;
                        }
                    }

                    if (!steamAppId) {
                        return {
                            ...item,
                            priceCheckedAt: nowIso,
                        };
                    }

                    const [priceObjBR, priceObjUS, isFS] = await Promise.all([
                        SteamStoreClient.getAppPrice(steamAppId, "BR"),
                        SteamStoreClient.getAppPrice(steamAppId, "US"),
                        item.isFamilySharing !== undefined
                            ? Promise.resolve(item.isFamilySharing)
                            : SteamStoreClient.isFamilySharingSupported(steamAppId),
                    ]);

                    let priceBR = priceObjBR?.currentPrice ?? item.priceBR;
                    let regularPriceBR = priceObjBR?.regularPrice ?? item.regularPriceBR ?? priceBR;
                    let priceUS = priceObjUS?.currentPrice ?? item.priceUS;
                    let regularPriceUS = priceObjUS?.regularPrice ?? item.regularPriceUS ?? priceUS;
                    let discountPercent = priceObjBR?.discountPercent || priceObjUS?.discountPercent || 0;

                    if (!discountPercent || discountPercent <= 0) {
                        discountPercent = 0;
                        if (priceBR !== undefined && regularPriceBR !== undefined && regularPriceBR > priceBR) {
                            discountPercent = Math.round(((regularPriceBR - priceBR) / regularPriceBR) * 100);
                        }
                    }

                    let winningRegion: WinningRegion = item.winningRegion || "EQUAL";
                    let savingsPercent = item.savingsPercent || 0;
                    let absoluteSavingsBRL = item.absoluteSavingsBRL || 0;

                    if (priceBR !== undefined && priceUS !== undefined) {
                        const priceUsInUsd = priceUS;
                        const priceBrInUsd = CurrencyService.convertBrlToUsd(priceBR, rate);
                        const priceUsInBrl = CurrencyService.convertUsdToBrl(priceUS, rate);
                        const priceBrInBrl = priceBR;

                        const diffUsd = Number((priceUsInUsd - priceBrInUsd).toFixed(2));

                        if (Math.abs(diffUsd) < 0.05 || (priceUsInUsd === 0 && priceBrInBrl === 0)) {
                            winningRegion = "EQUAL";
                            savingsPercent = 0;
                            absoluteSavingsBRL = 0;
                        } else if (priceBrInUsd < priceUsInUsd) {
                            winningRegion = "BR";
                            absoluteSavingsBRL = Number((priceUsInBrl - priceBrInBrl).toFixed(2));
                            savingsPercent =
                                priceUsInUsd > 0
                                ? Math.min(100, Math.round(((priceUsInUsd - priceBrInUsd) / priceUsInUsd) * 100))
                                : 0;
                        } else {
                            winningRegion = "US";
                            absoluteSavingsBRL = Number((priceBrInBrl - priceUsInBrl).toFixed(2));
                            savingsPercent =
                                priceBrInUsd > 0
                                ? Math.min(100, Math.round(((priceBrInUsd - priceUsInUsd) / priceBrInUsd) * 100))
                                : 0;
                        }
                    }

                    const isOnSale = discountPercent > 0;

                    return {
                        ...item,
                        steamAppId,
                        priceBR,
                        regularPriceBR,
                        priceUS,
                        regularPriceUS,
                        discountPercent,
                        isOnSale,
                        winningRegion,
                        savingsPercent,
                        absoluteSavingsBRL,
                        isFamilySharing: isFS,
                        priceCheckedAt: nowIso,
                    };
                } catch (err) {
                    console.warn(`[DealsOracleService] Failed to refresh prices for ${item.title}:`, err);
                    return {
                        ...item,
                        priceCheckedAt: nowIso,
                    };
                }
            }),
        );

        return updated;
    }

    /**
     * Retorna os títulos (em minúsculas) que o usuário já possui ou descartou.
     */
    static async getUserExcludedTitles(userId?: string): Promise<Set<string>> {
        const excluded = new Set<string>();
        if (!userId) return excluded;

        try {
            const [dismissedRows, ownedRows] = await Promise.all([
                prisma.$queryRaw<Array<{ game_title: string }>>`
                    SELECT game_title FROM user_dismissed_deals WHERE user_id = ${userId}
                `.catch(() => []),
                prisma.$queryRaw<Array<{ title: string }>>`
                    SELECT title FROM user_owned_deals WHERE user_id = ${userId}
                `.catch(() => []),
            ]);

            for (const d of dismissedRows) {
                if (d.game_title) excluded.add(d.game_title.toLowerCase().trim());
            }
            for (const o of ownedRows) {
                if (o.title) excluded.add(o.title.toLowerCase().trim());
            }
        } catch (err) {
            console.warn("[DealsOracleService] getUserExcludedTitles error:", err);
        }

        return excluded;
    }

    /**
     * Retorna a lista completa de recomendações do Oráculo, separadas em 'onSale' e 'onRadar'.
     * Suporta revalidação automática ou sob demanda de preços na Steam.
     */
    static async getOracleRecommendations(
        userId?: string,
        forceRefresh: boolean = false,
        refreshPrices: boolean = false,
    ): Promise<OracleRecommendationsResponse> {
        const cacheKey = `deals:oracle:${userId || "guest"}`;
        const userExclusions = await DealsOracleService.getUserExcludedTitles(userId);

        if (!forceRefresh && !refreshPrices) {
            // 1. Verificar cache em memória do processo
            const cached = dealsCache.get<OracleRecommendationsResponse>(cacheKey);
            if (cached) {
                const filteredRecs = cached.recommendations.filter(
                    (r) => !userExclusions.has(r.title.toLowerCase().trim()),
                );
                return {
                    ...cached,
                    recommendations: filteredRecs,
                    onSale: filteredRecs.filter((r) => r.isOnSale),
                    onRadar: filteredRecs.filter((r) => !r.isOnSale),
                    dismissedTitles: Array.from(userExclusions),
                    cached: true,
                };
            }
        }

        // 2. Verificar persistência permanente no PostgreSQL (se não for forceRefresh com IA)
        if (!forceRefresh && userId) {
            try {
                const savedRows = await prisma.$queryRaw<Array<{
                    recommendations: any;
                    taste_summary: string | null;
                    generated_at: Date;
                }>>`
                    SELECT recommendations, taste_summary, generated_at
                    FROM user_oracle_recommendations
                    WHERE user_id = ${userId}
                `;
                if (savedRows && savedRows.length > 0) {
                    const row = savedRows[0];
                    let recs: OracleGameRecommendation[] =
                        typeof row.recommendations === "string"
                            ? JSON.parse(row.recommendations)
                            : row.recommendations;

                    if (Array.isArray(recs) && recs.length > 0) {
                        // Checar se os preços estão desatualizados (mais de 30 min ou nunca verificados)
                        const lastChecked = recs[0]?.priceCheckedAt
                            ? new Date(recs[0].priceCheckedAt).getTime()
                            : 0;
                        const isPriceStale =
                            refreshPrices ||
                            !lastChecked ||
                            Date.now() - lastChecked > 30 * 60 * 1000;

                        if (isPriceStale) {
                            try {
                                recs = await DealsOracleService.refreshRecommendationsPrices(recs);
                                const updatedJson = JSON.stringify(recs);
                                await prisma.$executeRaw`
                                    UPDATE user_oracle_recommendations
                                    SET recommendations = ${updatedJson}::jsonb
                                    WHERE user_id = ${userId}
                                `;
                            } catch (refreshErr) {
                                console.warn("[DealsOracleService] Error refreshing prices from Steam:", refreshErr);
                            }
                        }

                        const filteredRecs = recs.filter(
                            (r) => !userExclusions.has(r.title.toLowerCase().trim()),
                        );
                        const onSale = filteredRecs.filter((r) => r.isOnSale);
                        const onRadar = filteredRecs.filter((r) => !r.isOnSale);
                        let currencyRate = undefined;
                        try {
                            currencyRate = await CurrencyService.getUsdBrlRate();
                        } catch {}

                        const latestCheckedAt =
                            recs.find((r) => r.priceCheckedAt)?.priceCheckedAt ||
                            new Date().toISOString();

                        const response: OracleRecommendationsResponse = {
                            recommendations: filteredRecs,
                            onSale,
                            onRadar,
                            tasteSummary: row.taste_summary || "Perfil personalizado da Guilda",
                            generatedAt: row.generated_at
                                ? new Date(row.generated_at).toISOString()
                                : new Date().toISOString(),
                            pricesUpdatedAt: latestCheckedAt,
                            cached: !isPriceStale && !refreshPrices,
                            currencyRate,
                            dismissedTitles: Array.from(userExclusions),
                        };

                        // Salvar na memória por 30 minutos (1800 segundos)
                        dealsCache.set(cacheKey, response, 30 * 60);
                        return response;
                    }
                }
            } catch (dbErr) {
                console.warn("[DealsOracleService] Failed reading saved recommendations from DB:", dbErr);
            }
        }

        // 3. Usuário anônimo/visitante com cache em memória
        if (!forceRefresh && !userId) {
            const cached = dealsCache.get<OracleRecommendationsResponse>(cacheKey);
            if (cached && cached.recommendations?.length > 0) {
                let recs = cached.recommendations;
                if (refreshPrices) {
                    try {
                        recs = await DealsOracleService.refreshRecommendationsPrices(recs);
                    } catch {}
                }
                const filteredRecs = recs.filter(
                    (r) => !userExclusions.has(r.title.toLowerCase().trim()),
                );
                const response: OracleRecommendationsResponse = {
                    ...cached,
                    recommendations: filteredRecs,
                    onSale: filteredRecs.filter((r) => r.isOnSale),
                    onRadar: filteredRecs.filter((r) => !r.isOnSale),
                    pricesUpdatedAt: new Date().toISOString(),
                    cached: !refreshPrices,
                };
                dealsCache.set(cacheKey, response, 30 * 60);
                return response;
            }
        }

        // 4. Extrair perfil e histórico de exclusão para nova geração (ou fallback)
        const { favorites, excludedTitles, tasteSummary } =
            await DealsOracleService.getUserTasteProfile(userId);

        // Se forceRefresh=true, recuperar jogos válidos atualmente na tela para preservar e só repor as vagas faltantes
        let currentSurviving: OracleGameRecommendation[] = [];
        if (forceRefresh) {
            const cached = dealsCache.get<OracleRecommendationsResponse>(cacheKey);
            if (cached?.recommendations) {
                currentSurviving = cached.recommendations.filter(
                    (r) => !userExclusions.has(r.title.toLowerCase().trim()),
                );
            } else if (userId) {
                try {
                    const savedRows = await prisma.$queryRaw<Array<{ recommendations: any }>>`
                        SELECT recommendations FROM user_oracle_recommendations WHERE user_id = ${userId}
                    `;
                    if (savedRows && savedRows.length > 0) {
                        const recs =
                            typeof savedRows[0].recommendations === "string"
                                ? JSON.parse(savedRows[0].recommendations)
                                : savedRows[0].recommendations;
                        if (Array.isArray(recs)) {
                            currentSurviving = recs.filter(
                                (r: OracleGameRecommendation) =>
                                    !userExclusions.has(r.title.toLowerCase().trim()),
                            );
                        }
                    }
                } catch {}
            }

            // Atualizar os preços dos jogos sobreviventes para garantir cotações novas
            if (currentSurviving.length > 0) {
                try {
                    currentSurviving = await DealsOracleService.refreshRecommendationsPrices(currentSurviving);
                } catch {}
            }
        }

        let recommendations: OracleGameRecommendation[] = [];

        // Caso 1: Usuário já tem jogos na tela (ex: 6 ou 7) e precisa apenas repor os espaços faltantes
        if (currentSurviving.length > 0 && currentSurviving.length < 10) {
            const neededCount = 10 - currentSurviving.length;
            const currentTitles = currentSurviving.map((s) => s.title);

            const rawItems = await DealsOracleService.queryGeminiForRecommendations(
                favorites,
                excludedTitles,
                neededCount,
                currentTitles,
            );

            const enrichedItems = await DealsOracleService.enrichWithSteamData(rawItems);
            const filteredNew = enrichedItems.filter(
                (item) =>
                    !excludedTitles.has(item.title.toLowerCase().trim()) &&
                    !currentSurviving.some(
                        (s) => s.title.toLowerCase().trim() === item.title.toLowerCase().trim(),
                    ),
            );

            recommendations = [...currentSurviving, ...filteredNew].slice(0, 10);
        } else {
            // Caso 2: Tela cheia (10 jogos) atualizando para nova safra, ou primeira consulta do usuário
            const currentTitles = currentSurviving.length >= 10 ? currentSurviving.map((s) => s.title) : [];

            const rawItems = await DealsOracleService.queryGeminiForRecommendations(
                favorites,
                excludedTitles,
                10,
                currentTitles,
            );

            const enrichedItems = await DealsOracleService.enrichWithSteamData(rawItems);
            const filtered = enrichedItems.filter(
                (item) => !excludedTitles.has(item.title.toLowerCase().trim()),
            );

            recommendations = filtered.length > 0 ? filtered : enrichedItems;
        }

        const onSale = recommendations.filter((r) => r.isOnSale);
        const onRadar = recommendations.filter((r) => !r.isOnSale);

        let currencyRate = undefined;
        try {
            currencyRate = await CurrencyService.getUsdBrlRate();
        } catch {}

        const nowIso = new Date().toISOString();
        const response: OracleRecommendationsResponse = {
            recommendations,
            onSale,
            onRadar,
            tasteSummary,
            generatedAt: nowIso,
            pricesUpdatedAt: nowIso,
            cached: false,
            currencyRate,
            dismissedTitles: Array.from(excludedTitles),
        };

        // Cache por 30 minutos em memória (1800 segundos)
        dealsCache.set(cacheKey, response, 30 * 60);

        // Persistência permanente no PostgreSQL
        if (userId) {
            try {
                const recsJson = JSON.stringify(recommendations);
                await prisma.$executeRaw`
                    INSERT INTO user_oracle_recommendations (user_id, recommendations, taste_summary, generated_at)
                    VALUES (${userId}, ${recsJson}::jsonb, ${tasteSummary}, NOW())
                    ON CONFLICT (user_id) DO UPDATE SET
                        recommendations = EXCLUDED.recommendations,
                        taste_summary = EXCLUDED.taste_summary,
                        generated_at = NOW()
                `;
            } catch (dbSaveErr) {
                console.warn("[DealsOracleService] Failed saving recommendations to DB:", dbSaveErr);
            }
        }

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

            try {
                const savedRows = await prisma.$queryRaw<Array<{ recommendations: any }>>`
                    SELECT recommendations FROM user_oracle_recommendations WHERE user_id = ${userId}
                `;
                if (savedRows && savedRows.length > 0) {
                    const recs =
                        typeof savedRows[0].recommendations === "string"
                            ? JSON.parse(savedRows[0].recommendations)
                            : savedRows[0].recommendations;
                    if (Array.isArray(recs)) {
                        const updatedRecs = recs.filter(
                            (r: OracleGameRecommendation) => r.title.toLowerCase().trim() !== normalizedTitle,
                        );
                        const updatedJson = JSON.stringify(updatedRecs);
                        await prisma.$executeRaw`
                            UPDATE user_oracle_recommendations
                            SET recommendations = ${updatedJson}::jsonb
                            WHERE user_id = ${userId}
                        `;
                    }
                }
            } catch (recErr) {
                console.warn("[DealsOracleService] Failed to remove dismissed deal from user_oracle_recommendations:", recErr);
            }
        }

        // Atualizar o cache em memória sem limpar tudo (para não forçar re-consulta da IA)
        const cacheKey = `deals:oracle:${userId || "guest"}`;
        const cached = dealsCache.get<OracleRecommendationsResponse>(cacheKey);
        if (cached) {
            const updatedRecs = cached.recommendations.filter(
                (r) => r.title.toLowerCase().trim() !== normalizedTitle,
            );
            const updatedResponse: OracleRecommendationsResponse = {
                ...cached,
                recommendations: updatedRecs,
                onSale: updatedRecs.filter((r) => r.isOnSale),
                onRadar: updatedRecs.filter((r) => !r.isOnSale),
            };
            dealsCache.set(cacheKey, updatedResponse, 30 * 60);
        }
    }
}
