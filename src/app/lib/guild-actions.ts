"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { GuildRole } from "@prisma/client";

export interface GuildSummaryDTO {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    inviteCode: string;
    level: number;
    xpPoints: number;
    equippedTitle: string | null;
    equippedBanner: string | null;
    equippedEmblem: string | null;
    equippedMascot?: string | null;
    memberCount: number;
    activeMemberCount: number;
    myRole: GuildRole;
    myIsActive: boolean;
    isOwner: boolean;
}

export interface ActiveGuildDetailsDTO extends GuildSummaryDTO {
    members: Array<{
        id: string;
        userId: string;
        name: string;
        username: string | null;
        image: string | null;
        role: GuildRole;
        isActive: boolean;
        level: number;
        xpPoints: number;
        equippedTitle: string | null;
        joinedAt: Date;
    }>;
}

/**
 * Retorna todas as guildas das quais o usuário logado participa.
 */
export async function getUserGuilds(): Promise<GuildSummaryDTO[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    try {
        const memberships = await prisma.guildMember.findMany({
            where: { user_id: userId },
            include: {
                guild: {
                    include: {
                        members: {
                            select: { id: true, is_active: true },
                        },
                    },
                },
            },
            orderBy: {
                joined_at: "asc",
            },
        });

        return memberships.map((m) => ({
            id: m.guild.id,
            name: m.guild.name,
            slug: m.guild.slug,
            description: m.guild.description,
            avatarUrl: m.guild.avatar_url,
            bannerUrl: m.guild.banner_url,
            inviteCode: m.guild.invite_code,
            level: m.guild.level,
            xpPoints: m.guild.xp_points,
            equippedTitle: m.guild.equipped_title,
            equippedBanner: m.guild.equipped_banner,
            equippedEmblem: m.guild.equipped_emblem,
            equippedMascot: (m.guild as any).equipped_mascot || null,
            memberCount: m.guild.members.length,
            activeMemberCount: m.guild.members.filter((mem) => mem.is_active).length,
            myRole: m.role,
            myIsActive: m.is_active,
            isOwner: m.guild.owner_id === userId,
        }));
    } catch (error) {
        console.error("Erro ao buscar guildas do usuário:", error);
        return [];
    }
}

/**
 * Retorna a guilda atualmente ativa para o usuário (baseada no cookie com fallback automático).
 */
export async function getActiveGuild(): Promise<ActiveGuildDetailsDTO | null> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    try {
        const cookieStore = await cookies();
        const activeGuildId = cookieStore.get("active_guild_id")?.value;

        // Se houver cookie, tenta carregar a guilda do cookie
        if (activeGuildId) {
            const guild = await prisma.guild.findUnique({
                where: { id: activeGuildId },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    image: true,
                                    level: true,
                                    xp_points: true,
                                    equipped_title: true,
                                },
                            },
                        },
                        orderBy: [
                            { role: "asc" }, // LEADER first
                            { joined_at: "asc" },
                        ],
                    },
                },
            });

            // Verifica se o usuário de fato é membro da guilda do cookie
            const myMembership = guild?.members.find((m) => m.user_id === userId);
            if (guild && myMembership) {
                return mapToActiveGuildDetails(guild, userId);
            }
        }

        // Fallback 1: Verificar se é membro da "Guilda dos Fundadores"
        const founderGuild = await prisma.guild.findFirst({
            where: {
                slug: { in: ["fundadores", "aposentados"] },
                members: { some: { user_id: userId } },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                                level: true,
                                xp_points: true,
                                equipped_title: true,
                            },
                        },
                    },
                    orderBy: [
                        { role: "asc" },
                        { joined_at: "asc" },
                    ],
                },
            },
        });

        if (founderGuild) {
            return mapToActiveGuildDetails(founderGuild, userId);
        }

        // Fallback 2: Pegar a primeira guilda que o usuário participa
        const anyMembership = await prisma.guildMember.findFirst({
            where: { user_id: userId },
            include: {
                guild: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        username: true,
                                        image: true,
                                        level: true,
                                        xp_points: true,
                                        equipped_title: true,
                                    },
                                },
                            },
                            orderBy: [
                                { role: "asc" },
                                { joined_at: "asc" },
                            ],
                        },
                    },
                },
            },
        });

        if (anyMembership?.guild) {
            return mapToActiveGuildDetails(anyMembership.guild, userId);
        }

        return null;
    } catch (error) {
        console.error("Erro ao buscar guilda ativa:", error);
        return null;
    }
}

/**
 * Alterna a guilda ativa do usuário gravando o cookie e revalidando a aplicação.
 */
