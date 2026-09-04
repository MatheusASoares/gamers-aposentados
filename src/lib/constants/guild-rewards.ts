import { BannerEffectType } from "./rewards";

export type GuildRewardType = 'TITLE' | 'EMBLEM' | 'BANNER' | 'MASCOT';
export type GuildRewardRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface GuildRewardItem {
  id: string;
  level: number;
  type: GuildRewardType;
  name: string;
  description: string;
  rarity: GuildRewardRarity;
  gameTag: string; // Franquia / Jogo de Referência
  icon?: string; // Nome do ícone Lucide
  assetUrl?: string; // Para imagens/banners/mascotes
  effectType?: BannerEffectType; // Efeito de partículas animadas em tempo real
  cssClass?: string; // Estilização personalizada
  phrases?: string[]; // Falas interativas do mascote ao clicar
}

export const GUILD_REWARDS_CATALOG: GuildRewardItem[] = [
  // NV 1: BRASÃO (Dark Souls)
  {
    id: 'guild-emblem-1',
    level: 1,
    type: 'EMBLEM',
    name: 'Escudo do Cavaleiro de Astora',
    gameTag: 'Dark Souls',
    description: '"Praise the Sun! \\[T]/ O brasão forjado em ferro e fé para os recém-chegados."',
    rarity: 'COMMON',
    assetUrl: '/assets/guild/emblems/astora-shield.png',
    icon: 'Shield',
    cssClass: 'text-amber-300 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
  },

  // NV 2: MASCOTE (Hi-Fi RUSH)
  {
    id: 'guild-mascot-2',
    level: 2,
    type: 'MASCOT',
    name: '808',
    gameTag: 'Hi-Fi RUSH',
    description: 'Gato robótico espião com visor holográfico e sincronizador de ritmo.',
    rarity: 'COMMON',
    assetUrl: '/assets/guild/mascots/kuro-bot.png',
    phrases: [
      'Miau! No ritmo da batida! 🎵',
      'Sincronizando com o beat do Chai! Vamos quebrar tudo!',
      '*Bip Bip* Peppermint no comunicador: Essa guilda é nota S!',
      'Vandelay Technologies não tem a menor chance contra esse esquadrão!',
      'Miau! 808 calibrada e pronta para o próximo combo!',
      'Ronrom... Sentindo a vibe e zerando o backlog no compasso!',
    ],
  },

  // NV 3: BANNER (Cyberpunk 2077)
  {
    id: 'guild-banner-3',
    level: 3,
    type: 'BANNER',
    name: 'Bastião de Night City',
    gameTag: 'Cyberpunk 2077',
    description: '"Acorda, Samurai! Nossa sede nunca dorme."',
    rarity: 'COMMON',
    assetUrl: '/assets/guild/banners/night-city.jpg',
    effectType: 'hologram-sweep',
  },

  // NV 4: TÍTULO (Metal Gear Solid)
  {
    id: 'guild-title-4',
    level: 4,
    type: 'TITLE',
    name: 'Agentes da Foxhound',
    gameTag: 'Metal Gear Solid',
    description: '"Kept you waiting, huh? O esquadrão tático de operações furtivas."',
    rarity: 'COMMON',
    icon: 'Radio',
    cssClass: 'border-emerald-500/70 bg-emerald-950/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/30',
  },

  // NV 5: BRASÃO (Street Fighter)
  {
    id: 'guild-emblem-5',
    level: 5,
    type: 'EMBLEM',
    name: 'Lâminas Duplas do Hadouken',
    gameTag: 'Street Fighter',
    description: '"Here comes a new challenger! A força do punho do dragão em chamas."',
    rarity: 'COMMON',
    assetUrl: '/assets/guild/emblems/hadouken-swords.png',
    icon: 'Swords',
    cssClass: 'text-cyan-400 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.5)]',
  },

  // NV 6: MASCOTE (The Legend of Zelda)
  {
    id: 'guild-mascot-6',
    level: 6,
    type: 'MASCOT',
    name: 'Makar o Korok',
    gameTag: 'The Legend of Zelda',
    description: 'Pequeno espírito da floresta com máscara de folha viva, raminho na cabeça e maracas de sementes douradas.',
    rarity: 'UNCOMMON',
    assetUrl: '/assets/guild/mascots/makar-korok.png',
    phrases: [
      'Yahaha! You found me! 🍃',
      'Twee-hee! Hora de tocar a canção da vitória!',
      'Mais uma semente Korok para o cofre da guilda!',
      'O vento sopra a favor do nosso esquadrão!',
      'Que a Grande Árvore Deku abençoe nossa jogatina!',
    ],
  },

  // NV 7: BANNER (BioShock)
  {
    id: 'guild-banner-7',
    level: 7,
    type: 'BANNER',
    name: 'Cidade Subaquática de Rapture',
    gameTag: 'BioShock',
    description: '"No gods or kings. Only man. A metrópole do oceano profundo."',
    rarity: 'UNCOMMON',
    assetUrl: '/assets/guild/banners/rapture-city.jpg',
    effectType: 'scanline',
  },

  // NV 8: TÍTULO (Bloodborne)
  {
    id: 'guild-title-8',
    level: 8,
    type: 'TITLE',
    name: 'Caçadores de Relíquias de Yharnam',
    gameTag: 'Bloodborne',
    description: '"Fear the old blood. A irmandade que caça pelas ruas de Yharnam."',
    rarity: 'UNCOMMON',
    icon: 'Moon',
    cssClass: 'border-rose-600/70 bg-gradient-to-r from-rose-950/90 via-zinc-950 to-rose-950/90 text-rose-300 shadow-[0_0_22px_rgba(225,29,72,0.45)] ring-1 ring-rose-500/30',
  },

  // NV 9: BRASÃO (The Witcher 3)
  {
    id: 'guild-emblem-9',
    level: 9,
    type: 'EMBLEM',
    name: 'Medalhão do Lobo Branco',
    gameTag: 'The Witcher 3',
    description: '"Wind\'s howling... Kaer Morhen protege aqueles que empunham prata e aço."',
    rarity: 'UNCOMMON',
    icon: 'Shield',
    cssClass: 'text-amber-400 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
  },

  // NV 10: MASCOTE (Destiny)
  {
    id: 'guild-mascot-10',
    level: 10,
    type: 'MASCOT',
    name: 'Ghost Orbe Companheiro',
    gameTag: 'Destiny',
    description: 'Orbe tecnológico com armadura geométrica e scanner de dados holográfico.',
    rarity: 'RARE',
    phrases: [
      'Eyes up, Guardian!',
      'Detectando novos jogos no setor da guilda!',
      'Sua luz é forte, Comandante!',
      'Ressuscitando o ânimo para o próximo jogo!',
    ],
  },

  // NV 11: BANNER (The Witcher 3)
  {
    id: 'guild-banner-11',
    level: 11,
    type: 'BANNER',
    name: 'Fortaleza de Kaer Morhen',
    gameTag: 'The Witcher 3',
    description: '"As montanhas se lembram de cada contrato e monstro abatido."',
    rarity: 'RARE',
    effectType: 'synthwave-grid',
  },

  // NV 12: TÍTULO (Chrono Trigger)
  {
    id: 'guild-title-12',
    level: 12,
    type: 'TITLE',
    name: 'Viajantes do Fim dos Tempos',
    gameTag: 'Chrono Trigger',
    description: '"The black wind howls... Através das eras, o destino do mundo é moldado."',
    rarity: 'RARE',
    icon: 'Hourglass',
    cssClass: 'border-cyan-400/70 bg-gradient-to-r from-cyan-950/80 via-indigo-950/60 to-zinc-950 text-cyan-300 shadow-[0_0_22px_rgba(6,182,212,0.45)] ring-1 ring-cyan-400/30',
  },

  // NV 13: BRASÃO (Castlevania: SotN)
  {
    id: 'guild-emblem-13',
    level: 13,
    type: 'EMBLEM',
    name: 'Selo dos Belmonts & Alucard',
    gameTag: 'Castlevania: SotN',
    description: '"What is a man? A miserable little pile of secrets! O brasão dos caçadores da noite."',
    rarity: 'RARE',
    icon: 'Skull',
    cssClass: 'text-rose-400 border-rose-500/60 shadow-[0_0_18px_rgba(244,63,94,0.4)]',
  },

  // NV 14: BANNER (Dark Souls)
  {
    id: 'guild-banner-14',
    level: 14,
    type: 'BANNER',
    name: 'Catedral Dourada de Anor Londo',
    gameTag: 'Dark Souls',
    description: '"O crepúsculo dos Deuses nunca se apaga para os escolhidos."',
    rarity: 'RARE',
    effectType: 'dragon-fire',
  },

  // NV 15: MASCOTE (Monster Hunter)
  {
    id: 'guild-mascot-15',
    level: 15,
    type: 'MASCOT',
    name: 'Palico Guerreiro Felyne',
    gameTag: 'Monster Hunter',
    description: 'Gatinho caçador com mini armadura e caneca de poção que comemora com saltos.',
    rarity: 'EPIC',
    phrases: [
      'Pronto para a caçada, Miaumestre!',
      'Uma poção mágica e partiu boss!',
      'Miau! A vitória sobre o monstro é nossa!',
      'Caneca cheia de poção de vida para o grupo!',
    ],
  },

  // NV 16: TÍTULO (God of War Ragnarök)
  {
    id: 'guild-title-16',
    level: 16,
    type: 'TITLE',
    name: 'Guardiões de Midgard',
    gameTag: 'God of War Ragnarök',
    description: '"Don\'t be sorry, be better. A fúria espartana guiando o esquadrão."',
    rarity: 'EPIC',
    icon: 'Flame',
    cssClass: 'border-orange-500/70 bg-gradient-to-r from-orange-950/90 via-amber-950/60 to-zinc-950 text-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.5)] ring-1 ring-orange-500/30',
  },

  // NV 17: BRASÃO (Halo)
  {
    id: 'guild-emblem-17',
    level: 17,
    type: 'EMBLEM',
    name: 'Insígnia dos Spartanos de Reach',
    gameTag: 'Halo',
    description: '"Spartans never die, they\'re just missing in action. O elmo dos guerreiros titânicos."',
    rarity: 'EPIC',
    icon: 'Gamepad2',
    cssClass: 'text-[#bd0df2] border-[#bd0df2]/70 shadow-[0_0_20px_rgba(189,13,242,0.45)]',
  },

  // NV 18: BANNER (Ghost of Tsushima)
  {
    id: 'guild-banner-18',
    level: 18,
    type: 'BANNER',
    name: 'Santuário de Tsushima ao Luar',
    gameTag: 'Ghost of Tsushima',
    description: '"A honra morreu na praia. Nós renascemos como fantasmas na tempestade."',
    rarity: 'EPIC',
    effectType: 'sakura-twilight',
  },

  // NV 19: MASCOTE (Final Fantasy VII)
  {
    id: 'guild-mascot-19',
    level: 19,
    type: 'MASCOT',
    name: 'Chocobo Dourado Mecha',
    gameTag: 'Final Fantasy VII',
    description: 'Pequeno filhote de Chocobo dourado com aprimoramentos cibernéticos e óculos.',
    rarity: 'EPIC',
    phrases: [
      'Kweh! Kweeeh!',
      'Rumo à vitória contra Sephiroth!',
      'Wark! Mais um troféu conquistado!',
      'Kweh! As finais douradas trazem sorte no RNG!',
    ],
  },

  // NV 20: TÍTULO (Red Dead Redemption 2)
  {
    id: 'guild-title-20',
    level: 20,
    type: 'TITLE',
    name: 'Desbravadores do Oeste Selvagem',
    gameTag: 'Red Dead Redemption 2',
    description: '"We\'re more ghosts than people. O bando mais respeitado de toda a fronteira."',
    rarity: 'LEGENDARY',
    icon: 'Compass',
    cssClass: 'border-amber-400/80 bg-gradient-to-r from-amber-950/90 via-yellow-950/60 to-zinc-950 text-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.5)] ring-1 ring-amber-400/40',
  },

  // NV 21: BANNER (Mass Effect)
  {
    id: 'guild-banner-21',
    level: 21,
    type: 'BANNER',
    name: 'A Cidadela dos Espaços Profundos',
    gameTag: 'Mass Effect',
    description: '"I\'m Commander Shepard and this is my favorite guild on the Citadel."',
    rarity: 'LEGENDARY',
    effectType: 'cosmic-stars',
  },

  // NV 22: BRASÃO (Hollow Knight)
  {
    id: 'guild-emblem-22',
    level: 22,
    type: 'EMBLEM',
    name: 'Vaso de Alma & Ferrão Puro',
    gameTag: 'Hollow Knight',
    description: '"Born of God and Void. A lâmina pura que cortou a escuridão de Hallownest."',
    rarity: 'LEGENDARY',
    icon: 'ShieldCheck',
    cssClass: 'text-cyan-300 border-cyan-400/80 shadow-[0_0_22px_rgba(6,182,212,0.5)]',
  },

  // NV 23: TÍTULO (Portal 2)
  {
    id: 'guild-title-23',
    level: 23,
    type: 'TITLE',
    name: 'Testadores da Aperture Science',
    gameTag: 'Portal 2',
    description: '"The cake is a lie, mas as conquistas desta guilda são 100% reais."',
    rarity: 'LEGENDARY',
    icon: 'Atom',
    cssClass: 'border-cyan-400/70 bg-gradient-to-r from-cyan-950/70 via-zinc-950 to-orange-950/70 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.45)] ring-1 ring-orange-400/40',
  },

  // NV 24: MASCOTE (Skyrim)
  {
    id: 'guild-mascot-24',
    level: 24,
    type: 'MASCOT',
    name: 'Filhote de Dragão de Alduin',
    gameTag: 'Skyrim',
    description: 'Filhote de dragão ancião de obsidiana com asas de nebulosa e sopro mágico.',
    rarity: 'LEGENDARY',
    phrases: [
      'Fus Ro Dah! *solta fumacinha azul*',
      'O sangue dos dragões corre nesta guilda!',
      'Roaaar! O trono de Tamriel é nosso!',
      'Dovahkiin! Hora de incinerar o backlog!',
    ],
  },

  // NV 25: BANNER (Elden Ring)
  {
    id: 'guild-banner-25',
    level: 25,
    type: 'BANNER',
    name: 'A Árvore Sagrada do Cosmos',
    gameTag: 'Elden Ring',
    description: '"Foul Tarnished, in search of the Elden Ring... O pináculo de todas as eras."',
    rarity: 'MYTHIC',
    effectType: 'crystal-aura',
  },
];

export function isGuildRewardUnlocked(itemLevel: number, guildLevel: number): boolean {
  return guildLevel >= itemLevel;
}

export function getUnlockedGuildRewards(guildLevel: number): GuildRewardItem[] {
  return GUILD_REWARDS_CATALOG.filter((item) => isGuildRewardUnlocked(item.level, guildLevel));
}
