"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isRandomizerPlayer } from "@/lib/randomizer-players";
import {
  recalculateUserXPAndLevel as recalculateUserXPAndLevelLogic,
  recalculateAllUsersXPAndLevel,
} from "@/app/lib/xp-engine";

export async function recalculateUserXPAndLevel(userId: string) {
  return recalculateUserXPAndLevelLogic(userId);
}

/**
 * Action to claim platinum status (+50% XP bonus) on a completed game.
 */
export async function claimPlatinumBonus(progressId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const progress = await prisma.gameProgress.findUnique({
      where: { id: progressId },
      include: { game: true },
    });

    if (!progress || progress.user_id !== session.user.id) {
      return { success: false, error: "Progress not found or unauthorized" };
    }

    if (progress.status !== "COMPLETED") {
      return { success: false, error: "Game must be completed before claiming platinum" };
    }

    if (progress.is_platinum) {
      return { success: true };
    }

    await prisma.gameProgress.update({
      where: { id: progressId },
      data: {
        is_platinum: true,
        platinum_at: new Date(),
      },
    });

    await recalculateUserXPAndLevel(session.user.id);

    try {
      const { getActiveGuild } = await import("@/app/lib/guild-actions");
      const { recalculateGuildXPAndLevel } = await import("@/app/lib/guild-gamification-actions");
      const activeGuild = await getActiveGuild();
      if (activeGuild?.id) {
        await recalculateGuildXPAndLevel(activeGuild.id);
      }
    } catch {
      // Fallback
    }

    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/quests");
    revalidatePath("/guild");
    return { success: true };
  } catch (error) {
    console.error("[claimPlatinumBonus] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

import { REWARDS_CATALOG, isRewardUnlocked } from "@/lib/constants/rewards";

/**
 * Action to equip an unlocked rank title.
 */
export async function equipTitle(title: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { level: true },
    });

    if (!user) return { success: false, error: "User not found" };

    const rewardItem = REWARDS_CATALOG.find((r) => r.type === "TITLE" && r.name === title);
    if (!rewardItem || !isRewardUnlocked(rewardItem.level, user.level)) {
      return { success: false, error: `Título trancado. Requer Nível ${rewardItem?.level || 1}` };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { equipped_title: title },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[equipTitle] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Action to equip an unlocked avatar frame.
 */
export async function equipFrame(frameUrl: string | null): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    if (frameUrl) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { level: true } });
      const frameItem = REWARDS_CATALOG.find((r) => r.type === "FRAME" && r.assetUrl === frameUrl);
      if (frameItem && user && !isRewardUnlocked(frameItem.level, user.level)) {
        return { success: false, error: `Moldura trancada. Requer Nível ${frameItem.level}` };
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { equipped_frame: frameUrl },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[equipFrame] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Action to equip an unlocked profile banner.
 */
export async function equipBanner(bannerId: string | null): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    if (bannerId) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { level: true } });
      const bannerItem = REWARDS_CATALOG.find((r) => r.type === "BANNER" && r.id === bannerId);
      if (bannerItem && user && !isRewardUnlocked(bannerItem.level, user.level)) {
        return { success: false, error: `Banner trancado. Requer Nível ${bannerItem.level}` };
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { equipped_banner: bannerId },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[equipBanner] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Action to equip an unlocked app theme.
 */
export async function equipTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    if (themeId && themeId !== "cyberpunk") {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { level: true } });
      const themeItem = REWARDS_CATALOG.find((r) => r.type === "THEME" && r.id === themeId);
      if (themeItem && user && !isRewardUnlocked(themeItem.level, user.level)) {
        return { success: false, error: `Tema trancado. Requer Nível ${themeItem.level}` };
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { equipped_theme: themeId },
    });

    try {
      const cookieStore = await cookies();
      cookieStore.set("gp_theme", themeId, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    } catch (cookieErr) {
      console.warn("[equipTheme] Cookie set error:", cookieErr);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[equipTheme] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Backfill script helper to recalculate XP & Levels for all users.
 * Protected: Requires active session from an authorized administrator.
 * Optimized: Uses batch aggregation and chunked transactions, eliminating N+1 queries.
 */
export async function runBackfillXP(): Promise<{ success: boolean; count?: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !isRandomizerPlayer(session.user.email)) {
    return { success: false, error: "Unauthorized: Apenas administradores podem executar o backfill de XP." };
  }

  try {
    const { count } = await recalculateAllUsersXPAndLevel();
    try {
      revalidatePath("/");
      revalidatePath("/profile");
      revalidatePath("/leaderboard");
    } catch {
      // Ignored outside Next.js request context (e.g. scripts/CLI)
    }
    return { success: true, count };
  } catch (error) {
    console.error("[runBackfillXP] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

