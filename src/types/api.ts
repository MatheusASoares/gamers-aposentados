// src/types/api.ts

export interface IGDBGameResult {
    id: string;
    nome: string;
    imageUrl?: string;
}

export interface HltbAiResult {
    title: string;
    mainStory?: number | null;
}

export interface HltbAiResponse {
    results: HltbAiResult[];
}

export interface UserProfile {
    id: string;
    name?: string | null;
    email?: string | null;
    username?: string | null;
    image?: string | null;
    xp_points?: number;
    level?: number;
    equipped_title?: string | null;
    equipped_frame?: string | null;
    equipped_banner?: string | null;
    equipped_theme?: string | null;
}

export interface RandomizerLockStatus {
    isLocked: boolean;
    lockedBy?: string | null;
    lockedAt?: string | Date | null;
    reason?: string | null;
}
