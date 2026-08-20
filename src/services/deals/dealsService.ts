// src/services/deals/dealsService.ts

import {
    DealComparisonResult,
    FeaturedDealItem,
    SearchGameItem,
    StorePrice,
    CurrencyRate,
    DealFilterType,
} from "@/types/deals";
import { CurrencyService } from "./currencyService";
import { ItadClient } from "./itadClient";
import { SteamStoreClient } from "./steamStoreClient";
import { DealComparator } from "./dealComparator";
import { dealsCache, CACHE_TTL } from "./dealsCache";

export class DealsService {
    /**
     * Searches for games across ITAD and Steam Store.
     */
    static async search(query: string): Promise<SearchGameItem[]> {
        const cleanQuery = query.trim();
        if (!cleanQuery) return [];

        const cacheKey = `deals:search:${cleanQuery.toLowerCase()}`;
        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                let results: SearchGameItem[] = [];

                if (ItadClient.isConfigured()) {
                    results = await ItadClient.searchGames(cleanQuery);
                }

                // If ITAD is not configured or returned no results, fallback to Steam Store
                if (results.length === 0) {
                    results = await SteamStoreClient.searchGames(cleanQuery);
                }

                return results.slice(0, 10);
            },
            CACHE_TTL.SEARCH_RESULTS,
        );
    }

    /**
     * Compares a game between US and BR official stores.
     */
    static async compareGame(
        params: {
            title: string;
            gameId?: string;
            steamAppId?: number;
        },
        forceRefresh = false,
    ): Promise<DealComparisonResult | null> {
        const { title, gameId, steamAppId } = params;
        const cleanTitle = title.trim();
        if (!cleanTitle && !gameId && !steamAppId) return null;

        const cacheKey = `deals:compare:${gameId || steamAppId || cleanTitle.toLowerCase()}`;

        if (forceRefresh) {
            dealsCache.delete(cacheKey);
        }

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                // Step 1: Get latest currency exchange rate
                const currencyRate = await CurrencyService.getUsdBrlRate(forceRefresh);

                let usPrices: StorePrice[] = [];
                let brPrices: StorePrice[] = [];
                let resolvedTitle = cleanTitle;
                let coverImage: string | null = null;
                let source: "itad" | "steam" | "hybrid" = "steam";
                let resolvedAppId = steamAppId || null;

                // Step 2: Try ITAD if configured and gameId is present or search ITAD by title
                if (ItadClient.isConfigured()) {
                    let itadId = gameId;

                    if (!itadId && cleanTitle) {
                        const searchHits = await ItadClient.searchGames(cleanTitle);
                        if (searchHits.length > 0) {
                            itadId = searchHits[0].id;
                            resolvedTitle = searchHits[0].title;
                            coverImage = searchHits[0].coverImage || null;
                        }
                    }

                    if (itadId) {
                        const [itadUS, itadBR] = await Promise.all([
                            ItadClient.getPricesForGame(itadId, "US"),
                            ItadClient.getPricesForGame(itadId, "BR"),
                        ]);

                        if (itadUS.length > 0 || itadBR.length > 0) {
                            usPrices = itadUS;
                            brPrices = itadBR;
                            source = "itad";
                        }
                    }
                }

                // Step 3: If no prices yet or if we have steamAppId, use Steam Store directly
                if (usPrices.length === 0 || brPrices.length === 0) {
                    let appIdToQuery = resolvedAppId;

                    if (!appIdToQuery && cleanTitle) {
                        const steamSearch = await SteamStoreClient.searchGames(cleanTitle);
                        if (steamSearch.length > 0 && steamSearch[0].steamAppId) {
                            appIdToQuery = steamSearch[0].steamAppId;
                            if (!resolvedTitle) resolvedTitle = steamSearch[0].title;
                            if (!coverImage) coverImage = steamSearch[0].coverImage || null;
                        }
                    }

                    if (appIdToQuery) {
                        resolvedAppId = appIdToQuery;
                        if (!coverImage) {
                            coverImage = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appIdToQuery}/header.jpg`;
                        }

                        const [steamUsPrice, steamBrPrice] = await Promise.all([
                            SteamStoreClient.getAppPrice(appIdToQuery, "US"),
                            SteamStoreClient.getAppPrice(appIdToQuery, "BR"),
                        ]);

                        if (steamUsPrice && usPrices.length === 0) {
                            usPrices = [steamUsPrice];
                        }
                        if (steamBrPrice && brPrices.length === 0) {
                            brPrices = [steamBrPrice];
                        }

                        if (source !== "itad") {
                            source = "steam";
                        } else {
                            source = "hybrid";
                        }
                    }
                }

                if (usPrices.length === 0 && brPrices.length === 0) {
                    return null;
                }

                const comparison = DealComparator.compareDeals({
                    id: gameId || String(resolvedAppId) || cleanTitle.toLowerCase(),
                    title: resolvedTitle || cleanTitle,
                    slug: (resolvedTitle || cleanTitle)
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-"),
                    coverImage,
                    steamAppId: resolvedAppId,
                    usPrices,
                    brPrices,
                    currencyRate,
                    source,
                });

                return comparison;
            },
            CACHE_TTL.GAME_COMPARISON,
        );
    }

    /**
     * Gets Top Deals / Featured Specials prioritizing IsThereAnyDeal, sorted by filter.
     */
    static async getFeaturedDeals(
        filter: DealFilterType = "best_savings",
        forceRefresh = false,
    ): Promise<{
        deals: FeaturedDealItem[];
        currencyRate: CurrencyRate;
    }> {
        const cacheKey = `deals:featured_list:${filter}`;

        if (forceRefresh) {
            dealsCache.deletePattern("deals:featured_list:");
            dealsCache.deletePattern("steam:featured_specials");
            dealsCache.deletePattern("itad:top_deals_curated_v2:");
        }

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                const currencyRate = await CurrencyService.getUsdBrlRate(forceRefresh);
                let deals: FeaturedDealItem[] = [];

                // 1. If steam_only filter is requested, fetch directly from Steam Store API
                if (filter === "steam_only") {
                    deals = await SteamStoreClient.getFeaturedSpecials();
                } else if (ItadClient.isConfigured()) {
                    // 2. Otherwise try IsThereAnyDeal API first
                    deals = await ItadClient.getTopDeals(filter);
                }

                // 3. Fallback to Steam Store specials if ITAD not configured or returned no deals
                if (deals.length === 0) {
                    deals = await SteamStoreClient.getFeaturedSpecials();
                }

                // 3. Fallback to curated high-value list if external stores are down
                if (deals.length === 0) {
                    deals = [
                        {
                            id: "steam-1086940",
                            title: "Baldur's Gate 3",
                            slug: "baldurs-gate-3",
                            steamAppId: 1086940,
                            coverImage:
                                "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg",
                            discountPercent: 20,
                            priceUS: 47.99,
                            priceBR: 159.99,
                            convertedBRInUSD: 0,
                            winningRegion: "BR",
                            savingsPercent: 38,
                            storeUS: "Steam",
                            storeBR: "Steam",
                            isAllTimeLow: true,
                            dealUrlUS: "https://store.steampowered.com/app/1086940",
                            dealUrlBR: "https://store.steampowered.com/app/1086940",
                        },
                        {
                            id: "steam-1245620",
                            title: "ELDEN RING",
                            slug: "elden-ring",
                            steamAppId: 1245620,
                            coverImage:
                                "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
                            discountPercent: 35,
                            priceUS: 38.99,
                            priceBR: 149.43,
                            convertedBRInUSD: 0,
                            winningRegion: "BR",
                            savingsPercent: 29,
                            storeUS: "Steam",
                            storeBR: "Steam",
                            isAllTimeLow: false,
                            dealUrlUS: "https://store.steampowered.com/app/1245620",
                            dealUrlBR: "https://store.steampowered.com/app/1245620",
                        },
                        {
                            id: "steam-1091500",
                            title: "Cyberpunk 2077",
                            slug: "cyberpunk-2077",
                            steamAppId: 1091500,
                            coverImage:
                                "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg",
                            discountPercent: 50,
                            priceUS: 29.99,
                            priceBR: 99.95,
                            convertedBRInUSD: 0,
                            winningRegion: "BR",
                            savingsPercent: 38,
                            storeUS: "Steam",
                            storeBR: "Steam",
                            isAllTimeLow: true,
                            dealUrlUS: "https://store.steampowered.com/app/1091500",
                            dealUrlBR: "https://store.steampowered.com/app/1091500",
                        },
                        {
                            id: "steam-1145360",
                            title: "Hades",
                            slug: "hades",
                            steamAppId: 1145360,
                            coverImage:
                                "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg",
                            discountPercent: 66,
                            priceUS: 8.49,
                            priceBR: 25.15,
                            convertedBRInUSD: 0,
                            winningRegion: "BR",
                            savingsPercent: 45,
                            storeUS: "Steam",
                            storeBR: "Steam",
                            isAllTimeLow: true,
                            dealUrlUS: "https://store.steampowered.com/app/1145360",
                            dealUrlBR: "https://store.steampowered.com/app/1145360",
                        },
                    ];
                }

                // 4. Normalize and Sort by Best Regional Advantage / ATL / Highest Cut
                const normalized = DealComparator.normalizeFeaturedDeals(
                    deals,
                    currencyRate,
                    filter,
                );

                return {
                    deals: normalized,
                    currencyRate,
                };
            },
            CACHE_TTL.FEATURED_DEALS,
        );
    }
}
