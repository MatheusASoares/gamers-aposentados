import { prisma } from "../src/lib/prisma";

async function check() {
  const users = await prisma.user.findMany({
    include: {
      gameProgress: {
        include: { game: true }
      },
      reviews: true
    }
  });

  for (const u of users) {
    console.log(`\n👤 ${u.name} (${u.email}) [XP: ${u.xp_points}, Level: ${u.level}]`);
    console.log(`Progresses (${u.gameProgress.length}):`);
    for (const p of u.gameProgress) {
      console.log(`  - ${p.game.title} [${p.game.quest_type}] Status: ${p.status} | HLTB: ${p.game.hltb_time}h | Plat: ${p.is_platinum}`);
    }
    console.log(`Reviews (${u.reviews.length}):`);
    for (const r of u.reviews) {
      console.log(`  - Review for game ${r.game_id}: "${r.review_text?.substring(0, 30)}..."`);
    }
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
