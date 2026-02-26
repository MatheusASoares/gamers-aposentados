import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all game progresses:");
    const all = await prisma.gameProgress.findMany({
        include: {
            user: { select: { email: true, name: true, username: true } },
            game: { select: { title: true } }
        }
    });
    console.log(JSON.stringify(all, null, 2));
}

main().finally(() => prisma.$disconnect());
