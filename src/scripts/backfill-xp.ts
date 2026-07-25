import { prisma } from "../lib/prisma";
import { calculateGameXP, calculateLevelFromXP, getRankTierTitle } from "../app/lib/xp-engine";

async function main() {
  console.log("Starting Retroactive XP & Level Backfill...");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true },
  });

  for (const user of users) {
    const displayName = user.name || user.username || user.id;
    console.log(`Processing user: ${displayName}...`);

    const completedProgresses = await prisma.gameProgress.findMany({
      where: {
        user_id: user.id,
        status: "COMPLETED",
      },
      include: {
        game: true,
      },
    });

    let totalXP = 0;
    for (const progress of completedProgresses) {
      const xp = calculateGameXP({
        hltbHours: progress.game.hltb_time,
        questType: progress.game.quest_type,
        isPlatinum: progress.is_platinum,
        failedRollsCount: 0,
      });
      totalXP += xp;
      console.log(`  - Game: "${progress.game.title}" (${progress.game.quest_type}) -> +${xp} XP`);
    }

    const { level } = calculateLevelFromXP(totalXP);
    const title = getRankTierTitle(level);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp_points: totalXP,
        level: level,
        equipped_title: title,
      },
    });

    console.log(`Updated ${displayName}: ${totalXP} Total XP | Level ${level} | Title: "${title}"`);
  }

  console.log("Backfill completed successfully!");
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
