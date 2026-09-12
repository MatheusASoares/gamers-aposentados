import { QuestType } from "@prisma/client";

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
