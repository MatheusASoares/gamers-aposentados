import { QuestType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface RankTier {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  description: string;
  badgeClass: string;
  avatarBorder: string;
  titleColor: string;
  glowColor: string;
  iconName: 'shield' | 'compass' | 'swords' | 'crown' | 'flame';
}

export const RANK_TIERS: RankTier[] = [
  {
    id: 'rookie',
    name: 'Aposentado Novato',
    minLevel: 1,
    maxLevel: 3,
    description: 'Acabou de pendurar as chuteiras e ligar o console.',
    badgeClass: 'border-amber-600/50 bg-amber-950/30 text-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.2)]',
    avatarBorder: 'border-amber-600/60 shadow-[0_0_20px_rgba(217,119,6,0.3)]',
    titleColor: 'text-amber-400',
    glowColor: 'bg-amber-600/15',
    iconName: 'shield',
  },
  {
    id: 'adventurer',
    name: 'Limpador de Poeira',
    minLevel: 4,
    maxLevel: 8,
    description: 'Já tirou vários jogos mofados da prateleira.',
    badgeClass: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    avatarBorder: 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.35)]',
    titleColor: 'text-emerald-400',
    glowColor: 'bg-emerald-500/15',
    iconName: 'compass',
  },
  {
    id: 'veteran',
    name: 'Caçador de Backlog',
    minLevel: 9,
    maxLevel: 13,
    description: 'Conquista obtida após zerar a 1ª Main Quest + várias mensais.',
    badgeClass: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
    avatarBorder: 'border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.35)]',
    titleColor: 'text-cyan-400',
    glowColor: 'bg-cyan-500/15',
    iconName: 'swords',
  },
  {
    id: 'master',
    name: 'Veterano dos Controles',
    minLevel: 14,
    maxLevel: 19,
    description: 'Domina a arte de finalizar campanhas épicas sem abandonar.',
    badgeClass: 'border-[#bd0df2]/60 bg-[#bd0df2]/20 text-[#bd0df2] shadow-[0_0_18px_rgba(189,13,242,0.3)]',
    avatarBorder: 'border-[#bd0df2]/70 shadow-[0_0_30px_rgba(189,13,242,0.4)]',
    titleColor: 'text-[#bd0df2]',
    glowColor: 'bg-[#bd0df2]/20',
    iconName: 'crown',
  },
  {
    id: 'legend',
    name: 'Mestre da Guilda Aposentada',
    minLevel: 20,
    maxLevel: 999,
    description: 'O nível lendário de quem limpou anos de jogos acumulados.',
    badgeClass: 'border-amber-400/80 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-amber-500/30 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    avatarBorder: 'border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)]',
    titleColor: 'text-amber-300',
    glowColor: 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20',
    iconName: 'flame',
  }
];

export function getRankTierDetails(level: number): RankTier {
  const tier = RANK_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel);
  return tier || RANK_TIERS[RANK_TIERS.length - 1];
}

export function getRankTierTitle(level: number): string {
  return getRankTierDetails(level).name;
}

import { REWARDS_CATALOG } from '@/lib/constants/rewards';

export function getUnlockedTitles(level: number): string[] {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return REWARDS_CATALOG.filter(r => r.type === "TITLE").map(r => r.name);
  }
  return REWARDS_CATALOG.filter(r => r.type === "TITLE" && r.level <= level).map(r => r.name);
}

export function getXPForNextLevel(level: number): number {
  // Calibrado para um horizonte épico de 10 anos (Nível 25 em ~19.570 XP individual)
  return Math.floor(40 * Math.pow(level, 1.18));
}

export function getCumulativeXPForLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += getXPForNextLevel(l);
  }
  return total;
}

export function calculateLevelFromXP(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercentage: number;
} {
  const MAX_LEVEL = 999;

  // Se for Infinity ou valor astronômico superior a 1 bilhão, retornar nível máximo diretamente
  if (totalXP === Infinity || totalXP >= 1_000_000_000) {
    return {
      level: MAX_LEVEL,
      currentLevelXP: 0,
      nextLevelXP: getXPForNextLevel(MAX_LEVEL),
      progressPercentage: 100,
    };
  }

  // Sanitização estrita: NaN, valores não-numéricos ou negativos viram 0
  const safeXP = typeof totalXP !== "number" || Number.isNaN(totalXP) || totalXP < 0 ? 0 : Math.floor(totalXP);

  let level = 1;
  let accumulated = 0;

  while (level < MAX_LEVEL) {
    const xpNeeded = getXPForNextLevel(level);
    if (accumulated + xpNeeded > safeXP) {
      const currentLevelXP = safeXP - accumulated;
      const progressPercentage = Math.min(100, Math.max(0, Math.round((currentLevelXP / xpNeeded) * 100)));
      return {
        level,
        currentLevelXP,
        nextLevelXP: xpNeeded,
        progressPercentage,
      };
    }
    accumulated += xpNeeded;
    level++;
  }

  return {
    level: MAX_LEVEL,
    currentLevelXP: 0,
    nextLevelXP: getXPForNextLevel(MAX_LEVEL),
    progressPercentage: 100,
  };
}

