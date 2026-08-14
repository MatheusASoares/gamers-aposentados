// src/services/deals/currencyService.ts

import { CurrencyRate } from "@/types/deals";
import { dealsCache, CACHE_TTL } from "./dealsCache";

const AWESOME_API_URL = "https://economia.awesomeapi.com.br/last/USD-BRL";
const FALLBACK_USD_BRL_RATE = 5.45;

interface AwesomeApiResponse {
    USDBRL?: {
        code: string;
        codein: string;
        name: string;
        high: string;
        low: string;
        varBid: string;
        pctChange: string;
        bid: string;
        ask: string;
        timestamp: string;
        create_date: string;
    };
}

export class CurrencyService {
    private static CACHE_KEY = "currency:usd_brl";

    /**
     * Fetches current commercial USD/BRL rate with caching and safe fallback.
     */
    static async getUsdBrlRate(): Promise<CurrencyRate> {
        const cached = dealsCache.get<CurrencyRate>(this.CACHE_KEY);
        if (cached) {
            return cached;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(AWESOME_API_URL, {
                signal: controller.signal,
                headers: {
                    Accept: "application/json",
                },
                next: { revalidate: CACHE_TTL.CURRENCY_RATE },
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`AwesomeAPI responded with status: ${res.status}`);
            }

            const data: AwesomeApiResponse = await res.json();
            const quote = data.USDBRL;

            if (!quote || !quote.bid) {
                throw new Error("Invalid response format from AwesomeAPI");
            }

            const rateValue = parseFloat(quote.bid);
            const highValue = parseFloat(quote.high || quote.bid);
            const lowValue = parseFloat(quote.low || quote.bid);
            const pctChangeValue = parseFloat(quote.pctChange || "0");

            const rateData: CurrencyRate = {
                code: "USD",
                codein: "BRL",
                rate: rateValue > 0 ? rateValue : FALLBACK_USD_BRL_RATE,
                high: highValue,
                low: lowValue,
                pctChange: pctChangeValue,
                updatedAt: quote.create_date || new Date().toISOString(),
                isFallback: false,
            };

            dealsCache.set(this.CACHE_KEY, rateData, CACHE_TTL.CURRENCY_RATE);
            return rateData;
        } catch (error) {
            console.warn(
                "[CurrencyService] Failed to fetch live rate, using fallback:",
                error instanceof Error ? error.message : error,
            );

            const fallbackRate: CurrencyRate = {
                code: "USD",
                codein: "BRL",
                rate: FALLBACK_USD_BRL_RATE,
                high: FALLBACK_USD_BRL_RATE,
                low: FALLBACK_USD_BRL_RATE,
                pctChange: 0,
                updatedAt: new Date().toISOString(),
                isFallback: true,
            };

            // Cache fallback for a shorter time (15 mins) so we retry soon
            dealsCache.set(this.CACHE_KEY, fallbackRate, 60 * 15);
            return fallbackRate;
        }
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
