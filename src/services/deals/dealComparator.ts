// src/services/deals/dealComparator.ts

import {
    CurrencyRate,
    DealComparisonResult,
    DealFilterType,
    FeaturedDealItem,
    RegionAdvantageFilterType,
    RegionDeal,
    StorePrice,
    WinningRegion,
} from "@/types/deals";
import { CurrencyService } from "./currencyService";
import { SHOVELWARE_EXCLUDE_REGEX } from "./itadClient";

export class DealComparator {
    /**
     * Compares deals between US and BR regions and computes savings in both currencies.
     */
    static compareDeals(params: {
        id: string;
        title: string;
        slug: string;
        coverImage?: string | null;
        steamAppId?: number | null;
        usPrices: StorePrice[];
        brPrices: StorePrice[];
        currencyRate: CurrencyRate;
        isAllTimeLow?: boolean;
        source: "itad" | "steam" | "hybrid";
    }): DealComparisonResult {
        const {
            id,
            title,
            slug,
            coverImage,
            steamAppId,
            usPrices,
            brPrices,
            currencyRate,
            isAllTimeLow,
            source,
        } = params;

        const rate = currencyRate.rate;

        // Select the cheapest official store for US
        const bestUsStore = usPrices.length > 0 ? usPrices[0] : null;
        // Select the cheapest official store for BR
        const bestBrStore = brPrices.length > 0 ? brPrices[0] : null;

        let usDeal: RegionDeal | null = null;
        let brDeal: RegionDeal | null = null;

        if (bestUsStore) {
            usDeal = {
                region: "US",
                currency: "USD",
                bestStore: bestUsStore,
                convertedPrice: CurrencyService.convertUsdToBrl(
                    bestUsStore.currentPrice,
                    rate,
                ),
                allStores: usPrices,
            };
        }

        if (bestBrStore) {
            brDeal = {
                region: "BR",
                currency: "BRL",
                bestStore: bestBrStore,
                convertedPrice: CurrencyService.convertBrlToUsd(
                    bestBrStore.currentPrice,
                    rate,
                ),
                allStores: brPrices,
            };
        }

        // Calculate winning region and savings
        let winningRegion: WinningRegion = "EQUAL";
        let savingsInUSD = 0;
        let savingsInBRL = 0;
        let savingsPercent = 0;
        let cheapestRegionPriceLocal = 0;
        let moreExpensiveRegionPriceLocal = 0;

        if (usDeal && brDeal) {
            const priceUsInUsd = usDeal.bestStore.currentPrice;
            const priceBrInUsd = brDeal.convertedPrice; // BR price in USD
            const priceUsInBrl = usDeal.convertedPrice; // US price in BRL
            const priceBrInBrl = brDeal.bestStore.currentPrice;

            const diffUsd = Number((priceUsInUsd - priceBrInUsd).toFixed(2));

            // Threshold of 5 cents to consider equal
            if (Math.abs(diffUsd) < 0.05 || (priceUsInUsd === 0 && priceBrInBrl === 0)) {
                winningRegion = "EQUAL";
                savingsInUSD = 0;
                savingsInBRL = 0;
                savingsPercent = 0;
                cheapestRegionPriceLocal = priceBrInBrl;
                moreExpensiveRegionPriceLocal = priceUsInUsd;
            } else if (priceBrInUsd < priceUsInUsd) {
                // Brazil is cheaper
                winningRegion = "BR";
                savingsInUSD = Number((priceUsInUsd - priceBrInUsd).toFixed(2));
                savingsInBRL = Number((priceUsInBrl - priceBrInBrl).toFixed(2));
                savingsPercent =
                    priceUsInUsd > 0
                        ? Math.min(100, Math.round((savingsInUSD / priceUsInUsd) * 100))
                        : 0;
                cheapestRegionPriceLocal = priceBrInBrl;
                moreExpensiveRegionPriceLocal = priceUsInUsd;
            } else {
                // US is cheaper
                winningRegion = "US";
                savingsInUSD = Number((priceBrInUsd - priceUsInUsd).toFixed(2));
                savingsInBRL = Number((priceBrInBrl - priceUsInBrl).toFixed(2));
                savingsPercent =
                    priceBrInUsd > 0
                        ? Math.min(100, Math.round((savingsInUSD / priceBrInUsd) * 100))
                        : 0;
                cheapestRegionPriceLocal = priceUsInUsd;
                moreExpensiveRegionPriceLocal = priceBrInBrl;
            }
        } else if (brDeal && !usDeal) {
            winningRegion = "BR";
            cheapestRegionPriceLocal = brDeal.bestStore.currentPrice;
        } else if (usDeal && !brDeal) {
            winningRegion = "US";
            cheapestRegionPriceLocal = usDeal.bestStore.currentPrice;
        }

        return {
            id,
            title,
            slug,
            coverImage: coverImage || null,
            steamAppId: steamAppId || null,
            winningRegion,
            savingsPercent,
            savingsInUSD,
            savingsInBRL,
            cheapestRegionPriceLocal,
            moreExpensiveRegionPriceLocal,
            usDeal,
            brDeal,
            currencyRate,
            isAllTimeLow: Boolean(isAllTimeLow),
            cachedAt: new Date().toISOString(),
            source,
        };
    }

