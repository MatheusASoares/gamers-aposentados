import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (safe for dev)
  await prisma.poolEntry.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.review.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const alice = await prisma.user.create({ data: { username: 'alice', email: 'alice@example.com', name: 'Alice' } });
  const bob = await prisma.user.create({ data: { username: 'bob', email: 'bob@example.com', name: 'Bob' } });

  // Create games
  const game1 = await prisma.game.create({
    data: {
      title: 'Hollow Knight',
      platform: 'PC',
      cover_url: null,
      quest_type: 'MAIN_QUEST',
      status: 'SUGGESTED',
      hltb_time: 25,
      nominated_by_id: alice.id,
    },
  });

  const game2 = await prisma.game.create({
    data: {
      title: 'Stardew Valley',
      platform: 'PC',
      cover_url: null,
      quest_type: 'SIDE_QUEST',
      status: 'IN_POOL',
      hltb_time: 60,
      nominated_by_id: bob.id,
    },
  });

  // Create a pool and entries
  const pool = await prisma.pool.create({
    data: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      type: 'SIDE_QUEST',
      status: 'OPEN',
      entries: {
        create: [
          { game_id: game1.id, user_id: alice.id },
          { game_id: game2.id, user_id: bob.id },
        ],
      },
    },
    include: { entries: true },
  });

  // Create a review
  await prisma.review.create({
    data: {
      rating: 9,
      difficulty: 3,
      review_text: 'Ótimo jogo!',
      hours_played: 30,
      user_id: alice.id,
      game_id: game1.id,
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
