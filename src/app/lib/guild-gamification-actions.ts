"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getActiveGuild } from "@/app/lib/guild-actions";
import { GUILD_REWARDS_CATALOG, isGuildRewardUnlocked } from "@/lib/constants/guild-rewards";
import { calculateGuildLevelFromXP } from "@/lib/guild-xp-engine";

import { calculateGuildGameXP, GUILD_XP_CONSTANTS } from "@/lib/guild-gamification-utils";
import { isRandomizerPlayer } from "@/lib/randomizer-players";

interface GuildGamificationInput {
  members: Array<{
    user_id: string;
    is_active: boolean;
    user: {
      gameProgress: Array<{
        is_platinum: boolean;
        game: {
          id: string;
          title: string;
          quest_type: any;
          hltb_time: number | null;
        };
      }>;
      reviews: Array<any>;
      contractProgresses: Array<any>;
    };
  }>;
}

/**
 * Pure calculation helper for guild gamification data.
 * Computes individual game quest XP, co-op synergy bonus, reviews, contracts, and guild level.
 */
export function computeGuildGamificationData(guild: GuildGamificationInput) {
  let gamesXP = 0;
  let reviewsXP = 0;
  let contractsXP = 0;

  // Rastreia jogos completados por membro para calcular o Bônus de Sinergia Co-op
  // Mapeamento: gameId -> { game: Game, userIds: Set<string>, baseGameXP: number, coopBonusXP: number }
  const gameCompletionsMap = new Map<
    string,
    {
      title: string;
      userIds: Set<string>;
      coopBonusXP: number;
    }
  >();

  for (const member of guild.members) {
    // 1. Quests Zeradas (Dinâmico: Base de honra + horas HLTB + platina proporcional)
    for (const progress of member.user.gameProgress) {
      const calc = calculateGuildGameXP({
        questType: progress.game.quest_type,
        hltbHours: progress.game.hltb_time,
        isPlatinum: progress.is_platinum,
      });

      gamesXP += calc.totalMemberXP;

      // Registra para análise de co-op (conclusão em dupla/grupo)
      const gameId = progress.game.id;
      const existing = gameCompletionsMap.get(gameId);
      if (existing) {
        existing.userIds.add(member.user_id);
      } else {
        gameCompletionsMap.set(gameId, {
          title: progress.game.title,
          userIds: new Set([member.user_id]),
          coopBonusXP: calc.coopSynergyBonusXP,
        });
      }
    }

    // 2. Reviews Publicadas (+100 XP cada)
    reviewsXP += member.user.reviews.length * GUILD_XP_CONSTANTS.REVIEW_XP;

    // 3. Contratos de Mural Concluídos (+50 XP cada)
    contractsXP += member.user.contractProgresses.length * GUILD_XP_CONSTANTS.CONTRACT_XP;
  }

  // 4. Bônus de Sinergia Co-op (+25% do valor base para cada quest completada por 2+ membros)
  let coopSynergyXP = 0;
  let coopGamesCount = 0;

  for (const [, item] of gameCompletionsMap) {
    if (item.userIds.size >= 2) {
      coopSynergyXP += item.coopBonusXP;
      coopGamesCount++;
    }
  }

  const totalGuildXP = gamesXP + coopSynergyXP + reviewsXP + contractsXP;
  const activeMemberCount = Math.max(2, guild.members.filter((m) => m.is_active).length);
  const newLevel = calculateGuildLevelFromXP(totalGuildXP, activeMemberCount);

  return {
    totalGuildXP,
    newLevel,
    breakdown: {
      gamesXP,
      coopSynergyXP,
      reviewsXP,
      contractsXP,
      coopGamesCount,
    },
  };
}

/**
 * Recalcula e persiste o XP total e nível de uma guilda com base nas conquistas coletivas dos membros,
 * considerando a unicidade de cada quest (categoria + horas HLTB + platina proporcional)
 * e o Bônus de Sinergia Co-op quando ambos/múltiplos membros concluem a mesma quest.
 */