    /**
     * Normalizes and sorts a list of featured deals according to filter and regional advantage.
     */
    static normalizeFeaturedDeals(
        items: FeaturedDealItem[],
        currencyRate: CurrencyRate,
        filter: DealFilterType = "best_savings",
        storeFilter: "all" | "steam" | "nuuvem" = "all",
        regionFilter: RegionAdvantageFilterType = "all",
    ): FeaturedDealItem[] {
        const rate = currencyRate.rate;

        // 1. Deduplicate by title / appId
        const seenKeys = new Set<string>();
        const uniqueItems = items.filter((item) => {
            const key = (item.steamAppId ? `app-${item.steamAppId}` : item.title.toLowerCase().trim());
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });

        let normalized = uniqueItems
            .filter(
                (item) =>
                    !SHOVELWARE_EXCLUDE_REGEX.test(item.title) &&
                    !(item.priceUS > 0 && item.priceBR <= 0) &&
                    !(item.priceBR > 0 && item.priceUS <= 0),
            )
            .map((item) => {
                const convertedBRInUSD = CurrencyService.convertBrlToUsd(item.priceBR, rate);
                const convertedUSInBRL = CurrencyService.convertUsdToBrl(item.priceUS, rate);

                let winningRegion: WinningRegion = "EQUAL";
                let savingsPercent = 0;
                let absoluteSavingsBRL = 0;

                const diff = item.priceUS - convertedBRInUSD;

                if (Math.abs(diff) < 0.05 || (item.priceUS === 0 && item.priceBR === 0)) {
                    winningRegion = "EQUAL";
                    savingsPercent = 0;
                    absoluteSavingsBRL = 0;
                } else if (convertedBRInUSD < item.priceUS) {
                    winningRegion = "BR";
                    savingsPercent =
                        item.priceUS > 0
                            ? Math.round(((item.priceUS - convertedBRInUSD) / item.priceUS) * 100)
                            : 0;
                    absoluteSavingsBRL = Number((convertedUSInBRL - item.priceBR).toFixed(2));
                } else {
                    winningRegion = "US";
                    savingsPercent =
                        convertedBRInUSD > 0
                            ? Math.round(((convertedBRInUSD - item.priceUS) / convertedBRInUSD) * 100)
                            : 0;
                    absoluteSavingsBRL = Number((item.priceBR - convertedUSInBRL).toFixed(2));
                }

                // Use strict all-time low flag from price trackers
                const isAllTimeLow = Boolean(item.isAllTimeLow);

                return {
                    ...item,
                    convertedBRInUSD,
                    winningRegion,
                    savingsPercent: Math.max(0, Math.min(100, savingsPercent)),
                    absoluteSavingsBRL: Math.max(0, absoluteSavingsBRL),
                    isAllTimeLow,
                };
            });

        // 2. Apply store filter if specified
        if (storeFilter === "steam") {
            normalized = normalized.filter(
                (item) =>
                    item.storeBR.toLowerCase().includes("steam") ||
                    item.storeUS.toLowerCase().includes("steam"),
            );
        } else if (storeFilter === "nuuvem") {
            normalized = normalized.filter(
                (item) =>
                    item.storeBR.toLowerCase().includes("nuuvem") ||
                    item.storeUS.toLowerCase().includes("nuuvem"),
            );
        }

        // 2.5 Apply region advantage filter if specified (e.g. BR winner vs US winner)
        if (regionFilter === "br") {
            normalized = normalized.filter((item) => item.winningRegion === "BR");
        } else if (regionFilter === "us") {
            normalized = normalized.filter((item) => item.winningRegion === "US");
        }

        // 3. Filter and Sort based on selected Tab/Filter
        if (filter === "historical_low") {
            return normalized
                .filter((item) => item.isAllTimeLow)
                .sort((a, b) => b.savingsPercent - a.savingsPercent || b.discountPercent - a.discountPercent);
        }

        if (filter === "curated_specials") {
            return normalized.sort((a, b) => {
                if (b.discountPercent !== a.discountPercent) {
                    return b.discountPercent - a.discountPercent;
                }
                return b.savingsPercent - a.savingsPercent;
            });
        }

        if (filter === "steam_only") {
            return normalized
                .filter(
                    (item) =>
                        item.storeBR.toLowerCase().includes("steam") ||
                        item.storeUS.toLowerCase().includes("steam"),
                )
                .sort((a, b) => {
                    if (b.savingsPercent !== a.savingsPercent) {
                        return b.savingsPercent - a.savingsPercent;
                    }
                    return (b.absoluteSavingsBRL || 0) - (a.absoluteSavingsBRL || 0);
                });
        }

        if (filter === "highest_cut") {
            return normalized.sort(
                (a, b) => b.discountPercent - a.discountPercent || b.savingsPercent - a.savingsPercent,
            );
        }

        // Default: 'best_savings' - Sort by highest regional savings %, tie-break by absolute R$ savings
        return normalized.sort((a, b) => {
            if (b.savingsPercent !== a.savingsPercent) {
                return b.savingsPercent - a.savingsPercent;
            }
            return (b.absoluteSavingsBRL || 0) - (a.absoluteSavingsBRL || 0);
        });
    }
}
