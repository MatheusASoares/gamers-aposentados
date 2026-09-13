// src/services/deals/steamStoreClient.ts

import { SearchGameItem, StorePrice, FeaturedDealItem, SteamCommunityReview } from "@/types/deals";
import { dealsCache, CACHE_TTL } from "./dealsCache";
import { EDITION_EXCLUDE_REGEX, SHOVELWARE_EXCLUDE_REGEX } from "./itadClient";

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
                        signal: AbortSignal.timeout(5000),
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
     * Checks if a Steam game supports Steam Family Sharing (Category 62).
     */
    static async isFamilySharingSupported(appId: number): Promise<boolean> {
        if (!appId || appId <= 0) return false;
        const cacheKey = `steam:family_sharing:${appId}`;

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                try {
                    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic,categories`;
                    const res = await fetch(url, {
                        headers: {
                            Accept: "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        },
                        signal: AbortSignal.timeout(6000),
                        next: { revalidate: CACHE_TTL.FAMILY_SHARING },
                    });

                    if (!res.ok) return false;
                    const data = await res.json();
                    const appData = data[String(appId)];
                    if (!appData?.success || !appData?.data) return false;

                    const categories = appData.data.categories;
                    if (!Array.isArray(categories)) return false;

                    return categories.some(
                        (c: { id: number; description?: string }) => c.id === 62,
                    );
                } catch (err) {
                    console.error(`[SteamStoreClient] isFamilySharingSupported error for ${appId}:`, err);
                    return false;
                }
            },
            CACHE_TTL.FAMILY_SHARING,
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
                    // Fetch featured categories, live search specials, top sellers specials, and family sharing specials in parallel
                    const [
                        resCatUS,
                        resCatBR,
                        resSearchBR,
                        resSearchUS,
                        resTopBR,
                        resTopUS,
                        resFSBR,
                        resFSUS,
                    ] = await Promise.all([
                        fetch("https://store.steampowered.com/api/featuredcategories/?cc=us", {
                            headers: { "User-Agent": "Mozilla/5.0" },
                            next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                        }).catch(() => null),
                        fetch("https://store.steampowered.com/api/featuredcategories/?cc=br", {
                            headers: { "User-Agent": "Mozilla/5.0" },
                            next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                        }).catch(() => null),
                        fetch(
                            "https://store.steampowered.com/search/results/?query=&start=0&count=50&specials=1&infinite=1&cc=br",
                            {
                                headers: { "User-Agent": "Mozilla/5.0" },
                                next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                            },
                        ).catch(() => null),
                        fetch(
                            "https://store.steampowered.com/search/results/?query=&start=0&count=50&specials=1&infinite=1&cc=us",
                            {
                                headers: { "User-Agent": "Mozilla/5.0" },
                                next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                            },
                        ).catch(() => null),
                        fetch(
                            "https://store.steampowered.com/search/results/?query=&start=0&count=50&specials=1&filter=topsellers&infinite=1&cc=br",
                            {
                                headers: { "User-Agent": "Mozilla/5.0" },
                                next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                            },
                        ).catch(() => null),
                        fetch(
                            "https://store.steampowered.com/search/results/?query=&start=0&count=50&specials=1&filter=topsellers&infinite=1&cc=us",
                            {
                                headers: { "User-Agent": "Mozilla/5.0" },
                                next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                            },
                        ).catch(() => null),
                        fetch(
                            "https://store.steampowered.com/search/results/?query=&start=0&count=50&specials=1&category2=62&infinite=1&cc=br",
                            {
                                headers: { "User-Agent": "Mozilla/5.0" },
                                next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                            },
                        ).catch(() => null),
                        fetch(
                            "https://store.steampowered.com/search/results/?query=&start=0&count=50&specials=1&category2=62&infinite=1&cc=us",
                            {
                                headers: { "User-Agent": "Mozilla/5.0" },
                                next: { revalidate: CACHE_TTL.FEATURED_DEALS },
                            },
                        ).catch(() => null),
                    ]);

                    const dataCatUS = resCatUS && resCatUS.ok ? await resCatUS.json().catch(() => null) : null;
                    const dataCatBR = resCatBR && resCatBR.ok ? await resCatBR.json().catch(() => null) : null;
                    const dataSearchBR = resSearchBR && resSearchBR.ok ? await resSearchBR.json().catch(() => null) : null;
                    const dataSearchUS = resSearchUS && resSearchUS.ok ? await resSearchUS.json().catch(() => null) : null;
                    const dataTopBR = resTopBR && resTopBR.ok ? await resTopBR.json().catch(() => null) : null;
                    const dataTopUS = resTopUS && resTopUS.ok ? await resTopUS.json().catch(() => null) : null;
                    const dataFSBR = resFSBR && resFSBR.ok ? await resFSBR.json().catch(() => null) : null;
                    const dataFSUS = resFSUS && resFSUS.ok ? await resFSUS.json().catch(() => null) : null;

                    const combinedCandidates: Array<{
                        id: number;
                        name: string;
                        header_image?: string;
                        discount_percent: number;
                        priceUS?: number;
                        priceBR?: number;
                        isTopSeller?: boolean;
                        isFamilySharing?: boolean;
                    }> = [];

                    const seenAppIds = new Set<number>();
                    const familySharingAppIds = new Set<number>();

                    // Collect app IDs confirmed from category2=62 results
                    const parseFamilySharingIds = (html: string | null) => {
                        if (!html) return;
                        const reg = /data-ds-appid="(\d+)"/g;
                        let m;
                        while ((m = reg.exec(html)) !== null) {
                            familySharingAppIds.add(Number(m[1]));
                        }
                    };
                    parseFamilySharingIds(dataFSBR?.results_html || null);
                    parseFamilySharingIds(dataFSUS?.results_html || null);

                    const parseSearchResults = (htmlBR: string, htmlUS: string | null, isTopSeller = false) => {
                        const usPricesMap = new Map<number, number>();
                        if (htmlUS) {
                            const regUS =
                                /data-ds-appid="(\d+)"[\s\S]*?<span class="title">([^<]+)<\/span>[\s\S]*?discount_pct">([^<]+)<[\s\S]*?discount_final_price">([^<]+)</g;
                            let mUS;
                            while ((mUS = regUS.exec(htmlUS)) !== null) {
                                const rawPrice = mUS[4].replace(/[^\d.]/g, "");
                                const parsedUS = Number(rawPrice);
                                if (!isNaN(parsedUS) && parsedUS > 0) {
                                    usPricesMap.set(Number(mUS[1]), parsedUS);
                                }
                            }
                        }

                        const regBR =
                            /data-ds-appid="(\d+)"[\s\S]*?<span class="title">([^<]+)<\/span>[\s\S]*?discount_pct">([^<]+)<[\s\S]*?discount_final_price">([^<]+)</g;
                        let mBR;
                        while ((mBR = regBR.exec(htmlBR)) !== null) {
                            const appId = Number(mBR[1]);
                            const name = mBR[2].trim();
                            if (seenAppIds.has(appId)) continue;
                            if (EDITION_EXCLUDE_REGEX.test(name) || SHOVELWARE_EXCLUDE_REGEX.test(name)) continue;

                            const discount = Number(mBR[3].replace(/[^\d]/g, ""));
                            const rawPriceBR = mBR[4].replace(/[^\d,]/g, "").replace(",", ".");
                            const priceBR = Number(rawPriceBR);
                            const priceUS = usPricesMap.get(appId);

                            seenAppIds.add(appId);
                            combinedCandidates.push({
                                id: appId,
                                name,
                                header_image: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
                                discount_percent: discount,
                                priceBR: !isNaN(priceBR) && priceBR > 0 ? priceBR : undefined,
                                priceUS: priceUS && !isNaN(priceUS) && priceUS > 0 ? priceUS : undefined,
                                isTopSeller,
                                isFamilySharing: familySharingAppIds.has(appId),
                            });
                        }
                    };

                    // 1. Process Top Sellers specials first
                    if (dataTopBR?.results_html) {
                        parseSearchResults(dataTopBR.results_html, dataTopUS?.results_html || null, true);
                    }

                    // 1.5 Process Family Sharing specials
                    if (dataFSBR?.results_html) {
                        parseSearchResults(dataFSBR.results_html, dataFSUS?.results_html || null, false);
                    }

                    // 2. Process general search specials
                    if (dataSearchBR?.results_html) {
                        parseSearchResults(dataSearchBR.results_html, dataSearchUS?.results_html || null, false);
                    }

                    // 3. Process featured categories (specials + top_sellers)
                    const specialsUS = dataCatUS?.specials?.items || [];
                    const specialsBR = dataCatBR?.specials?.items || [];
                    const specialsBRMap = new Map<number, number>();
                    for (const item of specialsBR) {
                        specialsBRMap.set(item.id, item.final_price / 100);
                    }
                    const specialsUSMap = new Map<number, number>();
                    for (const item of specialsUS) {
                        specialsUSMap.set(item.id, item.final_price / 100);
                    }

                    for (const item of specialsUS) {
                        if (seenAppIds.has(item.id)) continue;
                        if (EDITION_EXCLUDE_REGEX.test(item.name) || SHOVELWARE_EXCLUDE_REGEX.test(item.name)) continue;
                        seenAppIds.add(item.id);
                        combinedCandidates.push({
                            id: item.id,
                            name: item.name,
                            header_image: item.header_image,
                            discount_percent: item.discount_percent,
                            priceUS: item.final_price / 100,
                            priceBR: specialsBRMap.get(item.id),
                            isTopSeller: true,
                            isFamilySharing: familySharingAppIds.has(item.id),
                        });
                    }

                    for (const item of specialsBR) {
                        if (seenAppIds.has(item.id)) continue;
                        if (EDITION_EXCLUDE_REGEX.test(item.name) || SHOVELWARE_EXCLUDE_REGEX.test(item.name)) continue;
                        seenAppIds.add(item.id);
                        combinedCandidates.push({
                            id: item.id,
                            name: item.name,
                            header_image: item.header_image,
                            discount_percent: item.discount_percent,
                            priceUS: specialsUSMap.get(item.id),
                            priceBR: item.final_price / 100,
                            isTopSeller: true,
                            isFamilySharing: familySharingAppIds.has(item.id),
                        });
                    }

                    // 4. Resolve missing prices, reviews, and family sharing for top candidates
                    const candidatesToResolve = combinedCandidates.slice(0, 80);

                    const resolvedItems: (FeaturedDealItem | null)[] = await Promise.all(
                        candidatesToResolve.map(async (candidate): Promise<FeaturedDealItem | null> => {
                            let pUS = candidate.priceUS;
                            let pBR = candidate.priceBR;

                            if (pBR === undefined || pBR === null) {
                                const brPriceObj = await SteamStoreClient.getAppPrice(candidate.id, "BR");
                                pBR = brPriceObj?.currentPrice ?? undefined;
                            }

                            if (pUS === undefined || pUS === null) {
                                const usPriceObj = await SteamStoreClient.getAppPrice(candidate.id, "US");
                                pUS = usPriceObj?.currentPrice ?? undefined;
                            }

                            if (
                                pUS === undefined ||
                                pBR === undefined ||
                                (pUS === 0 && pBR > 0) ||
                                (pBR === 0 && pUS > 0)
                            ) {
                                return null;
                            }

                            const [reviews, isFS] = await Promise.all([
                                SteamStoreClient.getAppReviewsSummary(candidate.id),
                                candidate.isFamilySharing
                                    ? Promise.resolve(true)
                                    : SteamStoreClient.isFamilySharingSupported(candidate.id),
                            ]);

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
                                convertedBRInUSD: 0,
                                winningRegion: "EQUAL",
                                savingsPercent: 0,
                                storeUS: "Steam",
                                storeBR: "Steam",
                                isAllTimeLow: candidate.isTopSeller || (candidate.discount_percent || 0) >= 50,
                                steamReviews: reviews || undefined,
                                isFamilySharing: isFS,
                                dealUrlUS: `https://store.steampowered.com/app/${candidate.id}`,
                                dealUrlBR: `https://store.steampowered.com/app/${candidate.id}`,
                            };
                        }),
                    );

                    return resolvedItems.filter(
                        (item): item is FeaturedDealItem => item !== null,
                    );
                } catch (err) {
                    console.error("[SteamStoreClient] getFeaturedSpecials error:", err);
                    return [];
                }
            },
            CACHE_TTL.FEATURED_DEALS,
        );
    }

    /**
     * Fetches community review summary for a Steam game (overall score, positive %, total reviews)
     * using global sampling (language=all & purchase_type=all) for accurate real-world statistics.
     */
    static async getAppReviewsSummary(
        appId: number,
    ): Promise<SteamCommunityReview | null> {
        const cacheKey = `steam:reviews:${appId}`;

        return dealsCache.getOrSet(
            cacheKey,
            async () => {
                try {
                    const url = `https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=0&language=all&purchase_type=all`;
                    const res = await fetch(url, {
                        headers: {
                            Accept: "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        },
                        signal: AbortSignal.timeout(6000),
                        next: { revalidate: CACHE_TTL.STEAM_REVIEWS },
                    });

                    if (!res.ok) return null;

                    const data = await res.json();
                    if (!data.success || !data.query_summary) return null;

                    const summary = data.query_summary;
                    const totalReviews = Number(summary.total_reviews || 0);
                    const totalPositive = Number(summary.total_positive || 0);
                    if (totalReviews <= 0) return null;

                    const positivePercent = Math.round((totalPositive / totalReviews) * 100);

                    // Accurate translation of Steam review score description to Portuguese
                    const rawDesc = (summary.review_score_desc || "").toLowerCase();
                    let reviewScoreDesc = "Neutras";

                    if (rawDesc.includes("overwhelmingly positive") || rawDesc.includes("extremamente positiva")) {
                        reviewScoreDesc = "Extremamente positivas";
                    } else if (rawDesc.includes("very positive") || rawDesc.includes("muito positiva")) {
                        reviewScoreDesc = "Muito positivas";
                    } else if (rawDesc.includes("mostly positive") || rawDesc.includes("ligeiramente positiva")) {
                        reviewScoreDesc = "Ligeiramente positivas";
                    } else if (rawDesc.includes("positive") || rawDesc.includes("positiva")) {
                        reviewScoreDesc = "Positivas";
                    } else if (rawDesc.includes("mixed") || rawDesc.includes("neutra")) {
                        reviewScoreDesc = "Neutras";
                    } else if (rawDesc.includes("mostly negative") || rawDesc.includes("ligeiramente negativa")) {
                        reviewScoreDesc = "Ligeiramente negativas";
                    } else if (rawDesc.includes("very negative") || rawDesc.includes("muito negativa")) {
                        reviewScoreDesc = "Muito negativas";
                    } else if (rawDesc.includes("overwhelmingly negative") || rawDesc.includes("extremamente negativa")) {
                        reviewScoreDesc = "Extremamente negativas";
                    } else {
                        // Percent-based fallback
                        if (positivePercent >= 95) reviewScoreDesc = "Extremamente positivas";
                        else if (positivePercent >= 80) reviewScoreDesc = "Muito positivas";
                        else if (positivePercent >= 70) reviewScoreDesc = "Ligeiramente positivas";
                        else if (positivePercent >= 40) reviewScoreDesc = "Neutras";
                        else reviewScoreDesc = "Ligeiramente negativas";
                    }

                    return {
                        reviewScoreDesc,
                        positivePercent,
                        totalReviews,
                    };
                } catch (err) {
                    console.error(`[SteamStoreClient] getAppReviewsSummary error for ${appId}:`, err);
                    return null;
                }
            },
            CACHE_TTL.STEAM_REVIEWS,
        );
    }
}
