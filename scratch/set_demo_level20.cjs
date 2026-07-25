const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE users SET level = 20, equipped_theme = 'cyberpunk'`;
  console.log("SUCCESS: User level updated to 20!");
}

main().finally(() => prisma.$disconnect());
