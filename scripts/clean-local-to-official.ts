import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanLocalDatabase() {
  console.log("🧹 [1/5] Identificando usuários oficiais...");

  // Buscar usuários oficiais
  const allUsers = await prisma.user.findMany();
  
  // Identificar usuários reais
  const officialUsers = allUsers.filter((u) => {
    const isTest = 
      u.name?.toLowerCase().includes("test") ||
      u.username?.toLowerCase().includes("test") ||
      u.email?.toLowerCase().includes("test") ||
      u.email?.includes("@example.com") ||
      u.email?.includes("guard_") ||
      u.email?.includes("draw_") ||
      u.email?.includes("memtester_") ||
      u.email?.includes("label_");
    return !isTest;
  });

  console.log(`Encontrados ${officialUsers.length} usuários oficiais:`);
  officialUsers.forEach((u) => console.log(` - ${u.name} (${u.email}) [ID: ${u.id}]`));

  const officialUserIds = officialUsers.map((u) => u.id);

  // Deletar associações de usuários de teste
  console.log("\n🗑️ [2/5] Excluindo registros associados a usuários de teste...");

  // 1. Guild Members de usuários de teste
  const deletedMembers = await prisma.guildMember.deleteMany({
    where: { user_id: { notIn: officialUserIds } },
  });
  console.log(` - Removidos ${deletedMembers.count} membros de teste de guildas.`);

  // 2. Pool entries de usuários de teste
  const deletedEntries = await prisma.poolEntry.deleteMany({
    where: { user_id: { notIn: officialUserIds } },
  });
  console.log(` - Removidas ${deletedEntries.count} entradas de teste em potes.`);

  // 3. Progressos de jogos de usuários de teste
  const deletedProgress = await prisma.gameProgress.deleteMany({
    where: { user_id: { notIn: officialUserIds } },
  });
  console.log(` - Removidos ${deletedProgress.count} progressos de teste.`);

  // 4. Reviews de usuários de teste
  const deletedReviews = await prisma.review.deleteMany({
    where: { user_id: { notIn: officialUserIds } },
  });
  console.log(` - Removidas ${deletedReviews.count} reviews de teste.`);

  // 5. Contratos de usuários de teste
  await prisma.campaignContractProgress.deleteMany({
    where: { user_id: { notIn: officialUserIds } },
  });
  await prisma.specialGameVote.deleteMany({
    where: { user_id: { notIn: officialUserIds } },
  });
  await prisma.specialGameProposal.deleteMany({
    where: { proposer_id: { notIn: officialUserIds } },
  });

  // 6. Contas e Sessões de teste
  await prisma.account.deleteMany({
    where: { userId: { notIn: officialUserIds } },
  });
  await prisma.session.deleteMany({
    where: { userId: { notIn: officialUserIds } },
  });

  // 7. Jogos de teste nomeados por usuários de teste (ex: "ResumeTestGame...", "IGDB-Test...")
  const testGames = await prisma.game.findMany({
    where: {
      OR: [
        { title: { contains: "ResumeTestGame" } },
        { title: { contains: "IGDB-Test" } },
        { title: { contains: "Test Game" } },
      ],
    },
  });

  if (testGames.length > 0) {
    const testGameIds = testGames.map((g) => g.id);
    await prisma.gameProgress.deleteMany({ where: { game_id: { in: testGameIds } } });
    await prisma.poolEntry.deleteMany({ where: { game_id: { in: testGameIds } } });
    await prisma.pool.deleteMany({
      where: { winner_game_id: { in: testGameIds } },
    });
    await prisma.game.deleteMany({ where: { id: { in: testGameIds } } });
    console.log(` - Removidos ${testGames.length} jogos temporários de teste.`);
  }

  // 8. Deletar os usuários de teste
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { notIn: officialUserIds } },
  });
  console.log(` - Excluídos ${deletedUsers.count} usuários fantasmas de teste.`);

  console.log("\n🛡️ [3/5] Reestruturando a Guilda dos Fundadores com os usuários oficiais...");

  let foundersGuild = await prisma.guild.findFirst({
    where: { slug: "fundadores" },
  });

  const matheus = officialUsers.find((u) => u.name === "Matheus" || u.email?.includes("matheus"));
  const lucas = officialUsers.find((u) => u.name === "Lucas" || u.email?.includes("lucas") || u.email?.includes("lucasedu"));
  const leticia = officialUsers.find((u) => u.name?.includes("Let") || u.email?.includes("leticia"));
  const ygnos = officialUsers.find((u) => u.name?.includes("Ygnos") || u.username === "ygnos" || u.email?.includes("yanhyuuga"));

  const ownerId = matheus?.id || lucas?.id || officialUsers[0]?.id;

  if (!foundersGuild) {
    foundersGuild = await prisma.guild.create({
      data: {
        name: "Guilda dos Fundadores",
        slug: "fundadores",
        description: "A guilda lendária original de Matheus & Lucas. Foco em zerar o backlog, campanhas épicas e platinas.",
        invite_code: "FUNDADORES-OFICIAL-2026",
        owner_id: ownerId,
        equipped_title: "Guilda de Garagem",
        equipped_emblem: "Escudo dos Fundadores",
      },
    });
  } else {
    await prisma.guild.update({
      where: { id: foundersGuild.id },
      data: {
        owner_id: ownerId,
        name: "Guilda dos Fundadores",
        description: "A guilda lendária original de Matheus & Lucas. Foco em zerar o backlog, campanhas épicas e platinas.",
      },
    });
  }

  // Limpar membros da guilda e reinserir oficiais
  await prisma.guildMember.deleteMany({ where: { guild_id: foundersGuild.id } });

  if (matheus) {
    await prisma.guildMember.create({
      data: { guild_id: foundersGuild.id, user_id: matheus.id, role: "LEADER", is_active: true },
    });
    console.log(` - Matheus vinculado como LÍDER (Ativo)`);
  }
  if (lucas) {
    await prisma.guildMember.create({
      data: { guild_id: foundersGuild.id, user_id: lucas.id, role: "LEADER", is_active: true },
    });
    console.log(` - Lucas vinculado como LÍDER (Ativo)`);
  }
  if (leticia) {
    await prisma.guildMember.create({
      data: { guild_id: foundersGuild.id, user_id: leticia.id, role: "MEMBER", is_active: false },
    });
    console.log(` - Letícia vinculada como MEMBRO (Espectadora)`);
  }
  if (ygnos) {
    await prisma.guildMember.create({
      data: { guild_id: foundersGuild.id, user_id: ygnos.id, role: "MEMBER", is_active: false },
    });
    console.log(` - Ygnos vinculado como MEMBRO (Espectador)`);
  }

  // Associar todos os pools existentes à Guilda dos Fundadores
  await prisma.pool.updateMany({
    data: { guild_id: foundersGuild.id },
  });

  const { recalculateUserXPAndLevel } = await import("../src/app/lib/xp-engine");

  for (const user of officialUsers) {
    const res = await recalculateUserXPAndLevel(user.id);
    console.log(` - ${user.name}: ${res.totalXP} XP (Nível ${res.level})`);
  }

  // XP Coletivo da Guilda
  let totalGuildXP = 0;
  const allCompleted = await prisma.gameProgress.findMany({
    where: {
      status: "COMPLETED",
      user_id: { in: officialUserIds },
    },
    include: { game: true },
  });
  for (const prog of allCompleted) {
    if (prog.game.quest_type === "MAIN_QUEST") totalGuildXP += 500;
    else if (prog.game.quest_type === "SIDE_QUEST") totalGuildXP += 300;
    if (prog.is_platinum) totalGuildXP += 200;
  }
  const allReviewsCount = await prisma.review.count({
    where: { user_id: { in: officialUserIds } },
  });
  totalGuildXP += allReviewsCount * 100;

  const { calculateGuildLevelFromXP } = await import("../src/lib/guild-xp-engine");
  const guildLevel = calculateGuildLevelFromXP(totalGuildXP);
  await prisma.guild.update({
    where: { id: foundersGuild.id },
    data: { xp_points: totalGuildXP, level: guildLevel },
  });

  console.log(`\n🎉 [5/5] CONCLUÍDO COM SUCESSO!`);
  console.log(` - Guilda: ${foundersGuild.name} (Nível ${guildLevel}, ${totalGuildXP} XP)`);
  console.log(` - Total de Usuários no Banco Local: ${await prisma.user.count()}`);
  console.log(` - Total de Membros na Guilda: ${await prisma.guildMember.count()}`);
  console.log(` - Membros Ativos no Randomizer/Quests: 2 (Matheus & Lucas)`);
}

cleanLocalDatabase()
  .catch((err) => {
    console.error("Erro:", err);
  })
  .finally(() => prisma.$disconnect());
