"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  calculateGameXP,
  calculateReviewXP,
  calculateLevelFromXP,
  getRankTierTitle
} from "@/app/lib/xp-engine";

/**
 * Recalculates and updates total XP, level, and default title for a given user.
 */
export async function recalculateUserXPAndLevel(userId: string) {
  const [completedProgresses, userReviews] = await Promise.all([
    prisma.gameProgress.findMany({
      where: {
        user_id: userId,
        status: "COMPLETED",
      },
      include: {
        game: true,
      },
    }),
    prisma.review.findMany({
      where: {
        user_id: userId,
      },
    }),
  ]);

  let totalXP = 0;
  for (const progress of completedProgresses) {
    const gameXP = calculateGameXP({
      hltbHours: progress.game.hltb_time,
      questType: progress.game.quest_type,
      isPlatinum: progress.is_platinum,
      failedRollsCount: 0,
    });
    totalXP += gameXP;
  }

  for (const review of userReviews) {
    const reviewXP = calculateReviewXP({
      reviewText: review.review_text,
      screenshots: review.screenshots,
    });
    totalXP += reviewXP;
  }

  const { level } = calculateLevelFromXP(totalXP);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { equipped_title: true, level: true },
  });

  // If no title is equipped or user leveled up, assign default title if none set
  const titleToSet = currentUser?.equipped_title || getRankTierTitle(level);

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp_points: totalXP,
      level: level,
      equipped_title: titleToSet,
    },
  });

  return { totalXP, level };
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

    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/quests");
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

    revalidatePath("/profile");
    revalidatePath("/dashboard");
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

    await prisma.$executeRaw`UPDATE users SET equipped_frame = ${frameUrl} WHERE id = ${session.user.id}`;

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/");
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

    await prisma.$executeRaw`UPDATE users SET equipped_banner = ${bannerId} WHERE id = ${session.user.id}`;

    revalidatePath("/profile");
    revalidatePath("/dashboard");
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

    await prisma.$executeRaw`UPDATE users SET equipped_theme = ${themeId} WHERE id = ${session.user.id}`;

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[equipTheme] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Backfill script helper to recalculate XP & Levels for all users.
 */
export async function runBackfillXP(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const u of users) {
      await recalculateUserXPAndLevel(u.id);
    }
    try {
      revalidatePath("/");
      revalidatePath("/profile");
    } catch {
      // Ignored outside Next.js request context (e.g. scripts/CLI)
    }
    return { success: true, count: users.length };
  } catch (error) {
    console.error("[runBackfillXP] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
