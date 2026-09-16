import { GameSearchResult } from "@/components/ui/game-autocomplete";

export type QuestType = "MAIN" | "SIDE";

export interface LocalCandidate extends GameSearchResult {
    nominator: string;
    entryId?: string; // From DB if already saved
}

export interface ActiveGuildContext {
    id: string;
    name: string;
    level: number;
    myRole: "LEADER" | "MEMBER";
    myIsActive: boolean;
    activeMembers: Array<{ id: string; userId: string; name: string; role: "LEADER" | "MEMBER" }>;
}

export interface WinnerData {
    title: string;
    imageUrl?: string | null;
}

export type WinnerState = WinnerData | null;

export interface LockStatus {
    locked: boolean;
    message?: string;
}
