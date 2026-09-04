// src/types/deals.ts

export type Region = "US" | "BR";

export type WinningRegion = "US" | "BR" | "EQUAL";

export type DealFilterType =
    | "historical_low"
    | "highest_cut"
    | "best_savings"
    | "oracle"
    | "monitored"
    | "steam_acclaimed"
    | "curated_specials"
    | "steam_only";

export type StoreFilterType = "all" | "steam" | "nuuvem";

export type RegionAdvantageFilterType = "all" | "br" | "us";

export type PriceCapFilterType = "all" | "under_30" | "under_60" | "under_100";

export interface SteamCommunityReview {
    reviewScoreDesc: string;
    positivePercent: number;
    totalReviews: number;
}

export interface CurrencyRate {
    code: string; // "USD"
    codein: string; // "BRL"
    rate: number; // e.g. 5.42
    high: number;
    low: number;
    pctChange: number;
    updatedAt: string;
    isFallback?: boolean;
}

export type StoreId =
    | "steam"
    | "nuuvem"
    | "greenmangaming"
    | "humblestore"
    | "gog"
    | "epicgames"
    | "other";

export interface StorePrice {
    storeId: StoreId;
    storeName: string;
    regularPrice: number;
    currentPrice: number;
    discountPercent: number;
    currency: "USD" | "BRL";
    url: string;
    voucher?: string | null;
    isOfficial: boolean;
}

export interface RegionDeal {
    region: Region;
    currency: "USD" | "BRL";
    bestStore: StorePrice;
    convertedPrice: number; // price converted to the opposite currency (e.g., BR price in USD)
    allStores?: StorePrice[];
}

export interface DealComparisonResult {
    id: string; // ITAD game id or Steam App ID
    title: string;
    slug: string;
    coverImage?: string | null;
    steamAppId?: number | null;
    winningRegion: WinningRegion;
    savingsPercent: number; // 0 to 100
    savingsInUSD: number;
    savingsInBRL: number;
    cheapestRegionPriceLocal: number;
    moreExpensiveRegionPriceLocal: number;
    usDeal: RegionDeal | null;
    brDeal: RegionDeal | null;
    currencyRate: CurrencyRate;
    isAllTimeLow?: boolean;
    historicalLowPriceUS?: number | null;
    historicalLowPriceBR?: number | null;
    cachedAt: string;
    source: "itad" | "steam" | "hybrid";
    steamReviews?: SteamCommunityReview;
}

export interface SearchGameItem {
    id: string;
    title: string;
    slug: string;
    steamAppId?: number | null;
    coverImage?: string | null;
    type?: string;
}

export interface FeaturedDealItem {
    id: string;
    title: string;
    slug: string;
    steamAppId?: number | null;
    coverImage?: string | null;
    discountPercent: number;
    priceUS: number;
    priceBR: number;
    convertedBRInUSD: number;
    winningRegion: WinningRegion;
    savingsPercent: number;
    storeUS: string;
    storeBR: string;
    isAllTimeLow?: boolean;
    dealUrlUS?: string;
    dealUrlBR?: string;
    absoluteSavingsBRL?: number;
    steamReviews?: SteamCommunityReview;
}

export interface TrackedDealItem {
    id: string; // ITAD ID or Steam AppID
    title: string;
    slug: string;
    steamAppId?: number | null;
    coverImage?: string | null;
    addedAt: string;
    currentPriceBR?: number;
    currentPriceUS?: number;
    discountPercent?: number;
    isAllTimeLow?: boolean;
    storeBR?: string;
    storeUS?: string;
    savingsPercent?: number;
    dealUrlBR?: string;
    dealUrlUS?: string;
    winningRegion?: WinningRegion;
    steamReviews?: SteamCommunityReview;
}

export interface TrackedDealsBatchRequest {
    items: Array<{
        id: string;
        title: string;
        steamAppId?: number | null;
        slug?: string;
        coverImage?: string | null;
        addedAt?: string;
    }>;
}

export interface TrackedDealsResponse {
    items: TrackedDealItem[];
    hasAllTimeLow: boolean;
    allTimeLowCount: number;
    currencyRate?: CurrencyRate;
}

export type OracleGameTier = "AAA" | "INDIE" | "HIDDEN_GEM";

export interface OracleGameRecommendation {
    title: string;
    tier: OracleGameTier;
    pitch: string;
    highlightReason: string;
    steamAppId?: number;
    coverImage?: string;
    priceBR?: number;
    regularPriceBR?: number;
    discountPercent?: number;
    isOnSale: boolean;
    steamReviews?: SteamCommunityReview;
    dealUrl?: string;
}

export interface OracleRecommendationsResponse {
    recommendations: OracleGameRecommendation[];
    onSale: OracleGameRecommendation[];
    onRadar: OracleGameRecommendation[];
    tasteSummary: string;
    generatedAt: string;
    cached: boolean;
}
