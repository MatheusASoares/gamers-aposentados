// scripts/verify-steam-sales.ts

import {
    getSteamSaleStatus,
    getTimeRemaining,
    STEAM_SALES_SCHEDULE,
} from "../src/lib/constants/steam-sales";

function formatDateBR(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
    });
}

function main() {
    const now = new Date();
    console.log("==================================================");
    console.log("🎮 GAMERS APOSENTADOS - RADAR OFICIAL STEAM SALES");
    console.log(`⏰ Data Atual do Sistema: ${now.toISOString()} (${formatDateBR(now.toISOString())} BRT)`);
    console.log("==================================================\n");

    const { currentSale, nextSale, upcomingList } = getSteamSaleStatus(now);

    if (currentSale) {
        const remaining = getTimeRemaining(currentSale.endDate, now);
        console.log("🔥 PROMOÇÃO EM ANDAMENTO:");
        console.log(`   Nome:    ${currentSale.name} (${currentSale.emoji})`);
        console.log(`   Término: ${formatDateBR(currentSale.endDate)} BRT`);
        console.log(`   Tempo Restante: ${remaining.days}d ${remaining.hours}h ${remaining.minutes}m ${remaining.seconds}s\n`);
    } else {
        console.log("🟢 Nenhuma grande promoção ocorrendo no momento exato.\n");
    }

    if (nextSale) {
        const remaining = getTimeRemaining(nextSale.startDate, now);
        console.log("🎯 PRÓXIMA GRANDE PROMOÇÃO:");
        console.log(`   Nome:    ${nextSale.name} (${nextSale.emoji})`);
        console.log(`   Início:  ${formatDateBR(nextSale.startDate)} BRT`);
        console.log(`   Término: ${formatDateBR(nextSale.endDate)} BRT`);
        console.log(`   Contagem Regressiva: ${remaining.days} dias, ${remaining.hours} horas, ${remaining.minutes} minutos`);
        console.log(`   Dica:    ${nextSale.tip}\n`);
    }

    console.log("📅 CALENDÁRIO DAS PRÓXIMAS SALES CADASTRADAS:");
    console.log("--------------------------------------------------");
    upcomingList.forEach((sale, index) => {
        const isNext = sale.id === nextSale?.id;
        const prefix = isNext ? "👉 [PRÓXIMA]" : `   [${index + 1}]`;
        console.log(`${prefix} ${sale.shortName} (${sale.emoji})`);
        console.log(`      Período: ${formatDateBR(sale.startDate)} até ${formatDateBR(sale.endDate)} BRT`);
    });

    console.log("\n==================================================");
    console.log("ℹ️  Fonte Oficial: Steamworks & SteamDB Sales History");
    console.log("📁 Arquivo de Configuração: src/lib/constants/steam-sales.ts");
    console.log("==================================================\n");
}

main();
