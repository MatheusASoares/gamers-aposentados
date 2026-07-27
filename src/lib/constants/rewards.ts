export type RewardType = 'TITLE' | 'FRAME' | 'BANNER' | 'BADGE' | 'THEME';
export type RewardRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface RewardItem {
  id: string;
  level: number;
  type: RewardType;
  name: string;
  description: string;
  rarity: RewardRarity;
  assetUrl?: string; // Para PNGs em public/assets/frames/ ou capas
  cssClass?: string; // Para estilos Tailwind / SVG inline
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
    name: 'Moldura de Madeira & Couro',
    description: 'Borda rústica de carvalho entalhado para iniciantes.',
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
    name: 'Borda Bronze Forjado',
    description: 'Moldura reforçada em bronze com acabamento de armadura.',
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
    name: 'Banner Retro Arcade 16-Bit',
    description: 'Capa temática em pixel-art para o cabeçalho do perfil e dashboard.',
    rarity: 'UNCOMMON',
    assetUrl: '/assets/banners/banner-retro-arcade.png',
  },
  {
    id: 'frame-silver',
    level: 8,
    type: 'FRAME',
    name: 'Borda Prata da Guilda',
    description: 'Moldura espelhada de prata polida com acabamento nobre.',
    rarity: 'RARE',
    assetUrl: '/assets/frames/silver-frame.png',
    cssClass: 'border-2 border-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.4)]',
  },
  {
    id: 'theme-medieval',
    level: 9,
    type: 'THEME',
    name: 'Tema RPG Fantasy Medieval',
    description: 'Estética The Witcher 3 & Skyrim com pergaminho escuro, ouro forjado e runas antigas.',
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
    id: 'frame-cyber-neon',
    level: 11,
    type: 'FRAME',
    name: 'Borda Cyber Neon Cyan',
    description: 'Moldura futurista energizada com anel de plasma cyan.',
    rarity: 'RARE',
    assetUrl: '/assets/frames/cyber-neon-frame.png',
    cssClass: 'border-2 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)] animate-pulse',
  },
  {
    id: 'title-veterano',
    level: 12,
    type: 'TITLE',
    name: 'Veterano dos Controles',
    description: 'Domina a arte de finalizar campanhas épicas sem abandonar.',
    rarity: 'EPIC',
  },
  {
    id: 'frame-gold',
    level: 13,
    type: 'FRAME',
    name: 'Borda Ouro Entalhado',
    description: 'Moldura áurea rica em detalhes góticos e brilho dourado.',
    rarity: 'EPIC',
    assetUrl: '/assets/frames/gold-frame.png',
    cssClass: 'border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] ring-1 ring-amber-300/30',
  },
  {
    id: 'theme-space',
    level: 14,
    type: 'THEME',
    name: 'Tema RPG Espacial Sci-Fi',
    description: 'Estética Starfield & No Man\'s Sky com vácuo estelar, cyan de navegação e órbitas quânticas.',
    rarity: 'EPIC',
  },
  {
    id: 'banner-chronos',
    level: 15,
    type: 'BANNER',
    name: 'Banner Mestre do Tempo Gamer',
    description: 'Fundo estelar estilizado de galáxia e ampulheta quântica.',
    rarity: 'EPIC',
    assetUrl: '/assets/banners/banner-chronos.png',
  },
  {
    id: 'title-legend-retrogaming',
    level: 16,
    type: 'TITLE',
    name: 'Lenda do Retrogaming',
    description: 'Sua sabedoria gamer é inquestionável na comunidade.',
    rarity: 'EPIC',
  },
  {
    id: 'frame-celestial-violet',
    level: 17,
    type: 'FRAME',
    name: 'Borda Aura Violeta Celestial',
    description: 'Moldura mística envolta em partículas e cristais cósmicos.',
    rarity: 'EPIC',
    assetUrl: '/assets/frames/celestial-violet-frame.png',
    cssClass: 'border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)]',
  },
  {
    id: 'title-mestre-guilda',
    level: 18,
    type: 'TITLE',
    name: 'Mestre da Guilda Aposentada',
    description: 'O nível lendário supremo de quem venceu o backlog acumulado.',
    rarity: 'LEGENDARY',
  },
  {
    id: 'frame-legendary',
    level: 19,
    type: 'FRAME',
    name: 'Borda Fogo da Fênix (Lendária)',
    description: 'Moldura suprema em chamas douradas e runas pulsantes.',
    rarity: 'LEGENDARY',
    assetUrl: '/assets/frames/legendary-frame.png',
    cssClass: 'border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.9)] ring-2 ring-amber-400',
  },
  {
    id: 'theme-pixel',
    level: 20,
    type: 'THEME',
    name: 'Tema Pixel Art Retrogaming',
    description: 'Estética 16-bit Chrono Trigger & Final Fantasy com arte pixelada e CRT retro.',
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
      return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
    case 'Caçador de Backlog':
      return 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]';
    case 'Destruidor de Pendências':
      return 'border-blue-500/60 bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
    case 'Veterano dos Controles':
      return 'border-[#bd0df2]/70 bg-[#bd0df2]/25 text-purple-200 shadow-[0_0_18px_rgba(189,13,242,0.35)]';
    case 'Lenda do Retrogaming':
      return 'border-fuchsia-500/70 bg-fuchsia-500/25 text-fuchsia-200 shadow-[0_0_18px_rgba(217,70,239,0.35)]';
    case 'Mestre da Guilda Aposentada':
      return 'border-amber-400/80 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-amber-500/30 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.4)]';
    case 'Aposentado Novato':
    default:
      return 'border-zinc-700 bg-zinc-800/80 text-zinc-300 shadow-[0_0_10px_rgba(255,255,255,0.05)]';
  }
}
