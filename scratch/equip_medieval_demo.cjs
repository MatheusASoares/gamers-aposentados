const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE users SET equipped_theme = 'theme-medieval'`;
  console.log("Updated equipped_theme to theme-medieval for all users!");
}

main().finally(() => prisma.$disconnect());
