// src/services/deals/currencyService.ts

import { CurrencyRate } from "@/types/deals";
import { dealsCache, CACHE_TTL } from "./dealsCache";

const AWESOME_API_URL = "https://economia.awesomeapi.com.br/last/USD-BRL";
const ER_API_URL = "https://open.er-api.com/v6/latest/USD";
const FRANKFURTER_API_URL = "https://api.frankfurter.app/latest?from=USD&to=BRL";

const HARDCODED_FALLBACK_RATE = 5.22;

export class CurrencyService {
    private static CACHE_KEY = "currency:usd_brl";

    /**
     * Fetches live commercial USD/BRL exchange rate with multi-provider cascade and caching.
     */
    static async getUsdBrlRate(forceRefresh = false): Promise<CurrencyRate> {
        if (!forceRefresh) {
            const cached = dealsCache.get<CurrencyRate>(this.CACHE_KEY);
            if (cached) {
                return cached;
            }
        }

        // Provider 1: AwesomeAPI (Official Brazilian Market Commercial Rate)
        try {
            const res = await fetch(AWESOME_API_URL, {
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            if (res.ok) {
                const data = await res.json();
                const quote = data?.USDBRL;

                if (quote && quote.bid) {
                    const rateValue = parseFloat(quote.bid);
                    const highValue = parseFloat(quote.high || quote.bid);
                    const lowValue = parseFloat(quote.low || quote.bid);
                    const pctChangeValue = parseFloat(quote.pctChange || "0");

                    if (rateValue > 0) {
                        const rateData: CurrencyRate = {
                            code: "USD",
                            codein: "BRL",
                            rate: Number(rateValue.toFixed(4)),
                            high: Number(highValue.toFixed(4)),
                            low: Number(lowValue.toFixed(4)),
                            pctChange: pctChangeValue,
                            updatedAt: quote.create_date || new Date().toISOString(),
                            isFallback: false,
                        };

                        dealsCache.set(this.CACHE_KEY, rateData, CACHE_TTL.CURRENCY_RATE);
                        return rateData;
                    }
                }
            }
        } catch (err) {
            console.warn("[CurrencyService] AwesomeAPI failed, trying Provider 2:", err);
        }

        // Provider 2: ExchangeRate-API
        try {
            const res = await fetch(ER_API_URL, {
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            if (res.ok) {
                const data = await res.json();
                const rateValue = Number(data?.rates?.BRL);

                if (rateValue > 0) {
                    const rateData: CurrencyRate = {
                        code: "USD",
                        codein: "BRL",
                        rate: Number(rateValue.toFixed(4)),
                        high: Number(rateValue.toFixed(4)),
                        low: Number(rateValue.toFixed(4)),
                        pctChange: 0,
                        updatedAt: new Date().toISOString(),
                        isFallback: false,
                    };

                    dealsCache.set(this.CACHE_KEY, rateData, CACHE_TTL.CURRENCY_RATE);
                    return rateData;
                }
            }
        } catch (err) {
            console.warn("[CurrencyService] ExchangeRate-API failed, trying Provider 3:", err);
        }

        // Provider 3: Frankfurter API
        try {
            const res = await fetch(FRANKFURTER_API_URL, {
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            if (res.ok) {
                const data = await res.json();
                const rateValue = Number(data?.rates?.BRL);

                if (rateValue > 0) {
                    const rateData: CurrencyRate = {
                        code: "USD",
                        codein: "BRL",
                        rate: Number(rateValue.toFixed(4)),
                        high: Number(rateValue.toFixed(4)),
                        low: Number(rateValue.toFixed(4)),
                        pctChange: 0,
                        updatedAt: data?.date || new Date().toISOString(),
                        isFallback: false,
                    };

                    dealsCache.set(this.CACHE_KEY, rateData, CACHE_TTL.CURRENCY_RATE);
                    return rateData;
                }
            }
        } catch (err) {
            console.warn("[CurrencyService] All live providers failed:", err);
        }

        // Fallback if completely offline
        const fallbackRate: CurrencyRate = {
            code: "USD",
            codein: "BRL",
            rate: HARDCODED_FALLBACK_RATE,
            high: HARDCODED_FALLBACK_RATE,
            low: HARDCODED_FALLBACK_RATE,
            pctChange: 0,
            updatedAt: new Date().toISOString(),
            isFallback: true,
        };

        // Cache fallback for only 5 minutes so we retry live rates soon
        dealsCache.set(this.CACHE_KEY, fallbackRate, 60 * 5);
        return fallbackRate;
    }

    /**
     * Converts USD amount to BRL using direct commercial exchange rate.
     */
    static convertUsdToBrl(amountUsd: number, rate: number): number {
        return Number((amountUsd * rate).toFixed(2));
    }

    /**
     * Converts BRL amount to USD using direct commercial exchange rate.
     */
    static convertBrlToUsd(amountBrl: number, rate: number): number {
        if (rate <= 0) return 0;
        return Number((amountBrl / rate).toFixed(2));
    }
}
