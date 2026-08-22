// src/services/deals/itadClient.ts

import { SearchGameItem, StorePrice, StoreId, FeaturedDealItem, DealFilterType } from "@/types/deals";
import { dealsCache, CACHE_TTL } from "./dealsCache";

const ITAD_API_BASE = "https://api.isthereanydeal.com";

// Whitelist of strictly official and authorized stores
const OFFICIAL_STORE_IDENTIFIERS: Record<string, { id: StoreId; name: string }> = {
    "61": { id: "steam", name: "Steam" },
    "steam": { id: "steam", name: "Steam" },
    "84": { id: "nuuvem", name: "Nuuvem" },
    "nuuvem": { id: "nuuvem", name: "Nuuvem" },
    "29": { id: "greenmangaming", name: "Green Man Gaming" },
    "greenmangaming": { id: "greenmangaming", name: "Green Man Gaming" },
    "37": { id: "humblestore", name: "Humble Store" },
    "humblestore": { id: "humblestore", name: "Humble Store" },
    "humble": { id: "humblestore", name: "Humble Store" },
    "35": { id: "gog", name: "GOG.com" },
    "gog": { id: "gog", name: "GOG.com" },
    "16": { id: "epicgames", name: "Epic Games Store" },
    "epic": { id: "epicgames", name: "Epic Games Store" },
    "62": { id: "other", name: "Fanatical" },
    "fanatical": { id: "other", name: "Fanatical" },
};

