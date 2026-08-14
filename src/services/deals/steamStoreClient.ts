// src/services/deals/steamStoreClient.ts

import { SearchGameItem, StorePrice, FeaturedDealItem } from "@/types/deals";
import { dealsCache, CACHE_TTL } from "./dealsCache";
import { EDITION_EXCLUDE_REGEX } from "./itadClient";

export interface SteamAppDetailsPrice {
    currency: string;
    initial: number; // in cents
    final: number; // in cents
    discount_percent: number;
    initial_formatted?: string;
    final_formatted?: string;
}

export class SteamStoreClient {
    /**
     * Searches Steam Store by name for games.
     */
    static async searchGames(query: string): Promise<SearchGameItem[]> {
        if (!query.trim()) return [];
        const cacheKey = `steam:search:${query.trim().toLowerCase()}`;

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                try {
                    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
                        query.trim(),
                    )}&l=english&cc=US`;

                    const res = await fetch(url, {
                        headers: {
                            Accept: "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        },
                        next: { revalidate: CACHE_TTL.SEARCH_RESULTS },
                    });

                    if (!res.ok) return [];

                    const data = await res.json();
                    if (!data.items || !Array.isArray(data.items)) return [];

                    return data.items.map(
                        (item: { id: number; name: string; tiny_image?: string }) => ({
                            id: String(item.id),
                            title: item.name,
                            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                            steamAppId: item.id,
                            coverImage: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
                            type: "game",
                        }),
                    );
                } catch (err) {
                    console.error("[SteamStoreClient] searchGames error:", err);
                    return [];
                }
            },
            CACHE_TTL.SEARCH_RESULTS,
        );
    }

    /**
     * Fetches prices for a Steam App ID in a specific currency/country (US or BR).
     */
    static async getAppPrice(
        appId: number,
        country: "US" | "BR",
    ): Promise<StorePrice | null> {
        const cacheKey = `steam:price:${appId}:${country}`;

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                try {
                    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${country.toLowerCase()}&filters=price_overview,basic`;

