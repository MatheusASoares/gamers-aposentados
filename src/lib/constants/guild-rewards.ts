import { BannerEffectType } from "./rewards";

export type GuildRewardType = 'TITLE' | 'EMBLEM' | 'BANNER' | 'MASCOT';
export type GuildRewardRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface MascotThemeConfig {
  borderColor: string;
  glowColor: string;
  textColor: string;
  pointerBorder: string;
  iconName: 'Zap' | 'Leaf' | 'Beer' | 'Sparkles' | 'Flame' | 'Crown';
  accentColor: string;
}

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
  mascotTheme?: MascotThemeConfig; // Tema visual exclusivo do balão de fala
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
    mascotTheme: {
      borderColor: 'border-amber-400/80',
      glowColor: 'rgba(251, 191, 36, 0.45)',
      textColor: 'text-amber-200',
      pointerBorder: 'border-amber-400/80',
      iconName: 'Zap',
      accentColor: 'text-amber-400',
    },
    phrases: [
      'Comprei 40 jogos na Summer Sale pra ficar jogando Paciência... clássico.',
      'Instalei um implante de titânio na lombar só pra aguentar 2 horas de raid.',
      'Alerta do scanner: sua postura tá parecendo um camarão na cadeira gamer!',
      'Acorda, Samurai! Temos um backlog de 2015 pra fingir que vamos jogar!',
      'Bip boop! 22:30 detectado. Modo idoso ativado, já pode ir nanar.',
      'Sua mira hoje tá parecendo bot de CS com ping 500 no Wi-Fi do vizinho...',
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
    mascotTheme: {
      borderColor: 'border-emerald-500/80',
      glowColor: 'rgba(16, 185, 129, 0.45)',
      textColor: 'text-emerald-200',
      pointerBorder: 'border-emerald-500/80',
      iconName: 'Leaf',
      accentColor: 'text-emerald-400',
    },
    phrases: [
      'Yahaha! Você me achou! Toma aqui uma semente que é literalmente cocô dourado.',
      'Você rodou o mapa por 80 horas catando florzinha e esqueceu de salvar a princesa?',
      'Mais 900 sementes de Korok e sua dor no ciático se cura por milagre!',
      'Dropa essa pedra na minha cabeça de novo que eu desinstalo seu jogo!',
      'Yahaha! Tá jogando no modo fácil escondido dos amigos da guilda, né?',
      'Chacoalhando minhas maracas... ah não, esqueci que gastei o salário em skin.',
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
    assetUrl: '/assets/guild/emblems/witcher-wolf.png',
    icon: 'Shield',
    cssClass: 'text-amber-400 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
  },

  // NV 10: MASCOTE (Monster Hunter)
  {
    id: 'guild-mascot-10',
    level: 10,
    type: 'MASCOT',
    name: 'Palico Guerreiro Felyne',
    gameTag: 'Monster Hunter',
    description: 'Gatinho caçador com mini armadura e caneca de poção que comemora com saltos.',
    rarity: 'RARE',
    assetUrl: '/assets/guild/mascots/palico-felyne.png',
    mascotTheme: {
      borderColor: 'border-orange-500/80',
      glowColor: 'rgba(249, 115, 22, 0.45)',
      textColor: 'text-orange-200',
      pointerBorder: 'border-orange-500/80',
      iconName: 'Beer',
      accentColor: 'text-orange-400',
    },
    phrases: [
      'Miau! O carrinho de desmaio já tem o seu nome bordado em ponto cruz!',
      'Poção de cura? Nada, o que cura sua build torta é um Dorflex e café preto!',
      'Miau! 45 minutos batendo no rabo do monstro pra tomar hit kill de ombro...',
      'Cozinhei um banquete com 5 pratos no acampamento e você foi pra caçada em jejum?!',
      'Mais um desmaio nessa quest e eu começo a cobrar corrida de Uber Miau!',
      'Trabalhou 8 horas na firma pra chegar em casa e apanhar de dinossauro? Adoro.',
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
    assetUrl: '/assets/guild/banners/kaer-morhen.jpg',
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
    assetUrl: '/assets/guild/emblems/castlevania-seal.png',
  },

  // NV 14: TÍTULO (Dark Souls)
  {
    id: 'guild-title-14',
    level: 14,
    type: 'TITLE',
    name: 'Herdeiros da Primeira Chama',
    gameTag: 'Dark Souls',
    description: '"Praise the Sun! \\[T]/ Aqueles que desafiaram a maldição e reacenderam a Era do Fogo."',
    rarity: 'RARE',
    icon: 'Sun',
    cssClass: 'border-amber-500/70 bg-gradient-to-r from-amber-950/80 via-orange-950/60 to-zinc-950 text-amber-300 shadow-[0_0_22px_rgba(245,158,11,0.45)] ring-1 ring-amber-500/30',
  },

  // NV 15: MASCOTE (Final Fantasy VII)
  {
    id: 'guild-mascot-15',
    level: 15,
    type: 'MASCOT',
    name: 'Chocobo Dourado Mecha',
    gameTag: 'Final Fantasy VII',
    description: 'Pequeno filhote de Chocobo dourado com aprimoramentos cibernéticos e óculos.',
    rarity: 'EPIC',
    assetUrl: '/assets/guild/mascots/mecha-chocobo.png',
    mascotTheme: {
      borderColor: 'border-yellow-400/80',
      glowColor: 'rgba(234, 179, 8, 0.5)',
      textColor: 'text-yellow-200',
      pointerBorder: 'border-yellow-400/80',
      iconName: 'Sparkles',
      accentColor: 'text-yellow-400',
    },
    phrases: [
      'Kweh! Gastei 150 horas cruzando chocobos no Gold Saucer pra você perder pro Teioh?!',
      'Wark! Meus sensores detectaram que você não esquiva de golpe nem por reza brava!',
      'Kweeeh! Reclamou do preço do remake mas comprou a edição deluxe de 400 reais, né?',
      'Sephiroth tocou fogo na vila, mas o que tá queimando é a sua paciência com RNG.',
      'Kweh! Meus óculos de aviador têm filtro de luz azul pra sua vista cansada de idoso!',
      'Wark! Mais uma tentativa no boss ou já vai pedir arrego e olhar detonado no YouTube?',
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
    assetUrl: '/assets/guild/emblems/spartan-reach.png',
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
    assetUrl: '/assets/guild/banners/tsushima-shrine.jpg',
  },

  // NV 19: MASCOTE (Skyrim)
  {
    id: 'guild-mascot-19',
    level: 19,
    type: 'MASCOT',
    name: 'Filhote de Dragão de Alduin',
    gameTag: 'Skyrim',
    description: 'Filhote de dragão ancião de obsidiana com asas de nebulosa e sopro mágico.',
    rarity: 'EPIC',
    assetUrl: '/assets/guild/mascots/alduin-dragon.png',
    mascotTheme: {
      borderColor: 'border-red-500/80',
      glowColor: 'rgba(239, 68, 68, 0.55)',
      textColor: 'text-red-200',
      pointerBorder: 'border-red-500/80',
      iconName: 'Flame',
      accentColor: 'text-red-400',
    },
    phrases: [
      'Fus Ro Dah! *espirro de fumacinha*... engasguei com as 45 rodas de queijo do seu inventário.',
      'Sou o Devorador de Mundos! Mas você tá há 3 horas organizando baú em Whiterun...',
      'Dovahkiin! Você tomou uma flechada no joelho e tá usando isso de desculpa pra não ir na academia?',
      'Vou queimar sua lista de jogos pendentes, é a única forma de zerar esse backlog!',
      'Roaaar! Você instalou 400 mods e o jogo nem abre mais... parabéns, gênio.',
      'Dovahkiin, vá dormir! Já são 2 da manhã e amanhã você chora na reunião de equipe!',
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
    assetUrl: '/assets/guild/banners/citadel-station.jpg',
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
    assetUrl: '/assets/guild/emblems/hollow-knight.png',
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

  // NV 24: BANNER (Elden Ring)
  {
    id: 'guild-banner-24',
    level: 24,
    type: 'BANNER',
    name: 'A Árvore Sagrada do Cosmos',
    gameTag: 'Elden Ring',
    description: '"Foul Tarnished, in search of the Elden Ring... A luz dourada guia os passos da guilda."',
    rarity: 'LEGENDARY',
    assetUrl: '/assets/guild/banners/erdtree-cosmos.jpg',
    effectType: 'crystal-aura',
  },

  // NV 25: MASCOTE (Mascote Suprema da Guilda)
  {
    id: 'guild-mascot-25',
    level: 25,
    type: 'MASCOT',
    name: 'Luna Lovegood',
    gameTag: 'Mascote Suprema da Guilda',
    description: 'A rainha canina da guilda, protetora do descanso dos aposentados e devoradora de petiscos lendários.',
    rarity: 'MYTHIC',
    assetUrl: '/assets/guild/mascots/luna-lovegood.png',
    mascotTheme: {
      borderColor: 'border-[#bd0df2]',
      glowColor: 'rgba(189, 13, 242, 0.65)',
      textColor: 'text-fuchsia-200',
      pointerBorder: 'border-[#bd0df2]',
      iconName: 'Crown',
      accentColor: 'text-[#bd0df2]',
    },
    phrases: [
      'Au au! Larga esse controle e me dá petisco, humano! Eu sou a rainha dessa guilda!',
      'Quem foi uma boa menina hoje? Eu, que não deitei em cima do seu teclado no meio da partida!',
      'Au! Se eu ganhasse 1 petisco pra cada vez que você morreu pro mesmo boss, eu já tava obesa!',
      'Latir pro motoboy do iFood dá mais XP do que todas as suas sidequests juntas!',
      'Nível 25 alcançado! Agora você tem permissão oficial pra me fazer carinho na barriga.',
      'Au au! Vi você comprando jogo novo na promoção... e o meu sachezinho gourmet, cadê?',
    ],
  },
];

export function isGuildRewardUnlocked(itemLevel: number, guildLevel: number): boolean {
  return guildLevel >= itemLevel;
}

export function getUnlockedGuildRewards(guildLevel: number): GuildRewardItem[] {
  return GUILD_REWARDS_CATALOG.filter((item) => isGuildRewardUnlocked(item.level, guildLevel));
}