export async function switchActiveGuild(guildId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return { success: false, error: "Não autenticado." };
    }

    try {
        // Valida se o usuário pertence à guilda
        const membership = await prisma.guildMember.findUnique({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: userId,
                },
            },
        });

        if (!membership) {
            return { success: false, error: "Você não é membro desta guilda." };
        }

        const cookieStore = await cookies();
        cookieStore.set("active_guild_id", guildId, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            sameSite: "lax",
        });

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Erro ao alternar guilda:", error);
        return { success: false, error: "Erro interno ao trocar de guilda." };
    }
}

/**
 * Cria uma nova guilda e define o criador como LÍDER.
 */
export async function createGuild(data: {
    name: string;
    description?: string;
    avatarUrl?: string;
}) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return { success: false, error: "Não autenticado." };
    }

    const trimmedName = data.name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 35) {
        return { success: false, error: "O nome da guilda deve ter entre 3 e 35 caracteres." };
    }

    try {
        // Gerar slug único
        const baseSlug = trimmedName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        
        let slug = baseSlug || "guild";
        const existingSlug = await prisma.guild.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Gerar código de convite único
        const cleanCodePrefix = baseSlug.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "G");
        const inviteCode = `${cleanCodePrefix}${Math.floor(1000 + Math.random() * 9000)}`;

        const newGuild = await prisma.$transaction(async (tx) => {
            const guild = await tx.guild.create({
                data: {
                    name: trimmedName,
                    slug,
                    description: data.description?.trim() || null,
                    avatar_url: data.avatarUrl || null,
                    invite_code: inviteCode,
                    owner_id: userId,
                    level: 1,
                    xp_points: 0,
                    equipped_title: "Guilda Recruta",
                    members: {
                        create: [
                            {
                                user_id: userId,
                                role: "LEADER",
                                is_active: true,
                            },
                        ],
                    },
                },
            });
            return guild;
        });

        const cookieStore = await cookies();
        cookieStore.set("active_guild_id", newGuild.id, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            sameSite: "lax",
        });

        revalidatePath("/", "layout");
        return { success: true, guildId: newGuild.id, slug: newGuild.slug };
    } catch (error) {
        console.error("Erro ao criar guilda:", error);
        return { success: false, error: "Erro ao criar guilda. Tente novamente." };
    }
}

/**
 * Adiciona o usuário logado a uma guilda usando o código de convite.
 */
export async function joinGuildByInviteCode(inviteCode: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return { success: false, error: "Não autenticado." };
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
        return { success: false, error: "Código de convite inválido." };
    }

    try {
        const guild = await prisma.guild.findUnique({
            where: { invite_code: cleanCode },
            include: {
                members: {
                    select: { user_id: true },
                },
            },
        });

        if (!guild) {
            return { success: false, error: "Guilda não encontrada com este código de convite." };
        }

        // Verifica se já é membro
        const alreadyMember = guild.members.some((m) => m.user_id === userId);
        if (alreadyMember) {
            const cookieStore = await cookies();
            cookieStore.set("active_guild_id", guild.id, {
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
                sameSite: "lax",
            });
            revalidatePath("/", "layout");
            return { success: true, alreadyMember: true, guildId: guild.id, guildName: guild.name };
        }

        // Adiciona como MEMBRO ativo
        await prisma.guildMember.create({
            data: {
                guild_id: guild.id,
                user_id: userId,
                role: "MEMBER",
                is_active: true,
            },
        });

        const cookieStore = await cookies();
        cookieStore.set("active_guild_id", guild.id, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            sameSite: "lax",
        });

        revalidatePath("/", "layout");
        return { success: true, guildId: guild.id, guildName: guild.name };
    } catch (error) {
        console.error("Erro ao entrar na guilda via convite:", error);
        return { success: false, error: "Erro ao entrar na guilda. Tente novamente." };
    }
}

/**
 * Altera o status de participação ativa de um membro no Randomizer (Apenas Líderes).
 */
export async function toggleMemberActiveStatus(guildId: string, targetUserId: string, isActive: boolean) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return { success: false, error: "Não autenticado." };

    try {
        // Valida se o chamador é LÍDER da guilda
        const myMembership = await prisma.guildMember.findUnique({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: currentUserId,
                },
            },
        });

        if (!myMembership || myMembership.role !== "LEADER") {
            return { success: false, error: "Apenas líderes podem alterar o status de membros." };
        }

        await prisma.guildMember.update({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: targetUserId,
                },
            },
            data: {
                is_active: isActive,
            },
        });

        revalidatePath("/guild");
        revalidatePath("/");
        revalidatePath("/randomizer");
        return { success: true };
    } catch (error) {
        console.error("Erro ao alterar status do membro:", error);
        return { success: false, error: "Erro ao atualizar status do membro." };
    }
}

