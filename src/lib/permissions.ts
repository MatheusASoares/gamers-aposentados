import { RANDOMIZER_PLAYER_EMAILS } from "./randomizer-players";

export type UserRole = "GUILD_MASTER" | "MEMBER";

export interface UserPermissionContext {
    id?: string | null;
    email?: string | null;
    role?: UserRole | string | null;
}

/**
 * Checks if a user has the GUILD_MASTER role (Matheus & Lucas).
 * Fallback to email list for backwards compatibility / local dev.
 */
export function isGuildMaster(user: UserPermissionContext | null | undefined): boolean {
    if (!user) return false;
    if (user.role === "GUILD_MASTER") return true;
    if (user.email) {
        const lower = user.email.toLowerCase();
        if (RANDOMIZER_PLAYER_EMAILS.includes(lower)) return true;
    }
    return false;
}

/**
 * Checks if a user is an authenticated member of the platform.
 */
export function isMember(user: UserPermissionContext | null | undefined): boolean {
    return !!user?.id;
}
