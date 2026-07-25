const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE users SET level = 20, equipped_theme = 'theme-medieval'`;
  console.log("Updated user level to 20 and equipped_theme to theme-medieval!");
}

main().finally(() => prisma.$disconnect());
