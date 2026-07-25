import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE users SET equipped_banner = 'banner-retro-arcade'`;
  console.log("Successfully updated equipped_banner to 'banner-retro-arcade' for all users!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