                    const res = await fetch(url, {
                        headers: {
                            Accept: "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        },
                        next: { revalidate: CACHE_TTL.GAME_COMPARISON },
                    });

                    if (!res.ok) return null;

                    const data = await res.json();
                    const appData = data[String(appId)];

                    if (!appData?.success || !appData?.data) return null;

                    const priceOverview = appData.data.price_overview as
                        | SteamAppDetailsPrice
                        | undefined;
                    const isFree = appData.data.is_free === true;

                    if (isFree) {
                        return {
                            storeId: "steam",
                            storeName: "Steam",
                            regularPrice: 0,
                            currentPrice: 0,
                            discountPercent: 0,
                            currency: country === "BR" ? "BRL" : "USD",
                            url: `https://store.steampowered.com/app/${appId}`,
                            isOfficial: true,
                        };
                    }

                    if (!priceOverview) return null;

                    const regularPrice = Number((priceOverview.initial / 100).toFixed(2));
                    const currentPrice = Number((priceOverview.final / 100).toFixed(2));
                    const discountPercent = Number(priceOverview.discount_percent || 0);

                    return {
                        storeId: "steam",
                        storeName: "Steam",
                        regularPrice,
                        currentPrice,
                        discountPercent,
                        currency: country === "BR" ? "BRL" : "USD",
                        url: `https://store.steampowered.com/app/${appId}`,
                        isOfficial: true,
                    };
                } catch (err) {
                    console.error(`[SteamStoreClient] getAppPrice error (${country}):`, err);
                    return null;
                }
            },
            CACHE_TTL.GAME_COMPARISON,
        );
    }

    /**
     * Fetches featured specials directly from Steam Store for US and BR, ensuring both regional prices are resolved.
     */
    static async getFeaturedSpecials(): Promise<FeaturedDealItem[]> {
        const cacheKey = "steam:featured_specials";

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                try {
                    // Fetch US specials and BR specials in parallel
                    const [resUS, resBR] = await Promise.all([
                        fetch("https://store.steampowered.com/api/featuredcategories/?cc=us", {
                            headers: { "User-Agent": "Mozilla/5.0" },
                            next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                        }),
                        fetch("https://store.steampowered.com/api/featuredcategories/?cc=br", {
                            headers: { "User-Agent": "Mozilla/5.0" },
                            next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                        }),
                    ]);

                    if (!resUS.ok || !resBR.ok) return [];

                    const [dataUS, dataBR] = await Promise.all([resUS.json(), resBR.json()]);

                    const specialsUS = dataUS?.specials?.items || [];
                    const specialsBR = dataBR?.specials?.items || [];

                    const specialsBRMap = new Map<
                        number,
                        { original_price: number; final_price: number; discount_percent: number }
                    >();

                    for (const item of specialsBR) {
                        specialsBRMap.set(item.id, {
                            original_price: item.original_price / 100,
                            final_price: item.final_price / 100,
                            discount_percent: item.discount_percent,
                        });
                    }

                    const specialsUSMap = new Map<
                        number,
                        { original_price: number; final_price: number; discount_percent: number }
                    >();

                    for (const item of specialsUS) {
                        specialsUSMap.set(item.id, {
                            original_price: item.original_price / 100,
                            final_price: item.final_price / 100,
                            discount_percent: item.discount_percent,
                        });
                    }

                    // Collect candidate items from both US and BR specials
                    const combinedCandidates: Array<{
                        id: number;
                        name: string;
                        header_image?: string;
                        discount_percent: number;
                        priceUS?: number;
                        priceBR?: number;
                    }> = [];

                    const seenAppIds = new Set<number>();

                    // 1. Process US items
                    for (const item of specialsUS) {
                        if (seenAppIds.has(item.id)) continue;
                        if (EDITION_EXCLUDE_REGEX.test(item.name)) continue;
                        seenAppIds.add(item.id);

                        const brData = specialsBRMap.get(item.id);
                        combinedCandidates.push({
                            id: item.id,
                            name: item.name,
                            header_image: item.header_image,
                            discount_percent: item.discount_percent,
                            priceUS: item.final_price / 100,
                            priceBR: brData?.final_price,
                        });
                    }

                    // 2. Process BR items not in US list
                    for (const item of specialsBR) {
                        if (seenAppIds.has(item.id)) continue;
                        if (EDITION_EXCLUDE_REGEX.test(item.name)) continue;
                        seenAppIds.add(item.id);

                        const usData = specialsUSMap.get(item.id);
                        combinedCandidates.push({
                            id: item.id,
                            name: item.name,
                            header_image: item.header_image,
                            discount_percent: item.discount_percent,
                            priceUS: usData?.final_price,
                            priceBR: item.final_price / 100,
                        });
                    }

                    // 3. Resolve any missing prices via appdetails in parallel
                    const resolvedItems: (FeaturedDealItem | null)[] = await Promise.all(
                        combinedCandidates.map(async (candidate): Promise<FeaturedDealItem | null> => {
                            let pUS = candidate.priceUS;
                            let pBR = candidate.priceBR;

                            // If BR price is missing, fetch it
                            if (pBR === undefined || pBR === null) {
                                const brPriceObj = await SteamStoreClient.getAppPrice(
                                    candidate.id,
                                    "BR",
                                );
                                pBR = brPriceObj?.currentPrice ?? undefined;
                            }

                            // If US price is missing, fetch it
                            if (pUS === undefined || pUS === null) {
                                const usPriceObj = await SteamStoreClient.getAppPrice(
                                    candidate.id,
                                    "US",
                                );
                                pUS = usPriceObj?.currentPrice ?? undefined;
                            }

                            // If either is missing or invalid, filter out
                            if (pUS === undefined || pBR === undefined || (pUS === 0 && pBR > 0) || (pBR === 0 && pUS > 0)) {
                                return null;
                            }

                            return {
                                id: `steam-${candidate.id}`,
                                title: candidate.name,
                                slug: candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                                steamAppId: candidate.id,
                                coverImage:
                                    candidate.header_image ||
                                    `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${candidate.id}/header.jpg`,
                                discountPercent: candidate.discount_percent || 0,
                                priceUS: Number(pUS.toFixed(2)),
                                priceBR: Number(pBR.toFixed(2)),
                                convertedBRInUSD: 0, // calculated by comparator
                                winningRegion: "EQUAL",
                                savingsPercent: 0,
                                storeUS: "Steam",
                                storeBR: "Steam",
                                dealUrlUS: `https://store.steampowered.com/app/${candidate.id}`,
                                dealUrlBR: `https://store.steampowered.com/app/${candidate.id}`,
                            };
                        }),
                    );

                    // Filter nulls and return up to 16 clean deals
                    return resolvedItems.filter(
                        (item): item is FeaturedDealItem => item !== null,
                    ).slice(0, 16);
                } catch (err) {
                    console.error("[SteamStoreClient] getFeaturedSpecials error:", err);
                    return [];
                }
            },
            CACHE_TTL.FEATURED_DEALS,
        );
    }
}