export async function recalculateGuildXPAndLevel(guildId: string): Promise<{
  success: boolean;
  xpPoints: number;
  level: number;
  breakdown?: {
    gamesXP: number;
    coopSynergyXP: number;
    reviewsXP: number;
    contractsXP: number;
    coopGamesCount: number;
  };
  error?: string;
}> {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
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
      return { success: false, xpPoints: 0, level: 1, error: "Guilda não encontrada" };
    }

    const { totalGuildXP, newLevel, breakdown } = computeGuildGamificationData(guild);

    await prisma.guild.update({
      where: { id: guildId },
      data: {
        xp_points: totalGuildXP,
        level: newLevel,
      },
    });

    try {
      revalidatePath("/guild");
      revalidatePath("/");
      revalidatePath("/dashboard");
    } catch {
      // Ignora erro de revalidatePath quando invocado via scripts CLI fora do contexto Next.js
    }

    return {
      success: true,
      xpPoints: totalGuildXP,
      level: newLevel,
      breakdown,
    };
  } catch (error) {
    console.error("[recalculateGuildXPAndLevel] Error:", error);
    return {
      success: false,
      xpPoints: 0,
      level: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Recalcula e atualiza XP total e nível de TODAS as guildas em lote.
 * Elimina consultas N+1 trazendo dados consolidados e persistindo em transações por chunks.
 */
export async function recalculateAllGuildsXPAndLevel(chunkSize = 50): Promise<{ count: number }> {
  const guilds = await prisma.guild.findMany({
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

  if (guilds.length === 0) {
    return { count: 0 };
  }

  const updates = guilds.map((guild) => {
    const { totalGuildXP, newLevel } = computeGuildGamificationData(guild);
    return {
      id: guild.id,
      xp_points: totalGuildXP,
      level: newLevel,
    };
  });

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((item) =>
        prisma.guild.update({
          where: { id: item.id },
          data: {
            xp_points: item.xp_points,
            level: item.level,
          },
        })
      )
    );
  }

  return { count: updates.length };
}

/**
 * Backfill script helper to recalculate XP & Levels for all guilds.
 * Protected: Requires active session from an authorized administrator.
 */
export async function runBackfillGuildXP(): Promise<{ success: boolean; count?: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !isRandomizerPlayer(session.user.email)) {
    return { success: false, error: "Unauthorized: Apenas administradores podem executar o backfill de guildas." };
  }

  try {
    const { count } = await recalculateAllGuildsXPAndLevel();
    try {
      revalidatePath("/guild");
      revalidatePath("/");
      revalidatePath("/dashboard");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, count };
  } catch (error) {
    console.error("[runBackfillGuildXP] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Action para Líderes equiparem Brasão, Banner ou Título desbloqueados na Sede da Guilda.
 */
export async function equipGuildCosmeticsAction({
  banner,
  emblem,
  title,
  mascot,
}: {
  banner?: string | null;
  emblem?: string | null;
  title?: string | null;
  mascot?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Usuário não autenticado" };
  }

  try {
    const activeGuild = await getActiveGuild();
    if (!activeGuild) {
      return { success: false, error: "Nenhuma guilda ativa selecionada" };
    }

    const currentMember = activeGuild.members.find((m) => m.userId === userId);
    if (!currentMember || currentMember.role !== "LEADER") {
      return { success: false, error: "Apenas Líderes podem customizar a sede da guilda." };
    }

    const updateData: {
      equipped_banner?: string | null;
      equipped_emblem?: string | null;
      equipped_title?: string | null;
      equipped_mascot?: string | null;
    } = {};

    if (banner !== undefined) {
      if (banner !== null) {
        const reward = GUILD_REWARDS_CATALOG.find((r) => r.type === "BANNER" && (r.name === banner || r.assetUrl === banner));
        if (reward && !isGuildRewardUnlocked(reward.level, activeGuild.level)) {
          return { success: false, error: `Banner bloqueado. Requer Nível ${reward.level} de guilda.` };
        }
      }
      updateData.equipped_banner = banner;
    }

    if (emblem !== undefined) {
      if (emblem !== null) {
        const reward = GUILD_REWARDS_CATALOG.find((r) => r.type === "EMBLEM" && r.name === emblem);
        if (reward && !isGuildRewardUnlocked(reward.level, activeGuild.level)) {
          return { success: false, error: `Brasão bloqueado. Requer Nível ${reward.level} de guilda.` };
        }
      }
      updateData.equipped_emblem = emblem;
    }

    if (title !== undefined) {
      if (title !== null) {
        const reward = GUILD_REWARDS_CATALOG.find((r) => r.type === "TITLE" && r.name === title);
        if (reward && !isGuildRewardUnlocked(reward.level, activeGuild.level)) {
          return { success: false, error: `Título bloqueado. Requer Nível ${reward.level} de guilda.` };
        }
      }
      updateData.equipped_title = title;
    }

    if (mascot !== undefined) {
      if (mascot !== null) {
        const reward = GUILD_REWARDS_CATALOG.find((r) => r.type === "MASCOT" && (r.name === mascot || r.assetUrl === mascot || r.id === mascot));
        if (reward && !isGuildRewardUnlocked(reward.level, activeGuild.level)) {
          return { success: false, error: `Mascote bloqueado. Requer Nível ${reward.level} de guilda.` };
        }
      }
      updateData.equipped_mascot = mascot;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (banner !== undefined) {
      updates.push(`"equipped_banner" = $${paramIndex++}`);
      values.push(banner);
    }
    if (emblem !== undefined) {
      updates.push(`"equipped_emblem" = $${paramIndex++}`);
      values.push(emblem);
    }
    if (title !== undefined) {
      updates.push(`"equipped_title" = $${paramIndex++}`);
      values.push(title);
    }
    if (mascot !== undefined) {
      updates.push(`"equipped_mascot" = $${paramIndex++}`);
      values.push(mascot);
    }

    if (updates.length > 0) {
      updates.push(`"updated_at" = NOW()`);
      values.push(activeGuild.id);
      const sql = `UPDATE "guilds" SET ${updates.join(", ")} WHERE "id" = $${paramIndex}`;
      await prisma.$executeRawUnsafe(sql, ...values);
    }

    revalidatePath("/guild", "page");
    revalidatePath("/guild", "layout");
    revalidatePath("/(main)/guild", "page");
    revalidatePath("/(main)/guild", "layout");
    revalidatePath("/guild");
    revalidatePath("/");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[equipGuildCosmeticsAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao equipar cosméticos da guilda",
    };
  }
}