/**
 * Atualiza as configurações e informações da guilda (Apenas Líderes).
 */
export async function updateGuildSettings(
    guildId: string,
    data: { name?: string; description?: string; inviteCode?: string }
) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return { success: false, error: "Não autenticado." };

    try {
        const myMembership = await prisma.guildMember.findUnique({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: currentUserId,
                },
            },
        });

        if (!myMembership || myMembership.role !== "LEADER") {
            return { success: false, error: "Apenas líderes podem editar a guilda." };
        }

        const updateData: { name?: string; description?: string | null; slug?: string; invite_code?: string } = {};
        if (data.name) {
            const trimmed = data.name.trim();
            if (trimmed.length < 3 || trimmed.length > 35) {
                return { success: false, error: "Nome deve ter entre 3 e 35 caracteres." };
            }
            updateData.name = trimmed;

            // Gerar slug limpo
            const baseSlug = trimmed
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            
            let slug = baseSlug || "guild";
            const existingSlug = await prisma.guild.findFirst({
                where: { slug, id: { not: guildId } }
            });
            if (existingSlug) {
                slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
            }
            updateData.slug = slug;
        }

        if (data.inviteCode) {
            const cleanCode = data.inviteCode
                .toUpperCase()
                .trim()
                .replace(/[^A-Z0-9-]/g, "");
            if (cleanCode.length >= 3 && cleanCode.length <= 25) {
                const existingCode = await prisma.guild.findFirst({
                    where: { invite_code: cleanCode, id: { not: guildId } }
                });
                if (existingCode) {
                    return { success: false, error: `O código de convite ${cleanCode} já está em uso por outra guilda.` };
                }
                updateData.invite_code = cleanCode;
            }
        }

        if (data.description !== undefined) {
            updateData.description = data.description.trim() || null;
        }

        await prisma.guild.update({
            where: { id: guildId },
            data: updateData,
        });

        revalidatePath("/guild");
        revalidatePath("/", "layout");
        revalidatePath("/randomizer");
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar guilda:", error);
        return { success: false, error: "Erro ao atualizar dados da guilda." };
    }
}

/**
 * Promove ou rebaixa o papel de um membro da guilda (Apenas Líderes).
 */
export async function promoteMember(guildId: string, targetUserId: string, newRole: GuildRole) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return { success: false, error: "Não autenticado." };

    try {
        const myMembership = await prisma.guildMember.findUnique({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: currentUserId,
                },
            },
        });

        if (!myMembership || myMembership.role !== "LEADER") {
            return { success: false, error: "Apenas líderes podem alterar cargos." };
        }

        await prisma.guildMember.update({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: targetUserId,
                },
            },
            data: { role: newRole },
        });

        revalidatePath("/guild");
        return { success: true };
    } catch (error) {
        console.error("Erro ao alterar cargo do membro:", error);
        return { success: false, error: "Erro ao alterar cargo." };
    }
}

/**
 * Remove um membro da guilda (Apenas Líderes).
 */
export async function kickMember(guildId: string, targetUserId: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return { success: false, error: "Não autenticado." };

    try {
        const myMembership = await prisma.guildMember.findUnique({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: currentUserId,
                },
            },
        });

        if (!myMembership || myMembership.role !== "LEADER") {
            return { success: false, error: "Apenas líderes podem expulsar membros." };
        }

        const guild = await prisma.guild.findUnique({ where: { id: guildId } });
        if (guild?.owner_id === targetUserId) {
            return { success: false, error: "Não é possível expulsar o fundador da guilda." };
        }

        await prisma.guildMember.delete({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: targetUserId,
                },
            },
        });

        revalidatePath("/guild");
        return { success: true };
    } catch (error) {
        console.error("Erro ao expulsar membro:", error);
        return { success: false, error: "Erro ao expulsar membro." };
    }
}

/**
 * Sai da guilda ativa.
 */
