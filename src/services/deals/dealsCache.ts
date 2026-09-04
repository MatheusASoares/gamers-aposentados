// src/services/deals/dealsCache.ts

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class InMemoryCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();

    /**
     * Get a value from the cache if not expired.
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set a value in the cache with a Time-To-Live in seconds.
     */
    set<T>(key: string, data: T, ttlSeconds: number): void {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { data, expiresAt });
    }

    /**
     * Delete a key or clear the cache.
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Delete all entries matching a prefix or regex pattern.
     */
    deletePattern(pattern: string | RegExp): void {
        const regex = typeof pattern === "string" ? new RegExp(`^${pattern}`) : pattern;
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }

    /**
     * Helper to wrap async function calls with caching, with optional forceRefresh bypass.
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlSeconds: number,
        forceRefresh = false,
    ): Promise<T> {
        if (!forceRefresh) {
            const cached = this.get<T>(key);
            if (cached !== null) {
                return cached;
            }
        }

        const freshData = await fetcher();
        if (freshData !== null && freshData !== undefined) {
            this.set(key, freshData, ttlSeconds);
        }
        return freshData;
    }
}

export const dealsCache = new InMemoryCache();

// Standard TTLs
export const CACHE_TTL = {
    CURRENCY_RATE: 60 * 60 * 2, // 2 hours
    SEARCH_RESULTS: 60 * 60 * 6, // 6 hours
    GAME_COMPARISON: 60 * 60 * 8, // 8 hours
    FEATURED_DEALS: 60 * 60 * 24, // 24 hours
    STEAM_REVIEWS: 60 * 60 * 12, // 12 hours
};
