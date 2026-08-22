export type RewardType = 'TITLE' | 'FRAME' | 'BANNER' | 'BADGE' | 'THEME';
export type RewardRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type BannerEffectType = 'scanline' | 'cosmic-stars' | 'dragon-fire' | 'crystal-aura' | 'synthwave-grid' | 'hologram-sweep' | 'sakura-twilight';

export interface RewardItem {
  id: string;
  level: number;
  type: RewardType;
  name: string;
  description: string;
  rarity: RewardRarity;
  assetUrl?: string; // Para PNGs em public/assets/frames/ ou capas
  cssClass?: string; // Para estilos Tailwind / SVG inline
  effectType?: BannerEffectType; // Efeito de animação CSS/SVG para banners
}

export const REWARDS_CATALOG: RewardItem[] = [
  {
    id: 'title-novato',
    level: 1,
    type: 'TITLE',
    name: 'Aposentado Novato',
    description: 'Acabou de pendurar as chuteiras e ligar o console.',
    rarity: 'COMMON',
  },
  {
    id: 'frame-wooden',
    level: 2,
    type: 'FRAME',
    name: 'Moldura de Carvalho',
    description: '"É perigoso ir sozinho! Leve isto."',
    rarity: 'COMMON',
    assetUrl: '/assets/frames/wooden-frame.png',
    cssClass: 'border-2 border-amber-900 shadow-amber-950/40',
  },
  {
    id: 'badge-first-step',
    level: 3,
    type: 'BADGE',
    name: 'Insígnia: Primeiro Passo',
    description: 'Completou a primeira jornada na guilda.',
    rarity: 'COMMON',
  },
  {
    id: 'title-limpador',
    level: 4,
    type: 'TITLE',
    name: 'Limpador de Poeira',
    description: 'Já tirou vários jogos mofados da prateleira.',
    rarity: 'COMMON',
  },
  {
    id: 'frame-bronze',
    level: 5,
    type: 'FRAME',
    name: 'Escudo de Bronze',
    description: '"Aço é bom, mas o bronze carrega história."',
    rarity: 'UNCOMMON',
    assetUrl: '/assets/frames/bronze-frame.png',
    cssClass: 'border-2 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.3)]',
  },
  {
    id: 'title-cacador',
    level: 6,
    type: 'TITLE',
    name: 'Caçador de Backlog',
    description: 'Conquistou vitórias expressivas sobre jogos encostados.',
    rarity: 'UNCOMMON',
  },
  {
    id: 'banner-retro-arcade',
    level: 7,
    type: 'BANNER',
    name: 'Fliperama Retrô',
    description: '"Prontos? Lutar! O futuro se recusou a mudar."',
    rarity: 'UNCOMMON',
    assetUrl: '/assets/banners/banner-retro-arcade.png',
    effectType: 'scanline',
  },
  {
    id: 'frame-silver',
    level: 8,
    type: 'FRAME',
    name: 'Brasão de Prata',
    description: '"Prata para monstros, aço para humanos."',
    rarity: 'RARE',
    assetUrl: '/assets/frames/silver-frame.png',
    cssClass: 'border-2 border-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.4)]',
  },
  {
    id: 'theme-medieval',
    level: 9,
    type: 'THEME',
    name: 'Taverna Medieval',
    description: '"Dê uma moeda para o seu Bruxo, ó Vale da Abundância."',
    rarity: 'RARE',
  },
  {
    id: 'title-destruidor',
    level: 10,
    type: 'TITLE',
    name: 'Destruidor de Pendências',
    description: 'Não deixa nenhum backlog impune.',
    rarity: 'RARE',
  },
  {
    id: 'banner-fantasy-dragon',
    level: 11,
    type: 'BANNER',
    name: 'Dragão de Sangue',
    description: '"O vento tá uivando... Fus Ro Dah!"',
    rarity: 'RARE',
    assetUrl: '/assets/banners/banner-fantasy-dragon.png',
    effectType: 'dragon-fire',
  },
  {
    id: 'frame-cyber-neon',
    level: 12,
    type: 'FRAME',
    name: 'Plasma Cyberpunk',
    description: '"Acorda, Samurai! Temos uma cidade pra queimar."',
    rarity: 'RARE',
    assetUrl: '/assets/frames/cyber-neon-frame.png',
    cssClass: 'border-2 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)] animate-pulse',
  },
  {
    id: 'title-veterano',
    level: 13,
    type: 'TITLE',
    name: 'Veterano dos Controles',
    description: 'Domina a arte de finalizar campanhas épicas sem abandonar.',
    rarity: 'EPIC',
  },
  {
    id: 'frame-gold',
    level: 14,
    type: 'FRAME',
    name: 'Ouro Gótico',
    description: '"Um caçador deve caçar. Louvado seja o Sol!"',
    rarity: 'EPIC',
    assetUrl: '/assets/frames/gold-frame.png',
    cssClass: 'border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] ring-1 ring-amber-300/30',
  },
  {
    id: 'theme-space',
    level: 15,
    type: 'THEME',
    name: 'Odisseia Estelar',
    description: '"Ao infinito e além das estrelas da Orla Exterior."',
    rarity: 'EPIC',
  },
  {
    id: 'banner-chronos',
    level: 16,
    type: 'BANNER',
    name: 'Templo de Chronos',
    description: '"O tempo flui como um rio, e a história se repete."',
    rarity: 'EPIC',
    assetUrl: '/assets/banners/banner-chronos.png',
    effectType: 'cosmic-stars',
  },
  {
    id: 'title-legend-retrogaming',
    level: 17,
    type: 'TITLE',
    name: 'Lenda do Retrogaming',
    description: 'Sua sabedoria gamer é inquestionável na comunidade.',
    rarity: 'EPIC',
  },
  {
    id: 'frame-celestial-violet',
    level: 18,
    type: 'FRAME',
    name: 'Aura do Vazio',
    description: '"Entre no Vazio e abrace a eternidade."',
    rarity: 'EPIC',
    assetUrl: '/assets/frames/celestial-violet-frame.png',
    cssClass: 'border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)]',
  },
  {
    id: 'title-mestre-guilda',
    level: 19,
    type: 'TITLE',
    name: 'Mestre da Guilda Aposentada',
    description: 'O nível lendário supremo de quem venceu o backlog acumulado.',
    rarity: 'LEGENDARY',
  },
  {
    id: 'frame-legendary',
    level: 20,
    type: 'FRAME',
    name: 'Chama da Fênix',
    description: '"Das cinzas, guerreiros lendários se erguem."',
    rarity: 'LEGENDARY',
    assetUrl: '/assets/frames/legendary-frame.png',
    cssClass: 'border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.9)] ring-2 ring-amber-400',
  },
  {
    id: 'banner-astral-crystal',
    level: 21,
    type: 'BANNER',
    name: 'Éter Astral',
    description: '"Ouça o fluxo do Planeta. Rumo às estrelas!"',
    rarity: 'LEGENDARY',
    assetUrl: '/assets/banners/banner-astral-crystal.png',
    effectType: 'crystal-aura',
  },
  {
    id: 'theme-pixel',
    level: 22,
    type: 'THEME',
    name: 'Arcade Retrô',
    description: '"Pressione Start para reviver a era de ouro dos 16-bits."',
    rarity: 'LEGENDARY',
  },
  {
    id: 'banner-japanese-sunrise',
    level: 23,
    type: 'BANNER',
    name: 'Santuário do Sol Nascente',
    description: '"Onde as pétalas de cerejeira encontram o crepúsculo sob o Monte Fuji."',
    rarity: 'LEGENDARY',
    assetUrl: '/assets/banners/banner-japanese-sunrise.jpg',
    effectType: 'sakura-twilight',
  },
  {
    id: 'frame-bonfire-cinders',
    level: 24,
    type: 'FRAME',
    name: 'Coroa das Cinzas',
    description: '"Mesmo que o fogo se apague, sua lenda arderá para sempre."',
    rarity: 'LEGENDARY',
    assetUrl: '/assets/frames/frame-bonfire-cinders-v2.png',
    cssClass: 'border-2 border-orange-600 shadow-[0_0_25px_rgba(234,88,12,0.8)] ring-2 ring-red-600/50',
  },
  {
    id: 'title-imortal-backlog',
    level: 25,
    type: 'TITLE',
    name: 'Imortal do Backlog Zero',
    description: 'O triunfo absoluto sobre o backlog e todas as eras dos games.',
    rarity: 'LEGENDARY',
  },
  {
    id: 'theme-ascendant',
    level: 25,
    type: 'THEME',
    name: 'Fogueira de Lordran',
    description: '"Mesmo na escuridão mais profunda, uma brasa ainda queima. Não ouse se tornar Hollow."',
    rarity: 'LEGENDARY',
  },
];

