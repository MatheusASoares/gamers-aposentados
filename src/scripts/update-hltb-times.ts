import { prisma } from "../lib/prisma";
import { calculateGameXP, calculateLevelFromXP, getRankTierTitle } from "../app/lib/xp-engine";

const hltbMapping: Record<string, number> = {
  "Demon's Crest": 5,
  "Hi-Fi Rush": 11,
  "Dead Cells": 15,
  "Prince of Persia": 3,
  "Prince Of Persia 1": 3,
  "Children of Morta": 14,
  "Dungeons of Hinterberg": 15,
  "Gauntlet: Seven Sorrows": 7,
  "Gauntlet": 6,
  "Mad Max": 20,
  "Celeste Duplicate": 8,
  "Alundra": 23,
  "Batman: Arkham City": 13,
  "Besiege": 10,
  "Castlevania: Symphony of the Night": 8,
  "Chaos Legion": 9,
  "Chrono Trigger": 23,
  "Dragons Dogma Dark Arisen": 35,
  "Creatures Nightmare": 4,
  "Donkey Kong (1981)": 1,
  "Hero Siege": 12,
  "Hollow Knight": 27,
  "Ico": 6,
  "Illusion of Gaia": 13,
  "Metal Gear Solid": 12,
  "Pepsiman": 2,
  "Shadow of the Colossus": 9,
  "Sifu": 9,
  "The Simpsons: Hit & Run": 9,
  "Slay the Spire": 12,
  "Super Metroid": 7,
  "The Legend of Zelda: A Link to the Past": 15,
  "Titan Souls": 4,
  "Tomb Raider: Underworld": 9,
  "Death Gambit": 12,
  "Jack Chan": 3,
  "Super Bomberman 4": 3,
  "Cat Quest": 5,
  "Control": 12,
  "Detroit: Become Human": 12,
  "Dishonored: Definitive Edition": 12,
  "Final Fantasy X": 48,
  "Legacy of Kain: Soul Reaver": 11,
  "Limbo": 3,
  "Little Nightmares": 4,
  "Moonlighter": 14,
  "Need for Speed: Underground": 16,
  "Portal": 3,
  "Shadow Hearts": 30,
  "Shadow of the Tomb Raider": 13,
  "SteamWorld Dig 2": 8,
  "Super Mario Bros.": 2,
  "The Incredible Adventures of Van Helsing: Final Cut": 25,
  "The Legend of Zelda: Link's Awakening": 14,
  "The Outer Worlds: Spacer's Choice Edition": 13,
  "Titan Quest": 30,
  "Torchlight II": 21,
  "GhostWire": 12,
  "Death Stranding 1": 40,
  "Baldur's Gate III": 75,
  "Baldur's Gate: Dark Alliance": 11,
  "Batman: Arkham Origins": 12,
  "Batman Arkham Knight": 17,
  "Castlevania: Aria of Sorrow": 7,
  "Chrono Cross": 36,
  "Disco Elysium": 22,
  "Dragon Age: Inquisition": 48,
  "Dragon Quest": 10,
  "Fallout: New Vegas": 27,
  "Grim Dawn": 32,
  "Hades II": 25,
  "Hitman 2": 10,
  "Hogwarts Legacy": 26,
  "Jusant": 5,
  "Kingdom Come: Deliverance": 41,
  "Midnight Club: Street Racing": 10,
  "No Rest for the Wicked": 15,
  "Shadow Gambit: The Cursed Crew": 26,
  "Streets of Rage 4": 3,
  "The Mask": 2,
  "The Outer Worlds": 13,
  "The Witcher 3 Wild Hunt": 50,
  "X-Men Origins: Wolverine": 9,
  "Yakuza: Like a Dragon": 45
};

async function main() {
  console.log("1. Atualizando horas HLTB dos jogos no banco de dados...");
  for (const [title, hours] of Object.entries(hltbMapping)) {
    await prisma.game.updateMany({
      where: { title: { equals: title, mode: "insensitive" } },
      data: { hltb_time: hours },
    });
  }

  console.log("2. Recalculando XP e Níveis dos usuários...");
  const users = await prisma.user.findMany({ select: { id: true, name: true, username: true } });

  for (const user of users) {
    const completedProgresses = await prisma.gameProgress.findMany({
      where: { user_id: user.id, status: "COMPLETED" },
      include: { game: true },
    });

    let totalXP = 0;
    for (const p of completedProgresses) {
      const xp = calculateGameXP({
        hltbHours: p.game.hltb_time,
        questType: p.game.quest_type,
        isPlatinum: p.is_platinum,
      });
      totalXP += xp;
      console.log(`  🎮 User: ${user.name || user.username} | Jogo: "${p.game.title}" (${p.game.quest_type}, ${p.game.hltb_time}h HLTB) -> +${xp} XP`);
    }

    const { level } = calculateLevelFromXP(totalXP);
    const equippedTitle = getRankTierTitle(level);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp_points: totalXP,
        level: level,
        equipped_title: equippedTitle,
      },
    });

    console.log(`✅ Atualizado ${user.name || user.username}: ${totalXP} Total XP | Nível ${level} | Título: "${equippedTitle}"`);
  }

  console.log("Script concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
