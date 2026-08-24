// src/services/deals/dealsService.ts

import {
    DealComparisonResult,
    FeaturedDealItem,
    SearchGameItem,
    StorePrice,
    CurrencyRate,
    DealFilterType,
    StoreFilterType,
    RegionAdvantageFilterType,
    TrackedDealItem,
    TrackedDealsResponse,
} from "@/types/deals";
import { CurrencyService } from "./currencyService";
import { ItadClient } from "./itadClient";
import { SteamStoreClient } from "./steamStoreClient";
import { DealComparator } from "./dealComparator";
import { dealsCache, CACHE_TTL } from "./dealsCache";
import { CURATED_GAMES_POOL } from "./curatedGames";

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
     * Resolves prices for a subset of the curated pool in parallel.
     */
    private static async getCuratedPoolDeals(): Promise<FeaturedDealItem[]> {
        const cacheKey = "deals:curated_pool_specials";

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                const sampleGames = CURATED_GAMES_POOL.slice(0, 25);
                const results = await Promise.all(
                    sampleGames.map(async (game): Promise<FeaturedDealItem | null> => {
                        try {
                            const [pUS, pBR] = await Promise.all([
                                SteamStoreClient.getAppPrice(game.steamAppId, "US"),
                                SteamStoreClient.getAppPrice(game.steamAppId, "BR"),
                            ]);

                            if (!pUS || !pBR || pUS.currentPrice <= 0 || pBR.currentPrice <= 0) {
                                return null;
                            }

                            const discount = Math.max(pUS.discountPercent, pBR.discountPercent);

                            return {
                                id: `steam-${game.steamAppId}`,
                                title: game.title,
                                slug: game.slug,
                                steamAppId: game.steamAppId,
                                coverImage: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/header.jpg`,
                                discountPercent: discount,
                                priceUS: pUS.currentPrice,
                                priceBR: pBR.currentPrice,
                                convertedBRInUSD: 0,
                                winningRegion: "EQUAL",
                                savingsPercent: 0,
                                storeUS: "Steam",
                                storeBR: "Steam",
                                isAllTimeLow: discount >= 50,
                                dealUrlUS: `https://store.steampowered.com/app/${game.steamAppId}`,
                                dealUrlBR: `https://store.steampowered.com/app/${game.steamAppId}`,
                            };
                        } catch {
                            return null;
                        }
                    }),
                );

                return results.filter((item): item is FeaturedDealItem => item !== null);
            },
            CACHE_TTL.FEATURED_DEALS,
        );
    }

    /**
     * Retrieves featured/top deals comparing US vs BR stores.
     */
    static async getFeaturedDeals(
        filter: DealFilterType = "best_savings",
        forceRefresh = false,
        storeFilter: StoreFilterType = "all",
        regionFilter: RegionAdvantageFilterType = "all",
    ): Promise<{
        deals: FeaturedDealItem[];
        currencyRate: CurrencyRate;
    }> {
        const cacheKey = `deals:featured_list:${filter}:${storeFilter}:${regionFilter}`;

        if (forceRefresh) {
            dealsCache.deletePattern("deals:featured_list:");
            dealsCache.deletePattern("steam:featured_specials");
            dealsCache.deletePattern("itad:top_deals_curated_v2:");
            dealsCache.deletePattern("deals:curated_pool_specials");
        }

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                const currencyRate = await CurrencyService.getUsdBrlRate(forceRefresh);
                let deals: FeaturedDealItem[] = [];

                // 1. Fetch based on filter
                if (filter === "curated_specials") {
                    const [curatedDeals, steamSpecials] = await Promise.all([
                        DealsService.getCuratedPoolDeals(),
                        SteamStoreClient.getFeaturedSpecials(),
                    ]);
                    deals = [...curatedDeals, ...steamSpecials];
                } else if (filter === "steam_only") {
                    deals = await SteamStoreClient.getFeaturedSpecials();
                } else if (ItadClient.isConfigured()) {
                    deals = await ItadClient.getTopDeals(filter);
                }

                // 2. Fallback to Steam Store specials if ITAD not configured or returned no deals
                if (deals.length === 0) {
                    deals = await SteamStoreClient.getFeaturedSpecials();
                }

                // 3. Merge curated pool deals into best_savings and historical_low to guarantee evergreen AAA titles
                if (filter === "best_savings" || filter === "historical_low") {
                    try {
                        const curated = await DealsService.getCuratedPoolDeals();
                        const discountedCurated = curated.filter((c) => c.discountPercent > 0);
                        deals = [...deals, ...discountedCurated];
                    } catch (err) {
                        console.warn("[DealsService] Failed to merge curated deals:", err);
                    }
                }

                // 4. Fallback baseline if external services are down
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
                    ];
                }

                // 5. Resolve any missing cover images using Steam Store in parallel
                const missingCoverDeals = deals.filter((d) => !d.coverImage);
                if (missingCoverDeals.length > 0) {
                    await Promise.allSettled(
                        missingCoverDeals.map(async (deal) => {
                            try {
                                const searchHits = await SteamStoreClient.searchGames(deal.title);
                                if (searchHits.length > 0 && searchHits[0].coverImage) {
                                    deal.coverImage = searchHits[0].coverImage;
                                    if (!deal.steamAppId) {
                                        deal.steamAppId = searchHits[0].steamAppId;
                                    }
                                }
                            } catch (err) {
                                console.error(`[DealsService] Failed to resolve cover for ${deal.title}:`, err);
                            }
                        }),
                    );
                }

                // 6. Normalize and Sort by Filter, Store & Region Advantage
                const normalized = DealComparator.normalizeFeaturedDeals(
                    deals,
                    currencyRate,
                    filter,
                    storeFilter,
                    regionFilter,
                );

                return {
                    deals: normalized,
                    currencyRate,
                };
            },
            CACHE_TTL.FEATURED_DEALS,
        );
    }

    /**
     * Resolves live prices and ATL status for a list of tracked/favorite games.
     */
    static async getTrackedDealsStatus(
        items: Array<{
            id: string;
            title: string;
            steamAppId?: number | null;
            slug?: string;
            coverImage?: string | null;
            addedAt?: string;
        }>,
    ): Promise<TrackedDealsResponse> {
        if (!items || items.length === 0) {
            return {
                items: [],
                hasAllTimeLow: false,
                allTimeLowCount: 0,
            };
        }

        const currencyRate = await CurrencyService.getUsdBrlRate();

        const resolvedTracked: TrackedDealItem[] = await Promise.all(
            items.map(async (item) => {
                const appId = item.steamAppId;
                let priceUS = 0;
                let priceBR = 0;
                let discountPercent = 0;
                let isAllTimeLow = false;
                let storeBR = "Steam";
                let storeUS = "Steam";
                let coverImage = item.coverImage || null;

                if (appId) {
                    if (!coverImage) {
                        coverImage = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
                    }
                    const [pUS, pBR] = await Promise.all([
                        SteamStoreClient.getAppPrice(appId, "US"),
                        SteamStoreClient.getAppPrice(appId, "BR"),
                    ]);

                    if (pUS) {
                        priceUS = pUS.currentPrice;
                        discountPercent = Math.max(discountPercent, pUS.discountPercent);
                        storeUS = pUS.storeName;
                    }
                    if (pBR) {
                        priceBR = pBR.currentPrice;
                        discountPercent = Math.max(discountPercent, pBR.discountPercent);
                        storeBR = pBR.storeName;
                    }
                    if (discountPercent >= 60) {
                        isAllTimeLow = true;
                    }
                } else {
                    // Try ITAD or search
                    const comparison = await DealsService.compareGame({ title: item.title, gameId: item.id });
                    if (comparison) {
                        priceUS = comparison.usDeal?.bestStore.currentPrice || 0;
                        priceBR = comparison.brDeal?.bestStore.currentPrice || 0;
                        storeUS = comparison.usDeal?.bestStore.storeName || "Steam";
                        storeBR = comparison.brDeal?.bestStore.storeName || "Steam";
                        discountPercent = Math.max(
                            comparison.usDeal?.bestStore.discountPercent || 0,
                            comparison.brDeal?.bestStore.discountPercent || 0,
                        );
                        isAllTimeLow = Boolean(comparison.isAllTimeLow);
                        if (comparison.coverImage) coverImage = comparison.coverImage;
                    }
                }

                const convertedBRInUSD = CurrencyService.convertBrlToUsd(priceBR, currencyRate.rate);
                let savingsPercent = 0;
                let winningRegion: "US" | "BR" | "EQUAL" = "EQUAL";

                if (priceUS > 0 && convertedBRInUSD < priceUS) {
                    winningRegion = "BR";
                    savingsPercent = Math.round(((priceUS - convertedBRInUSD) / priceUS) * 100);
                } else if (convertedBRInUSD > priceUS && priceUS > 0) {
                    winningRegion = "US";
                    savingsPercent = Math.round(((convertedBRInUSD - priceUS) / convertedBRInUSD) * 100);
                }

                return {
                    id: item.id,
                    title: item.title,
                    slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    steamAppId: item.steamAppId || null,
                    coverImage,
                    addedAt: item.addedAt || new Date().toISOString(),
                    currentPriceBR: priceBR,
                    currentPriceUS: priceUS,
                    discountPercent,
                    isAllTimeLow,
                    storeBR,
                    storeUS,
                    savingsPercent,
                    winningRegion,
                    dealUrlBR: appId ? `https://store.steampowered.com/app/${appId}` : undefined,
                    dealUrlUS: appId ? `https://store.steampowered.com/app/${appId}` : undefined,
                };
            }),
        );

        const atlItems = resolvedTracked.filter((item) => item.isAllTimeLow);

        return {
            items: resolvedTracked,
            hasAllTimeLow: atlItems.length > 0,
            allTimeLowCount: atlItems.length,
            currencyRate,
        };
    }
}