// Regex to filter out redundant editions, DLCs, soundtracks, packs and passes
export const EDITION_EXCLUDE_REGEX =
    /\b(deluxe|ultimate|gold edition|collector'?s?|bundle|soundtrack|artbook|pass|dlc|expansion|season pass|costume|skin|upgrade pack|starter pack|edition upgrade|platinum edition|supporter pack)\b/i;

interface ItadDealItemRaw {
    id: string;
    slug: string;
    title: string;
    type?: string;
    assets?: {
        banner600?: string;
        banner400?: string;
        banner300?: string;
        banner145?: string;
        boxart?: string;
    };
    deal?: {
        shop?: { id: number; name: string };
        price?: { amount: number; currency: string };
        regular?: { amount: number; currency: string };
        cut?: number;
        url?: string;
        historyLow?: { amount: number };
        flag?: string;
        flags?: string[];
    };
}

export class ItadClient {
    private static getApiKey(): string | null {
        return process.env.ITAD_API_KEY || null;
    }

    /**
     * Checks whether the ITAD API key is configured.
     */
    static isConfigured(): boolean {
        return Boolean(this.getApiKey());
    }

    /**
     * Searches for games on IsThereAnyDeal.
     */
    static async searchGames(query: string): Promise<SearchGameItem[]> {
        const apiKey = this.getApiKey();
        if (!apiKey || !query.trim()) return [];

        const cacheKey = `itad:search:${query.trim().toLowerCase()}`;
        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                try {
                    const url = new URL(`${ITAD_API_BASE}/games/search/v1`);
                    url.searchParams.set("key", apiKey);
                    url.searchParams.set("title", query.trim());

                    const res = await fetch(url.toString(), {
                        headers: { Accept: "application/json" },
                        next: { revalidate: CACHE_TTL.SEARCH_RESULTS },
                    });

                    if (!res.ok) {
                        console.warn(`[ItadClient] searchGames failed with HTTP ${res.status}`);
                        return [];
                    }

                    const data = await res.json();
                    if (!Array.isArray(data)) return [];

                    return data.map(
                        (item: {
                            id: string;
                            slug: string;
                            title: string;
                            type?: string;
                            assets?: { banner400?: string; banner300?: string };
                        }) => ({
                            id: item.id,
                            title: item.title,
                            slug: item.slug,
                            type: item.type,
                            coverImage: item.assets?.banner400 || item.assets?.banner300 || null,
                        }),
                    );
                } catch (err) {
                    console.error("[ItadClient] Error in searchGames:", err);
                    return [];
                }
            },
            CACHE_TTL.SEARCH_RESULTS,
        );
    }

    /**
     * Fetches current game prices for a single game in a specific region (US or BR).
     */
    static async getPricesForGame(
        gameId: string,
        country: "US" | "BR",
    ): Promise<StorePrice[]> {
        const batchResults = await this.getBatchPrices([gameId], country);
        return batchResults.get(gameId) || [];
    }

    /**
     * BATCH Fetches prices for multiple games in ONE single HTTP request (Fast & Scalable).
     */
    static async getBatchPrices(
        gameIds: string[],
        country: "US" | "BR",
    ): Promise<Map<string, StorePrice[]>> {
        const apiKey = this.getApiKey();
        const resultMap = new Map<string, StorePrice[]>();
        if (!apiKey || gameIds.length === 0) return resultMap;

        try {
            const url = new URL(`${ITAD_API_BASE}/games/prices/v2`);
            url.searchParams.set("key", apiKey);
            url.searchParams.set("country", country);

            const res = await fetch(url.toString(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(gameIds),
                next: { revalidate: CACHE_TTL.GAME_COMPARISON },
            });

            if (!res.ok) {
                console.warn(`[ItadClient] getBatchPrices failed with HTTP ${res.status}`);
                return resultMap;
            }

            const data = await res.json();
            if (!Array.isArray(data)) return resultMap;

            for (const gameEntry of data) {
                const gameId = gameEntry.id;
                const deals = gameEntry.deals || [];
                const storePrices: StorePrice[] = [];

                for (const deal of deals) {
                    const shopId = String(deal.shop?.id || "");
                    const shopName = String(deal.shop?.name || "").toLowerCase();

                    const matchedOfficial =
                        OFFICIAL_STORE_IDENTIFIERS[shopId] ||
                        Object.entries(OFFICIAL_STORE_IDENTIFIERS).find(([key]) =>
                            shopName.includes(key),
                        )?.[1];

                    if (!matchedOfficial) continue;

                    const currentPrice = Number(deal.price?.amount ?? 0);
                    const regularPrice = Number(deal.regular?.amount ?? currentPrice);
                    const discountPercent = Number(deal.cut ?? 0);

                    storePrices.push({
                        storeId: matchedOfficial.id,
                        storeName: matchedOfficial.name,
                        regularPrice,
                        currentPrice,
                        discountPercent,
                        currency: country === "BR" ? "BRL" : "USD",
                        url: deal.url || "",
                        voucher: deal.voucher || null,
                        isOfficial: true,
                    });
                }

                storePrices.sort((a, b) => a.currentPrice - b.currentPrice);
                resultMap.set(gameId, storePrices);
            }
        } catch (err) {
            console.error(`[ItadClient] Error in getBatchPrices (${country}):`, err);
        }

        return resultMap;
    }

    /**
     * Fetches featured deals from ITAD filtering for popular, base games in high speed.
     */
    static async getTopDeals(filter: DealFilterType = "best_savings"): Promise<FeaturedDealItem[]> {
        const apiKey = this.getApiKey();
        if (!apiKey) return [];

        const cacheKey = `itad:top_deals_curated_v2:${filter}`;
        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                try {
                    const urlBR = new URL(`${ITAD_API_BASE}/deals/v2`);
                    urlBR.searchParams.set("key", apiKey);
                    urlBR.searchParams.set("country", "BR");
                    urlBR.searchParams.set("limit", "70");
                    urlBR.searchParams.set("sort", "-trending");

                    const urlUS = new URL(`${ITAD_API_BASE}/deals/v2`);
                    urlUS.searchParams.set("key", apiKey);
                    urlUS.searchParams.set("country", "US");
                    urlUS.searchParams.set("limit", "70");
                    urlUS.searchParams.set("sort", "-trending");

                    const [resBR, resUS] = await Promise.all([
                        fetch(urlBR.toString(), {
                            headers: { Accept: "application/json" },
                            next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                        }),
                        fetch(urlUS.toString(), {
                            headers: { Accept: "application/json" },
                            next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                        }),
                    ]);

                    if (!resBR.ok && !resUS.ok) return [];

                    const dataBR = resBR.ok ? await resBR.json() : { list: [] };
                    const dataUS = resUS.ok ? await resUS.json() : { list: [] };

                    const listBR: ItadDealItemRaw[] = dataBR.list || [];
                    const listUS: ItadDealItemRaw[] = dataUS.list || [];

                    const usMap = new Map<
                        string,
                        { price: number; store: string; url: string; isLowest?: boolean }
                    >();

                    for (const item of listUS) {
                        const deal = item.deal;
                        if (!deal) continue;

                        const shopId = String(deal.shop?.id || "");
                        const shopName = String(deal.shop?.name || "").toLowerCase();
                        const isOfficial =
                            OFFICIAL_STORE_IDENTIFIERS[shopId] ||
                            Object.entries(OFFICIAL_STORE_IDENTIFIERS).find(([key]) =>
                                shopName.includes(key),
                            )?.[1];

                        if (isOfficial) {
                            const isLowest =
                                deal.flag === "L" ||
                                (Array.isArray(deal.flags) && deal.flags.includes("lowest")) ||
                                (deal.historyLow && deal.price && deal.price.amount <= deal.historyLow.amount);

                            usMap.set(item.id, {
                                price: Number(deal.price?.amount ?? 0),
                                store: isOfficial.name,
                                url: deal.url || "",
                                isLowest: Boolean(isLowest),
                            });
                        }
                    }

                    // Filter valid BR candidates first
                    const validBRItems: ItadDealItemRaw[] = [];
                    const missingUsIds: string[] = [];

                    for (const item of listBR) {
                        const deal = item.deal;
                        if (!deal) continue;

                        // Filter base games
                        if (item.type && item.type !== "game") continue;
                        // Filter editions & DLCs
                        if (EDITION_EXCLUDE_REGEX.test(item.title)) continue;
                        // Filter low-value shovelware
                        const regularPrice = Number(deal.regular?.amount ?? 0);
                        if (regularPrice < 15) continue;

                        const shopId = String(deal.shop?.id || "");
                        const shopName = String(deal.shop?.name || "").toLowerCase();
                        const isOfficial =
                            OFFICIAL_STORE_IDENTIFIERS[shopId] ||
                            Object.entries(OFFICIAL_STORE_IDENTIFIERS).find(([key]) =>
                                shopName.includes(key),
                            )?.[1];

                        if (!isOfficial) continue;

                        validBRItems.push(item);

                        if (!usMap.has(item.id)) {
                            missingUsIds.push(item.id);
                        }
                    }

                    // Perform ONE SINGLE batch request for all missing US prices
                    let batchUsPrices = new Map<string, StorePrice[]>();
                    if (missingUsIds.length > 0) {
                        batchUsPrices = await ItadClient.getBatchPrices(missingUsIds, "US");
                    }

                    const featured: FeaturedDealItem[] = [];

                    for (const item of validBRItems) {
                        const deal = item.deal!;
                        const shopId = String(deal.shop?.id || "");
                        const shopName = String(deal.shop?.name || "").toLowerCase();
                        const isOfficial =
                            OFFICIAL_STORE_IDENTIFIERS[shopId] ||
                            Object.entries(OFFICIAL_STORE_IDENTIFIERS).find(([key]) =>
                                shopName.includes(key),
                            )?.[1];

                        const priceBR = Number(deal.price?.amount ?? 0);
                        const isLowestBR =
                            deal.flag === "L" ||
                            (Array.isArray(deal.flags) && deal.flags.includes("lowest")) ||
                            (deal.historyLow && deal.price && deal.price.amount <= deal.historyLow.amount);

                        const usMatch = usMap.get(item.id);

                        let priceUS = usMatch?.price;
                        let storeUS = usMatch?.store || "Steam";
                        let dealUrlUS = usMatch?.url || "";
                        const isLowestUS = usMatch?.isLowest;

                        if (priceUS === undefined) {
                            const resolvedBatch = batchUsPrices.get(item.id);
                            if (resolvedBatch && resolvedBatch.length > 0) {
                                priceUS = resolvedBatch[0].currentPrice;
                                storeUS = resolvedBatch[0].storeName;
                                dealUrlUS = resolvedBatch[0].url;
                            }
                        }

                        const isAllTimeLow = Boolean(isLowestBR || isLowestUS);

                        if (filter === "historical_low" && !isAllTimeLow) {
                            continue;
                        }

                        if (!priceUS || priceUS <= 0 || priceBR <= 0) continue;

                        featured.push({
                            id: item.id,
                            title: item.title,
                            slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                            coverImage:
                                item.assets?.banner600 ||
                                item.assets?.banner400 ||
                                item.assets?.banner300 ||
                                item.assets?.boxart ||
                                null,
                            discountPercent: Number(deal.cut ?? 0),
                            priceUS,
                            priceBR,
                            convertedBRInUSD: 0,
                            winningRegion: "EQUAL",
                            savingsPercent: 0,
                            storeUS,
                            storeBR: isOfficial ? isOfficial.name : "Loja Oficial",
                            isAllTimeLow: Boolean(isAllTimeLow),
                            dealUrlUS,
                            dealUrlBR: deal.url || "",
                        });
                    }

                    return featured;
                } catch (err) {
                    console.error("[ItadClient] Error in getTopDeals:", err);
                    return [];
                }
            },
            CACHE_TTL.FEATURED_DEALS,
        );
    }
}