/**
 * Retorna se determinado nível/recompensa está desbloqueado.
 * Em ambiente de desenvolvimento ou teste (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'),
 * todos os níveis ficam desbloqueados automaticamente.
 */
export function isRewardUnlocked(itemLevel: number, userLevel: number = 1): boolean {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return true;
  }
  return userLevel >= itemLevel;
}

/**
 * Retorna todas as recompensas desbloqueadas para determinado nível.
 */
export function getUnlockedRewardsForLevel(level: number): RewardItem[] {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return REWARDS_CATALOG;
  }
  return REWARDS_CATALOG.filter((item) => item.level <= level);
}

/**
 * Retorna a próxima recompensa a ser desbloqueada no próximo nível.
 */
export function getNextRewardUnlock(currentLevel: number): RewardItem | undefined {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return undefined;
  }
  return REWARDS_CATALOG.find((item) => item.level > currentLevel);
}


/**
 * Retorna o estilo Tailwind (Borda, Fundo, Texto, Glow) exclusivo por Título.
 */
export function getTitleBadgeStyle(titleName: string | null): string {
  switch (titleName) {
    case 'Limpador de Poeira':
      return 'border-emerald-500/70 bg-emerald-950/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]';
    case 'Caçador de Backlog':
      return 'border-cyan-500/70 bg-cyan-950/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]';
    case 'Destruidor de Pendências':
      return 'border-blue-500/70 bg-blue-950/50 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.4)]';
    case 'Veterano dos Controles':
      return 'border-[#bd0df2]/80 bg-[#bd0df2]/25 text-purple-200 shadow-[0_0_18px_rgba(189,13,242,0.4)]';
    case 'Lenda do Retrogaming':
      return 'border-pink-500/80 bg-gradient-to-r from-pink-500/30 to-purple-600/30 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.45)]';
    case 'Mestre da Guilda Aposentada':
      return 'border-amber-400/90 bg-gradient-to-r from-amber-500/35 via-yellow-400/30 to-amber-600/35 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.5)] ring-1 ring-amber-300/30';
    case 'Imortal do Backlog Zero':
      return 'border-orange-500/90 bg-gradient-to-r from-red-600/40 via-orange-500/40 to-amber-500/35 text-orange-100 shadow-[0_0_28px_rgba(234,88,12,0.7)] ring-1 ring-orange-400/60';
    case 'Aposentado Novato':
    default:
      return 'border-zinc-700 bg-zinc-900/80 text-zinc-300 shadow-[0_0_10px_rgba(255,255,255,0.05)]';
  }
}
