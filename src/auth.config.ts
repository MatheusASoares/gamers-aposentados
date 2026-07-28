import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAuthRoute =
                nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
            const isApiRoute = nextUrl.pathname.startsWith("/api");
            const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth");
            const isHomeRoute = nextUrl.pathname === "/";
            const isPublicRoute =
                isAuthRoute ||
                (isApiRoute && isAuthApiRoute) ||
                isHomeRoute ||
                nextUrl.pathname === "/site.webmanifest" ||
                nextUrl.pathname === "/favicon.ico";

            if (!isPublicRoute) {
                // Se a rota não for pública e o usuário não estiver logado, bloqueia
                if (isLoggedIn) return true;

                // Se for uma rota de API, retorna JSON 401 em vez de redirecionar para HTML
                if (isApiRoute) {
                    return Response.json({ error: "Unauthorized" }, { status: 401 });
                }
                return false; // Vai ser redirecionado para /login
            } else if (isLoggedIn && isAuthRoute) {
                // Se já está logado e tenta acessar login/register, redireciona para home
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.username = token.username as string;
                session.user.image = (token.image as string) ?? session.user.image;
                session.user.email = (token.email as string) ?? session.user.email;
                (session.user as any).equipped_frame = token.equipped_frame as string | null;
                (session.user as any).equipped_title = token.equipped_title as string | null;
                (session.user as any).equipped_banner = token.equipped_banner as string | null;
                (session.user as any).equipped_theme = (token.equipped_theme as string) || "cyberpunk";
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.username = user.username;
                token.image = user.image;
                token.email = user.email;
                token.equipped_frame = (user as any).equipped_frame || null;
                token.equipped_title = (user as any).equipped_title || null;
                token.equipped_banner = (user as any).equipped_banner || null;
                token.equipped_theme = (user as any).equipped_theme || "cyberpunk";
            }
            if (trigger === "update") {
                if (session?.username) token.username = session.username;
                if (session?.image) token.image = session.image;
                if (session?.equipped_frame !== undefined) token.equipped_frame = session.equipped_frame;
                if (session?.equipped_title !== undefined) token.equipped_title = session.equipped_title;
                if (session?.equipped_banner !== undefined) token.equipped_banner = session.equipped_banner;
                if (session?.equipped_theme !== undefined) token.equipped_theme = session.equipped_theme;
            }
            return token;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
