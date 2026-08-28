import { prisma } from "../lib/prisma";

async function main() {
    const guildMasterEmails = ["matheus31also@gmail.com", "lucasedu17gomes@gmail.com"];
    
    for (const email of guildMasterEmails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.user.update({
                where: { email },
                data: {
                    role: "GUILD_MASTER",
                    notice_board_tokens: 999,
                },
            });
            console.log(`Updated ${email} to GUILD_MASTER with 999 tokens`);
        } else {
            console.log(`User ${email} not found in DB`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
