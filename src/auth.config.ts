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
            const isHomeRoute = nextUrl.pathname === "/";
            const isPublicRoute = isAuthRoute || isApiRoute || isHomeRoute;

            if (!isPublicRoute) {
                // Se a rota não for pública e o usuário não estiver logado, bloqueia
                if (isLoggedIn) return true;
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
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.username = user.username;
            }
            if (trigger === "update" && session?.username) {
                token.username = session.username;
            }
            return token;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
