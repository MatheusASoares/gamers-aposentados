import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username?: string | null;
            xp_points?: number;
            level?: number;
            equipped_title?: string | null;
            equipped_frame?: string | null;
            equipped_banner?: string | null;
            equipped_theme?: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        username?: string | null;
        xp_points?: number;
        level?: number;
        equipped_title?: string | null;
        equipped_frame?: string | null;
        equipped_banner?: string | null;
        equipped_theme?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        username?: string | null;
        xp_points?: number;
        level?: number;
        equipped_title?: string | null;
        equipped_frame?: string | null;
        equipped_banner?: string | null;
        equipped_theme?: string | null;
    }
}

