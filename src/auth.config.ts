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
            const isPublicRoute = isAuthRoute || (isApiRoute && isAuthApiRoute) || isHomeRoute;

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
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.username = user.username;
                token.image = user.image;
                token.email = user.email;
            }
            if (trigger === "update") {
                if (session?.username) token.username = session.username;
                if (session?.image) token.image = session.image;
            }
            return token;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
