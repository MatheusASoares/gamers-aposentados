import { QuestType } from "@prisma/client";
import { calculateGuildLevelFromXP } from "./guild-xp-engine";

export interface GuildGameXPParams {
  questType: QuestType;
  hltbHours?: number | null;
  isPlatinum?: boolean;
}

export interface GuildGameXPCalculation {
  baseHonorXP: number;
  hoursXP: number;
  effectiveHours: number;
  baseGameXP: number;
  platinumBonusXP: number;
  totalMemberXP: number;
  coopSynergyBonusXP: number;
}

/**
 * Constantes de Game Design para Gamificação Coletiva de Guilda
 */
export const GUILD_XP_CONSTANTS = {
  MAIN_QUEST_BASE_HONOR: 400,
  SIDE_QUEST_BASE_HONOR: 200,
  MAIN_QUEST_HOURLY_RATE: 15,
  SIDE_QUEST_HOURLY_RATE: 10,
  MAIN_QUEST_FALLBACK_HOURS: 20,
  SIDE_QUEST_FALLBACK_HOURS: 6,
  PLATINUM_MULTIPLIER: 0.5, // +50% do valor do jogo
  COOP_SYNERGY_MULTIPLIER: 0.25, // +25% do valor base do jogo quando completado em dupla/grupo
  REVIEW_XP: 100, // XP por review publicada
  CONTRACT_XP: 50, // XP por contrato de mural concluído
} as const;

/**
 * Calcula o XP de guilda concedido pela conclusão de um jogo por um membro,
 * baseado na unicidade de cada quest (categoria + horas HLTB + bônus proporcional de platina).
 */
export function calculateGuildGameXP({
  questType,
  hltbHours,
  isPlatinum = false,
}: GuildGameXPParams): GuildGameXPCalculation {
  const isMain = questType === "MAIN_QUEST";
  const baseHonorXP = isMain
    ? GUILD_XP_CONSTANTS.MAIN_QUEST_BASE_HONOR
    : GUILD_XP_CONSTANTS.SIDE_QUEST_BASE_HONOR;

  // Fallback de horas: 20h para Main Quest, 6h para Side Quest
  const effectiveHours =
    hltbHours && hltbHours > 0
      ? hltbHours
      : isMain
      ? GUILD_XP_CONSTANTS.MAIN_QUEST_FALLBACK_HOURS
      : GUILD_XP_CONSTANTS.SIDE_QUEST_FALLBACK_HOURS;

  const hoursMultiplier = isMain
    ? GUILD_XP_CONSTANTS.MAIN_QUEST_HOURLY_RATE
    : GUILD_XP_CONSTANTS.SIDE_QUEST_HOURLY_RATE;

  const hoursXP = Math.round(effectiveHours * hoursMultiplier);
  const baseGameXP = baseHonorXP + hoursXP;

  // Bônus de Platina (+50% do valor do jogo para a guilda)
  const platinumBonusXP = isPlatinum
    ? Math.round(baseGameXP * GUILD_XP_CONSTANTS.PLATINUM_MULTIPLIER)
    : 0;

  const totalMemberXP = baseGameXP + platinumBonusXP;

  // Bônus Co-op de Sinergia (+25% do valor base do jogo)
  const coopSynergyBonusXP = Math.round(
    baseGameXP * GUILD_XP_CONSTANTS.COOP_SYNERGY_MULTIPLIER
  );

  return {
    baseHonorXP,
    hoursXP,
    effectiveHours,
    baseGameXP,
    platinumBonusXP,
    totalMemberXP,
    coopSynergyBonusXP,
  };
}

export interface GuildGamificationInput {
  members: Array<{
    user_id: string;
    is_active: boolean;
    user: {
      gameProgress: Array<{
        is_platinum: boolean;
        game: {
          id: string;
          title: string;
          quest_type: QuestType;
          hltb_time: number | null;
        };
      }>;
      reviews: Array<{ id?: string } | unknown>;
      contractProgresses: Array<{ id?: string } | unknown>;
    };
  }>;
}

export interface GuildGamificationBreakdown {
  gamesXP: number;
  coopSynergyXP: number;
  reviewsXP: number;
  contractsXP: number;
  coopGamesCount: number;
}

export interface GuildGamificationResult {
  totalGuildXP: number;
  newLevel: number;
  breakdown: GuildGamificationBreakdown;
}


/**
 * Pure calculation helper for guild gamification data.
 * Computes individual game quest XP, co-op synergy bonus, reviews, contracts, and guild level.
 */
export function computeGuildGamificationData(
  guild: GuildGamificationInput
): GuildGamificationResult {
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
