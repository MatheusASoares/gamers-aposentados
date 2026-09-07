import { prisma } from "../lib/prisma";

async function main() {
    const guilds = await prisma.guild.findMany({
        include: {
            members: {
                include: {
                    user: {
                        select: { name: true, email: true, username: true },
                    },
                },
            },
            pools: {
                select: { id: true, type: true, status: true, winner_game: { select: { title: true } } },
            },
        },
    });

    console.log("=== GUILDAS REGISTRADAS ===");
    for (const g of guilds) {
        console.log(`🛡️ ${g.name} (Slug: ${g.slug} | Código: ${g.invite_code})`);
        console.log(`   Nível: ${g.level} | XP: ${g.xp_points} | Título: ${g.equipped_title}`);
        console.log(`   Membros (${g.members.length}):`);
        for (const m of g.members) {
            console.log(`     - ${m.user.name || m.user.username} (${m.user.email}) -> Papel: ${m.role}`);
        }
        console.log(`   Potes Vinculados: ${g.pools.length}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