export async function leaveGuild(guildId: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return { success: false, error: "Não autenticado." };

    try {
        const guild = await prisma.guild.findUnique({
            where: { id: guildId },
            include: { members: true },
        });

        if (!guild) return { success: false, error: "Guilda não encontrada." };

        // Se for o dono e houver outros membros, impede ou requer transferência
        if (guild.owner_id === currentUserId && guild.members.length > 1) {
            return {
                success: false,
                error: "Como fundador, promova outro membro a dono antes de sair.",
            };
        }

        await prisma.guildMember.delete({
            where: {
                guild_id_user_id: {
                    guild_id: guildId,
                    user_id: currentUserId,
                },
            },
        });

        // Limpa cookie e redireciona
        const cookieStore = await cookies();
        cookieStore.delete("active_guild_id");

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Erro ao sair da guilda:", error);
        return { success: false, error: "Erro ao sair da guilda." };
    }
}

/**
 * Busca informações públicas de uma guilda pelo código de convite para a tela /invite/[code].
 */
export async function getGuildByInviteCode(inviteCode: string) {
    const cleanCode = inviteCode.trim().toUpperCase();
    try {
        const guild = await prisma.guild.findUnique({
            where: { invite_code: cleanCode },
            include: {
                owner: {
                    select: { name: true, username: true, image: true },
                },
                _count: {
                    select: { members: true, pools: true },
                },
            },
        });

        if (!guild) return null;

        return {
            id: guild.id,
            name: guild.name,
            slug: guild.slug,
            description: guild.description,
            inviteCode: guild.invite_code,
            level: guild.level,
            xpPoints: guild.xp_points,
            equippedTitle: guild.equipped_title,
            equippedBanner: guild.equipped_banner,
            equippedEmblem: guild.equipped_emblem,
            ownerName: guild.owner.name || guild.owner.username || "Líder",
            ownerImage: guild.owner.image,
            memberCount: guild._count.members,
            poolsCount: guild._count.pools,
        };
    } catch (error) {
        console.error("Erro ao buscar guilda por convite:", error);
        return null;
    }
}

/**
 * Retorna estatísticas consolidadas da guilda (Total de jogos zerados pelos membros, potes, horas).
 */
export async function getGuildStats(guildId: string) {
    try {
        const guild = await prisma.guild.findUnique({
            where: { id: guildId },
            include: {
                members: { select: { user_id: true } },
                pools: {
                    where: { status: "CLOSED", winner_game_id: { not: null } },
                    include: { winner_game: true },
                },
            },
        });

        if (!guild) return null;

        const memberUserIds = guild.members.map((m) => m.user_id);

        // Contar progressos concluídos (status === 'COMPLETED' ou progress_percentage === 100) pelos membros da guilda
        const completedProgresses = await prisma.gameProgress.findMany({
            where: {
                user_id: { in: memberUserIds },
                OR: [{ status: "COMPLETED" }, { progress_percentage: 100 }],
            },
            include: { game: true },
        });

        const totalPlatinums = completedProgresses.filter((p) => p.is_platinum).length;
        const uniqueGamesCompleted = new Set(completedProgresses.map((p) => p.game_id)).size;

        return {
            totalCompletedGames: uniqueGamesCompleted,
            totalPools: guild.pools.length,
            totalHoursPlayed: totalPlatinums, // Exibe o total de platinas conquistadas pelo grupo
            totalMembers: guild.members.length,
        };
    } catch (error) {
        console.error("Erro ao buscar estatísticas da guilda:", error);
        return {
            totalCompletedGames: 0,
            totalPools: 0,
            totalHoursPlayed: 0,
            totalMembers: 0,
        };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToActiveGuildDetails(guild: any, currentUserId: string): ActiveGuildDetailsDTO {
    const myMembership = guild.members.find((m: any) => m.user_id === currentUserId);
    return {
        id: guild.id,
        name: guild.name,
        slug: guild.slug,
        description: guild.description,
        avatarUrl: guild.avatar_url,
        bannerUrl: guild.banner_url,
        inviteCode: guild.invite_code,
        level: guild.level,
        xpPoints: guild.xp_points,
        equippedTitle: guild.equipped_title,
        equippedBanner: guild.equipped_banner,
        equippedEmblem: guild.equipped_emblem,
        equippedMascot: guild.equipped_mascot || null,
        memberCount: guild.members.length,
        activeMemberCount: guild.members.filter((m: any) => m.is_active).length,
        myRole: myMembership?.role || "MEMBER",
        myIsActive: myMembership?.is_active ?? true,
        isOwner: guild.owner_id === currentUserId,
        members: guild.members.map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            name: m.user.name || m.user.username || "Gamer",
            username: m.user.username,
            image: m.user.image,
            role: m.role,
            isActive: m.is_active,
            level: m.user.level || 1,
            xpPoints: m.user.xp_points || 0,
            equippedTitle: m.user.equipped_title,
            joinedAt: m.joined_at,
        })),
    };
}

