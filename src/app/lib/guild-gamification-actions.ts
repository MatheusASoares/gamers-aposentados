"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getActiveGuild } from "@/app/lib/guild-actions";
import { GUILD_REWARDS_CATALOG, isGuildRewardUnlocked } from "@/lib/constants/guild-rewards";
import { calculateGuildLevelFromXP } from "@/lib/guild-xp-engine";

/**
 * Recalcula e persiste o XP total e nível de uma guilda com base nas conquistas coletivas dos membros.
 */
export async function recalculateGuildXPAndLevel(guildId: string): Promise<{
  success: boolean;
  xpPoints: number;
  level: number;
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

    let totalGuildXP = 0;

    for (const member of guild.members) {
      // 1. Quests Zeradas (Main Quest = 500 XP, Side Quest = 300 XP, Platina = +200 XP)
      for (const progress of member.user.gameProgress) {
        if (progress.game.quest_type === "MAIN_QUEST") {
          totalGuildXP += 500;
        } else if (progress.game.quest_type === "SIDE_QUEST") {
          totalGuildXP += 300;
        }

        if (progress.is_platinum) {
          totalGuildXP += 200;
        }
      }

      // 2. Reviews Publicadas (100 XP cada)
      totalGuildXP += member.user.reviews.length * 100;

      // 3. Contratos de Mural Concluídos (50 XP cada)
      totalGuildXP += member.user.contractProgresses.length * 50;
    }

    const activeMemberCount = Math.max(2, guild.members.filter((m) => m.is_active).length);
    const newLevel = calculateGuildLevelFromXP(totalGuildXP, activeMemberCount);

    await prisma.guild.update({
      where: { id: guildId },
      data: {
        xp_points: totalGuildXP,
        level: newLevel,
      },
    });

    revalidatePath("/guild");
    revalidatePath("/");
    revalidatePath("/dashboard");

    return {
      success: true,
      xpPoints: totalGuildXP,
      level: newLevel,
    };
  } catch (error) {
    console.error("[recalculateGuildXPAndLevel] Error:", error);
    return {
      success: false,
      xpPoints: 0,
      level: 1,
      error: error instanceof Error ? error.message : "Erro ao recalcular XP da guilda",
    };
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