export function calculateGameXP({
  hltbHours,
  questType,
  isPlatinum = false,
  failedRollsCount = 0
}: {
  hltbHours?: number | null;
  questType: QuestType;
  isPlatinum?: boolean;
  failedRollsCount?: number;
}): number {
  const hours = hltbHours && hltbHours > 0 ? hltbHours : (questType === 'MAIN_QUEST' ? 20 : 6);
  
  let baseXP = 0;
  if (questType === 'MAIN_QUEST') {
    baseXP = Math.max(300, hours * 15);
  } else {
    baseXP = Math.max(50, hours * 10);
  }

  let finalXP = baseXP;

  // Bônus de 100% / Platina (+50%)
  if (isPlatinum) {
    finalXP += Math.round(baseXP * 0.5);
  }

  // Bônus de Mofo / Resgate (+20%)
  if (failedRollsCount >= 3) {
    finalXP += Math.round(baseXP * 0.2);
  }

  return Math.round(finalXP);
}

export function calculateReviewXP({
  reviewText,
  screenshots = [],
}: {
  reviewText?: string | null;
  screenshots?: string[] | null;
}): number {
  const textXP = reviewText && reviewText.trim().length >= 50 ? 200 : 100;
  const screenshotXP = screenshots && screenshots.length > 0 ? 50 : 0;
  return textXP + screenshotXP;
}

/**
 * Recalculates and updates total XP, level, and default title for a given user.
 */
export async function recalculateUserXPAndLevel(userId: string) {
  const [completedProgresses, userReviews, currentUser] = await Promise.all([
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
    prisma.user.findUnique({
      where: { id: userId },
      select: { equipped_title: true, level: true },
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
 * Recalculates and updates total XP, level, and default title for ALL users in batch.
 * Completely eliminates N+1 query loops by:
 * 1. Fetching users, completed game progress, and reviews in 3 consolidated parallel queries.
 * 2. Aggregating XP and calculating levels in-memory with full mathematical fidelity.
 * 3. Persisting updates in chunked database transactions.
 */
export async function recalculateAllUsersXPAndLevel(chunkSize = 50): Promise<{ count: number }> {
  const [users, allProgresses, allReviews] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        equipped_title: true,
        level: true,
      },
    }),
    prisma.gameProgress.findMany({
      where: {
        status: "COMPLETED",
      },
      select: {
        user_id: true,
        is_platinum: true,
        game: {
          select: {
            hltb_time: true,
            quest_type: true,
          },
        },
      },
    }),
    prisma.review.findMany({
      select: {
        user_id: true,
        review_text: true,
        screenshots: true,
      },
    }),
  ]);

  if (users.length === 0) {
    return { count: 0 };
  }

  // Agrupa game XP por usuário
  const gameXPByUser = new Map<string, number>();
  for (const progress of allProgresses) {
    const gameXP = calculateGameXP({
      hltbHours: progress.game.hltb_time,
      questType: progress.game.quest_type,
      isPlatinum: progress.is_platinum,
      failedRollsCount: 0,
    });
    gameXPByUser.set(progress.user_id, (gameXPByUser.get(progress.user_id) || 0) + gameXP);
  }

  // Agrupa review XP por usuário
  const reviewXPByUser = new Map<string, number>();
  for (const review of allReviews) {
    const reviewXP = calculateReviewXP({
      reviewText: review.review_text,
      screenshots: review.screenshots,
    });
    reviewXPByUser.set(review.user_id, (reviewXPByUser.get(review.user_id) || 0) + reviewXP);
  }

  // Monta atualizações em lote
  const updates = users.map((user) => {
    const totalXP = (gameXPByUser.get(user.id) || 0) + (reviewXPByUser.get(user.id) || 0);
    const { level } = calculateLevelFromXP(totalXP);
    const titleToSet = user.equipped_title || getRankTierTitle(level);

    return {
      id: user.id,
      xp_points: totalXP,
      level,
      equipped_title: titleToSet,
    };
  });

  // Executa as atualizações em lotes gerenciados (chunks) para não sobrecarregar conexões
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((item) =>
        prisma.user.update({
          where: { id: item.id },
          data: {
            xp_points: item.xp_points,
            level: item.level,
            equipped_title: item.equipped_title,
          },
        })
      )
    );
  }

  return { count: updates.length };
}


