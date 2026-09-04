/**
 * Engine de cálculo de XP e Níveis da Guilda (25 Níveis).
 * Curva calibrada com Escala Adaptativa proporcional aos Membros Ativos (Lógica 1).
 *
 * Calibragem de Longo Prazo:
 *   Base_XP = 1200 * (max(2, activeMembers) / 2)
 *   XP_Necessário(Nível L) = Base_XP * L^1.5
 *
 * Resultados para 2 Membros Ativos:
 *   - Nível 2: 1.200 XP
 *   - Nível 3: 3.390 XP
 *   - Nível 4: 6.235 XP (onde a guilda inicia na produção com ~8.700 XP)
 *   - Nível 5: 9.600 XP (primeiro grande marco)
 *   - Nível 10: 32.400 XP
 *   - Nível 15: 62.800 XP
 *   - Nível 20: 99.300 XP
 *   - Nível 25: 141.000 XP (Panteão Supremo)
 */

export const MAX_GUILD_LEVEL = 25;

/**
 * Calcula o multiplicador de escala com base no número de membros ativos (mínimo 2).
 */
export function getGuildScaleFactor(activeMemberCount: number = 2): number {
  const safeCount = Math.max(2, Math.min(activeMemberCount, 16));
  return safeCount / 2;
}

/**
 * Retorna o nível correspondente (1 a 25) para uma quantidade de XP e membros ativos.
 */
export function calculateGuildLevelFromXP(xpPoints: number, activeMemberCount: number = 2): number {
  if (xpPoints <= 0) return 1;

  const scale = getGuildScaleFactor(activeMemberCount);
  const baseXP = 1200 * scale;

  // Level = floor( (XP / BaseXP) ^ (1 / 1.5) + 1e-9 ) + 1
  const level = Math.floor(Math.pow(xpPoints / baseXP, 1 / 1.5) + 1e-9) + 1;
  return Math.min(Math.max(level, 1), MAX_GUILD_LEVEL);
}

/**
 * Retorna o XP total acumulado necessário para alcançar um determinado nível.
 */
export function calculateGuildXPForNextLevel(level: number, activeMemberCount: number = 2): number {
  const scale = getGuildScaleFactor(activeMemberCount);
  const baseXP = 1200 * scale;

  if (level >= MAX_GUILD_LEVEL) {
    return Math.floor(baseXP * Math.pow(MAX_GUILD_LEVEL - 1, 1.5));
  }
  return Math.floor(baseXP * Math.pow(level, 1.5));
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
  const baseXP = 1200 * scale;

  if (level >= MAX_GUILD_LEVEL) {
    const maxThreshold = Math.floor(baseXP * Math.pow(MAX_GUILD_LEVEL - 1, 1.5));
    return {
      currentLevelXP: xpPoints,
      nextLevelXP: maxThreshold,
      progressPercentage: 100,
    };
  }

  const currentLevelBaseXP = level === 1 ? 0 : Math.floor(baseXP * Math.pow(level - 1, 1.5));
  const nextLevelBaseXP = Math.floor(baseXP * Math.pow(level, 1.5));

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
