// src/lib/constants/steam-sales.ts

export type SteamSaleType = "MAJOR_SEASONAL" | "FEST" | "NEXT_FEST";

export interface SteamSaleEvent {
    id: string;
    name: string;
    shortName: string;
    type: SteamSaleType;
    startDate: string; // ISO 8601 (17:00 UTC = 14:00 BRT)
    endDate: string;   // ISO 8601 (17:00 UTC = 14:00 BRT)
    description: string;
    tip: string;
    emoji: string;
    accentColor: string; // Tailwind/CSS color
    badgeClass: string;
}

/**
 * Calendário Oficial da Valve / Steamworks (com horários padronizados às 17:00 UTC / 14:00 BRT).
 * As 4 Grandes Sales Sazonais (Spring, Summer, Autumn, Winter) + Principais Next Fests e Festivais.
 */
export const STEAM_SALES_SCHEDULE: SteamSaleEvent[] = [
    // 2026 Major Seasonal Events
    {
        id: "steam-spring-sale-2026",
        name: "Steam Spring Sale 2026",
        shortName: "Spring Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2026-03-19T17:00:00Z",
        endDate: "2026-03-26T17:00:00Z",
        description: "A grande promoção sazonal de primavera.",
        tip: "Uma das 4 maiores promoções do ano! Milhares de jogos com descontos de até 90%.",
        emoji: "🌸",
        accentColor: "#22c55e",
        badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    },
    {
        id: "steam-summer-sale-2026",
        name: "Steam Summer Sale 2026",
        shortName: "Summer Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2026-06-25T17:00:00Z",
        endDate: "2026-07-09T17:00:00Z",
        description: "A maior e mais famosa promoção anual do ecossistema Steam.",
        tip: "Duas semanas de descontos massivos em praticamente todo o catálogo da Steam e Steam Deck!",
        emoji: "☀️",
        accentColor: "#f59e0b",
        badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    },
    {
        id: "steam-autumn-sale-2026",
        name: "Steam Autumn Sale 2026",
        shortName: "Autumn Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2026-10-01T17:00:00Z",
        endDate: "2026-10-08T17:00:00Z",
        description: "A grande promoção de outono oficial da Valve confirmada pelo SteamDB.",
        tip: "Excelente oportunidade para pegar os lançamentos do ano com os primeiros grandes cortes de preço.",
        emoji: "🍂",
        accentColor: "#ea580c",
        badgeClass: "border-orange-500/40 bg-orange-500/15 text-orange-300",
    },
    {
        id: "steam-winter-sale-2026",
        name: "Steam Winter Sale 2026 (Fim de Ano)",
        shortName: "Winter Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2026-12-17T17:00:00Z",
        endDate: "2027-01-04T17:00:00Z",
        description: "A gigantesca promoção de Natal e Ano Novo com votação ao vivo do Steam Awards.",
        tip: "A promoção mais longa do ano! Perfeita para queimar o 13º salário e estocar jogos para as férias.",
        emoji: "❄️",
        accentColor: "#38bdf8",
        badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    },
    // 2027 Major Seasonal Events
    {
        id: "steam-spring-sale-2027",
        name: "Steam Spring Sale 2027",
        shortName: "Spring Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2027-03-18T17:00:00Z",
        endDate: "2027-03-25T17:00:00Z",
        description: "Primeira grande promoção sazonal de 2027.",
        tip: "Descontos globais em milhares de franquias consagradas.",
        emoji: "🌸",
        accentColor: "#22c55e",
        badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    },
    {
        id: "steam-summer-sale-2027",
        name: "Steam Summer Sale 2027",
        shortName: "Summer Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2027-06-24T17:00:00Z",
        endDate: "2027-07-08T17:00:00Z",
        description: "A grande promoção de meio de ano da Valve.",
        tip: "Descontos recordes e cartas colecionáveis de evento.",
        emoji: "☀️",
        accentColor: "#f59e0b",
        badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    },
    {
        id: "steam-autumn-sale-2027",
        name: "Steam Autumn Sale 2027",
        shortName: "Autumn Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2027-09-30T17:00:00Z",
        endDate: "2027-10-07T17:00:00Z",
        description: "Promoção de outono e indicações do Steam Awards 2027.",
        tip: "Descontos de outono em títulos de peso.",
        emoji: "🍂",
        accentColor: "#ea580c",
        badgeClass: "border-orange-500/40 bg-orange-500/15 text-orange-300",
    },
    {
        id: "steam-winter-sale-2027",
        name: "Steam Winter Sale 2027 (Fim de Ano)",
        shortName: "Winter Sale",
        type: "MAJOR_SEASONAL",
        startDate: "2027-12-16T17:00:00Z",
        endDate: "2028-01-03T17:00:00Z",
        description: "A gigantesca promoção de fim de ano de 2027.",
        tip: "Votação do Steam Awards e promoções de fim de ano.",
        emoji: "❄️",
        accentColor: "#38bdf8",
        badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    },
];

export interface SteamSaleStatus {
    currentSale: SteamSaleEvent | null;
    nextSale: SteamSaleEvent | null;
    upcomingList: SteamSaleEvent[];
}

/**
 * Identifica a promoção em andamento ou a próxima mais próxima a partir do momento atual.
 */
export function getSteamSaleStatus(now: Date = new Date()): SteamSaleStatus {
    const nowMs = now.getTime();

    // 1. Checa se alguma promoção está acontecendo exatamente AGORA
    const currentSale = STEAM_SALES_SCHEDULE.find((sale) => {
        const start = new Date(sale.startDate).getTime();
        const end = new Date(sale.endDate).getTime();
        return nowMs >= start && nowMs <= end;
    }) || null;

    // 2. Filtra promoções futuras
    const futureSales = STEAM_SALES_SCHEDULE.filter((sale) => {
        const start = new Date(sale.startDate).getTime();
        return nowMs < start;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const nextSale = futureSales[0] || null;

    return {
        currentSale,
        nextSale,
        upcomingList: futureSales.slice(0, 4),
    };
}

export interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
    isCompleted: boolean;
}

export function getTimeRemaining(targetDateIso: string, now: Date = new Date()): TimeRemaining {
    const targetMs = new Date(targetDateIso).getTime();
    const nowMs = now.getTime();
    const totalMs = Math.max(0, targetMs - nowMs);

    if (totalMs <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalMs: 0,
            isCompleted: true,
        };
    }

    const seconds = Math.floor((totalMs / 1000) % 60);
    const minutes = Math.floor((totalMs / 1000 / 60) % 60);
    const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

    return {
        days,
        hours,
        minutes,
        seconds,
        totalMs,
        isCompleted: false,
    };
}
