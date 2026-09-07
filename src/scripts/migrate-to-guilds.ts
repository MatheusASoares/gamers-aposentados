import { prisma } from "../lib/prisma";

export async function migrateToGuilds() {
    console.log("🚀 Iniciando migração para Multi-Guildas (Fase 1)...");

    // 1. Localizar ou garantir os usuários fundadores
    const matheusEmail = "matheus31also@gmail.com";
    const lucasEmail = "lucasedu17gomes@gmail.com";
    const leticiaEmail = "lsoares.english@gmail.com";
    const ygnosEmail = "yanhyuuga@gmail.com";

    const matheus = await prisma.user.findUnique({ where: { email: matheusEmail } });
    const lucas = await prisma.user.findUnique({ where: { email: lucasEmail } });
    const leticia = await prisma.user.findUnique({ where: { email: leticiaEmail } });
    const ygnos = await prisma.user.findUnique({ where: { email: ygnosEmail } });

    if (!matheus || !lucas) {
        throw new Error("❌ Usuários fundadores (Matheus e Lucas) não encontrados no banco de dados.");
    }

    console.log(`👤 Fundadores localizados: Matheus (${matheus.id}) e Lucas (${lucas.id})`);

    // 2. Criar ou Atualizar a "Guilda dos Fundadores"
    const founderGuild = await prisma.guild.upsert({
        where: { slug: "fundadores" },
        update: {
            name: "Guilda dos Fundadores",
            description: "A guilda lendária original de Matheus & Lucas. Foco em zerar o backlog, campanhas épicas e platinas.",
            invite_code: "FUNDADORES",
            owner_id: matheus.id,
            level: 8,
            xp_points: 4800,
            equipped_title: "Fundadores Lendários",
            equipped_banner: "banner-retro-arcade",
            equipped_emblem: "emblem-shield-purple",
        },
        create: {
            slug: "fundadores",
            name: "Guilda dos Fundadores",
            description: "A guilda lendária original de Matheus & Lucas. Foco em zerar o backlog, campanhas épicas e platinas.",
            invite_code: "FUNDADORES",
            owner_id: matheus.id,
            level: 8,
            xp_points: 4800,
            equipped_title: "Fundadores Lendários",
            equipped_banner: "banner-retro-arcade",
            equipped_emblem: "emblem-shield-purple",
        },
    });

    console.log(`🛡️ Guilda dos Fundadores criada/atualizada: ID = ${founderGuild.id}`);

    // 3. Adicionar membros fundadores com seus papéis e status de participação ativa
    const memberData = [
        { userId: matheus.id, role: "LEADER" as const, isActive: true, name: "Matheus" },
        { userId: lucas.id, role: "LEADER" as const, isActive: true, name: "Lucas" },
        ...(leticia ? [{ userId: leticia.id, role: "MEMBER" as const, isActive: false, name: "Letícia" }] : []),
        ...(ygnos ? [{ userId: ygnos.id, role: "MEMBER" as const, isActive: false, name: "Ygnos" }] : []),
    ];

    for (const m of memberData) {
        await prisma.guildMember.upsert({
            where: {
                guild_id_user_id: {
                    guild_id: founderGuild.id,
                    user_id: m.userId,
                },
            },
            update: {
                role: m.role,
                is_active: m.isActive,
            },
            create: {
                guild_id: founderGuild.id,
                user_id: m.userId,
                role: m.role,
                is_active: m.isActive,
            },
        });
        const statusLabel = m.isActive ? "🟢 ATIVO NO RANDOMIZER" : "⚪ ESPECTADOR/INATIVO";
        console.log(`   ✅ Membro vinculado: ${m.name} (${m.role}) - ${statusLabel}`);
    }

    // 4. Vincular todos os Pools históricos existentes à Guilda dos Fundadores
    const updatedPools = await prisma.pool.updateMany({
        where: {
            OR: [
                { guild_id: null },
                { guild_id: "" },
            ],
        },
        data: {
            guild_id: founderGuild.id,
        },
    });
    console.log(`🎲 ${updatedPools.count} Pools históricos vinculados à Guilda dos Fundadores.`);

    // 5. Vincular Contratos de Campanha e Propostas Especiais existentes
    const updatedContracts = await prisma.campaignContract.updateMany({
        where: {
            OR: [
                { guild_id: null },
            ],
        },
        data: {
            guild_id: founderGuild.id,
        },
    });
    console.log(`📜 ${updatedContracts.count} Contratos vinculados à Guilda dos Fundadores.`);

    const updatedProposals = await prisma.specialGameProposal.updateMany({
        where: {
            OR: [
                { guild_id: null },
            ],
        },
        data: {
            guild_id: founderGuild.id,
        },
    });
    console.log(`⏸️ ${updatedProposals.count} Propostas de Pausa Ativa vinculadas.`);

    console.log("\n✨ Migração da FASE 1 concluída com 100% de sucesso!");
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("migrate-to-guilds.ts")) {
    migrateToGuilds()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
