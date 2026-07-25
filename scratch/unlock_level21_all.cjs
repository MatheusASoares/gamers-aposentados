const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Unlocking Level 21 and 25,000 XP for all users...");
  const updatedCount = await prisma.$executeRaw`
    UPDATE users
    SET level = 21, xp_points = 25000;
  `;
  console.log(`Successfully updated ${updatedCount} users to Level 21!`);
}

main()
  .catch((e) => {
    console.error("Error updating users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
