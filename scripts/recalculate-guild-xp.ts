import { prisma } from "../src/lib/prisma";
import { recalculateGuildXPAndLevel } from "../src/app/lib/guild-gamification-actions";
import { calculateGuildGameXP } from "../src/lib/guild-gamification-utils";

async function main() {
  console.log("================================================================================");
  console.log("🚀 INICIANDO AUDITORIA E RECÁLCULO DE XP DA GUILDA (NOVA ENGINE DINÂMICA)");
  console.log("================================================================================\n");

  const guild = await prisma.guild.findFirst({
    where: { slug: { in: ["aposentados", "fundadores"] } },
    include: {
      members: {
        include: {
          user: {
            include: {
              gameProgress: {
                where: { status: "COMPLETED" },
                include: { game: true },
              },
              reviews: true,
              contractProgresses: {
                where: { status: "COMPLETED" },
              },
            },
          },
        },
      },
    },
  });

  if (!guild) {
    console.error("❌ Guilda Aposentados não encontrada no banco!");
    return;
  }

  const oldXP = guild.xp_points;
  const oldLevel = guild.level;

  console.log(`🏰 Guilda: "${guild.name}" (Slug: ${guild.slug}, ID: ${guild.id})`);
  console.log(`📊 Status Anterior no Banco: ${oldXP} XP | Nível ${oldLevel}`);
  console.log(`👥 Membros (${guild.members.length}):`);

  const gamesMap = new Map<string, { title: string; questType: string; hltb: number | null; userIds: string[]; calc: any }>();

  for (const m of guild.members) {
    console.log(`\n  👤 ${m.user.name || "Sem Nome"} (${m.role}, Ativo: ${m.is_active}):`);
    console.log(`     - Quests Zeradas: ${m.user.gameProgress.length}`);
    console.log(`     - Reviews: ${m.user.reviews.length} (+${m.user.reviews.length * 100} XP)`);
    console.log(`     - Contratos: ${m.user.contractProgresses.length} (+${m.user.contractProgresses.length * 50} XP)`);

    for (const p of m.user.gameProgress) {
      const calc = calculateGuildGameXP({
        questType: p.game.quest_type,
        hltbHours: p.game.hltb_time,
        isPlatinum: p.is_platinum,
      });

      console.log(
        `       • [${p.game.quest_type}] "${p.game.title}" -> Base: ${calc.baseHonorXP} + Horas(${calc.effectiveHours}h): ${calc.hoursXP} = ${calc.baseGameXP} XP${
          p.is_platinum ? ` (Platina +${calc.platinumBonusXP})` : ""
        } -> Subtotal: ${calc.totalMemberXP} XP`
      );

      const existing = gamesMap.get(p.game.id);
      if (existing) {
        existing.userIds.push(m.user_id);
      } else {
        gamesMap.set(p.game.id, {
          title: p.game.title,
          questType: p.game.quest_type,
          hltb: p.game.hltb_time,
          userIds: [m.user_id],
          calc,
        });
      }
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("🤝 ANÁLISE DE SINERGIA CO-OP (QUESTS ZERADAS EM DUPLA / GRUPO)");
  console.log("--------------------------------------------------------------------------------");

  let coopTotalBonus = 0;
  for (const [, item] of gamesMap) {
    if (item.userIds.length >= 2) {
      coopTotalBonus += item.calc.coopSynergyBonusXP;
      console.log(
        `  ✨ [CO-OP CLEARED] "${item.title}" (${item.userIds.length} membros) -> Bônus Sinergia (+25%): +${item.calc.coopSynergyBonusXP} XP`
      );
    }
  }

  console.log(`\n  Total Bônus Co-op Conquistado: +${coopTotalBonus} XP`);

  console.log("\n--------------------------------------------------------------------------------");
  console.log("⚡ EXECUTANDO RECÁLCULO OFICIAL...");
  console.log("--------------------------------------------------------------------------------");

  const result = await recalculateGuildXPAndLevel(guild.id);

  if (!result.success) {
    console.error("❌ Falha no recálculo:", result.error);
    return;
  }

  console.log("\n================================================================================");
  console.log("🎉 RECÁLCULO CONCLUÍDO COM SUCESSO!");
  console.log("================================================================================");
  console.log(`📈 XP Anterior:  ${oldXP} XP  (Nível ${oldLevel})`);
  console.log(`⭐ Novo XP:      ${result.xpPoints} XP  (Nível ${result.level})`);
  console.log(`🚀 Saldo Ganho:  +${result.xpPoints - oldXP} XP`);
  if (result.breakdown) {
    console.log("\n📋 Detalhamento da Nova Pontuação:");
    console.log(`   - XP Individual das Quests (HLTB + Platina): ${result.breakdown.gamesXP} XP`);
    console.log(`   - Bônus Co-op de Sinergia (${result.breakdown.coopGamesCount} jogos zerados em dupla): ${result.breakdown.coopSynergyXP} XP`);
    console.log(`   - Reviews Publicadas: ${result.breakdown.reviewsXP} XP`);
    console.log(`   - Contratos de Mural: ${result.breakdown.contractsXP} XP`);
    console.log(`   --------------------------------------------------------`);
    console.log(`   TOTAL CONSOLIDADO: ${result.xpPoints} XP (Nível ${result.level})`);
  }
  console.log("================================================================================\n");
}

main()
  .catch((e) => {
    console.error("Erro fatal:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
