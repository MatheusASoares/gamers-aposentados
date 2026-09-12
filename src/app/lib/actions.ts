"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { authRateLimiter, getClientIp } from "@/lib/rate-limiter";

const RegisterSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function register(prevState: string | undefined, formData: FormData) {
    const clientIp = await getClientIp();

    // Rate Limiting: Máximo de 5 cadastros a cada 15 minutos por IP
    const rateLimit = authRateLimiter.check(`register:ip:${clientIp}`, 5, 900);
    if (!rateLimit.success) {
        const minutes = Math.max(1, Math.ceil(rateLimit.resetSeconds / 60));
        return `Too many registration attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
    }

    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return "Invalid fields. Please check your input.";
    }

    const { email, password, username } = validatedFields.data;

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return "User with this email or username already exists.";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        // Associar à guilda dos Fundadores se existir
        const founderGuild = await prisma.guild.findFirst({
            where: { slug: { in: ["fundadores", "aposentados"] } },
        });
        if (founderGuild) {
            await prisma.guildMember.create({
                data: {
                    guild_id: founderGuild.id,
                    user_id: user.id,
                    role: "MEMBER",
                    is_active: true,
                },
            });
        }
    } catch (error) {
        console.error("Registration error:", error);
        return "Failed to register user.";
    }

    redirect("/login");
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    const clientIp = await getClientIp();
    const rawEmail = String(formData.get("email") || "").toLowerCase().trim();

    // Rate Limiting por IP: Máximo de 10 tentativas a cada 15 minutos
    const ipLimit = authRateLimiter.check(`login:ip:${clientIp}`, 10, 900);
    if (!ipLimit.success) {
        const minutes = Math.max(1, Math.ceil(ipLimit.resetSeconds / 60));
        return `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
    }

    // Rate Limiting por Conta (E-mail): Máximo de 5 tentativas a cada 15 minutos
    if (rawEmail) {
        const emailLimit = authRateLimiter.check(`login:email:${rawEmail}`, 5, 900);
        if (!emailLimit.success) {
            const minutes = Math.max(1, Math.ceil(emailLimit.resetSeconds / 60));
            return `Too many failed login attempts for this account. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
        }
    }

    try {
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials.";
                default:
                    return "Something went wrong.";
            }
        }
        throw error;
    }
}

