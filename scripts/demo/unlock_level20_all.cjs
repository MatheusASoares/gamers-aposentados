const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Update all users to level 20 and 20,000 XP so all rewards are unlocked
  const result = await prisma.$executeRaw`UPDATE users SET level = 20, xp_points = 20000`;
  console.log(`Updated ${result} user(s) to Level 20 & 20,000 XP!`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
