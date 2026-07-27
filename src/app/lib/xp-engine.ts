import { QuestType } from '@prisma/client';

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
  return Math.floor(80 * Math.pow(level, 1.18));
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
  let level = 1;
  let accumulated = 0;

  while (true) {
    const xpNeeded = getXPForNextLevel(level);
    if (accumulated + xpNeeded > totalXP) {
      const currentLevelXP = totalXP - accumulated;
      const progressPercentage = Math.min(100, Math.round((currentLevelXP / xpNeeded) * 100));
      return {
        level,
        currentLevelXP,
        nextLevelXP: xpNeeded,
        progressPercentage
      };
    }
    accumulated += xpNeeded;
    level++;
  }
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
