/**
 * Engine de cálculo de XP e Níveis da Guilda (25 Níveis).
 * Curva calibrada para um ciclo de vida de 10 anos (Horizonte Épico),
 * com Escala Sub-linear proporcional aos Membros Ativos.
 *
 * Calibragem de 10 Anos:
 *   Base_XP = 720 * ((max(2, min(activeMembers, 16)) / 2) ^ 0.65)
 *   XP_Necessário(Nível L) = Base_XP * L^1.48
 *
 * Resultados para 2 Membros Ativos:
 *   - Nível 2: 720 XP
 *   - Nível 3: 2.008 XP
 *   - Nível 5: 5.602 XP
 *   - Nível 6: 7.795 XP (Mascote Makar o Korok - Zelda)
 *   - Nível 7: 10.208 XP (onde a Guilda Aposentados se encontra com ~10.096 XP, 95% do Nível 6 pro 7)
 *   - Nível 10: 18.604 XP (Mascote Palico Felyne - Monster Hunter)
 *   - Nível 15: 35.776 XP (Mascote Mecha Chocobo Dourado - FF7)
 *   - Nível 20: 56.220 XP (Marco de expansão para novos níveis futuros)
 *   - Nível 25: 79.440 XP (Luna Lovegood - Mascote Suprema Mythic)
 */

export const MAX_GUILD_LEVEL = 25;
export const GUILD_LEVEL_BASE_XP = 720;
export const GUILD_LEVEL_EXPONENT = 1.48;
export const GUILD_SUBLINEAR_POWER = 0.65;

/**
 * Calcula o multiplicador de escala sub-linear com base no número de membros ativos (mínimo 2).
 * Garante que mais membros sempre ajudem a acelerar o progresso sem punir casualidade.
 */
export function getGuildScaleFactor(activeMemberCount: number = 2): number {
  const safeCount = Math.max(2, Math.min(activeMemberCount, 16));
  return Math.pow(safeCount / 2, GUILD_SUBLINEAR_POWER);
}

/**
 * Retorna o nível correspondente (1 a 25) para uma quantidade de XP e membros ativos.
 */
export function calculateGuildLevelFromXP(xpPoints: number, activeMemberCount: number = 2): number {
  if (xpPoints <= 0) return 1;

  const scale = getGuildScaleFactor(activeMemberCount);
  const baseXP = GUILD_LEVEL_BASE_XP * scale;

  // Level = floor( (XP / BaseXP) ^ (1 / GUILD_LEVEL_EXPONENT) + 1e-9 ) + 1
  const level = Math.floor(Math.pow(xpPoints / baseXP, 1 / GUILD_LEVEL_EXPONENT) + 1e-9) + 1;
  return Math.min(Math.max(level, 1), MAX_GUILD_LEVEL);
}

/**
 * Retorna o XP total acumulado necessário para alcançar um determinado nível.
 */
export function calculateGuildXPForNextLevel(level: number, activeMemberCount: number = 2): number {
  const scale = getGuildScaleFactor(activeMemberCount);
  const baseXP = GUILD_LEVEL_BASE_XP * scale;

  if (level >= MAX_GUILD_LEVEL) {
    return Math.floor(baseXP * Math.pow(MAX_GUILD_LEVEL - 1, GUILD_LEVEL_EXPONENT));
  }
  return Math.floor(baseXP * Math.pow(level, GUILD_LEVEL_EXPONENT));
}

/**
 * Retorna o progresso atual de XP dentro do nível corrente e para o próximo nível.
 */
export function getGuildLevelProgress(
  xpPoints: number,
  level: number,
  activeMemberCount: number = 2
): {
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercentage: number;
} {
  const scale = getGuildScaleFactor(activeMemberCount);
  const baseXP = GUILD_LEVEL_BASE_XP * scale;

  if (level >= MAX_GUILD_LEVEL) {
    const maxThreshold = Math.floor(baseXP * Math.pow(MAX_GUILD_LEVEL - 1, GUILD_LEVEL_EXPONENT));
    return {
      currentLevelXP: xpPoints,
      nextLevelXP: maxThreshold,
      progressPercentage: 100,
    };
  }

  const currentLevelBaseXP =
    level === 1 ? 0 : Math.floor(baseXP * Math.pow(level - 1, GUILD_LEVEL_EXPONENT));
  const nextLevelBaseXP = Math.floor(baseXP * Math.pow(level, GUILD_LEVEL_EXPONENT));

  const xpInCurrentLevel = Math.max(0, xpPoints - currentLevelBaseXP);
  const xpNeededForNext = Math.max(1, nextLevelBaseXP - currentLevelBaseXP);
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNext) * 100))
  );

  return {
    currentLevelXP: xpPoints,
    nextLevelXP: nextLevelBaseXP,
    progressPercentage,
  };
}

