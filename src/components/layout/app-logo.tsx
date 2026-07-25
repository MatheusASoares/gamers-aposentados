"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/logo.jpg";
import { Shield, Gamepad2, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  theme?: string | null;
  className?: string;
  variant?: "sidebar" | "compact";
}

export function AppLogo({ theme, className, variant = "sidebar" }: AppLogoProps) {
  const activeTheme = theme || "cyberpunk";

  // Configuration for each theme's visual branding
  const themeConfig = {
    "theme-medieval": {
      glow: "bg-amber-500/30 group-hover:bg-amber-500/50",
      border: "border-amber-500/40 group-hover:border-amber-400 group-hover:shadow-[0_0_30px_rgba(217,119,6,0.5)]",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      badgeText: "Medieval RPG ⚔️",
      accentText: "text-amber-400",
    },
    "theme-space": {
      glow: "bg-sky-500/30 group-hover:bg-sky-500/50",
      border: "border-sky-400/50 group-hover:border-amber-400 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]",
      badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      badgeText: "RPG Espacial 🚀",
      accentText: "text-sky-400",
    },
    "theme-pixel": {
      glow: "bg-rose-500/30 group-hover:bg-rose-500/50",
      border: "border-rose-500/50 group-hover:border-emerald-400 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]",
      badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      badgeText: "Pixel Art 16-Bit 🕹️",
      accentText: "text-rose-400",
    },
    cyberpunk: {
      glow: "bg-[#bd0df2]/20 group-hover:bg-[#bd0df2]/40",
      border: "border-white/5 group-hover:border-[#bd0df2]/40 group-hover:shadow-[0_0_30px_rgba(189,13,242,0.3)]",
      badgeBg: "bg-[#bd0df2]/15 text-purple-300 border-[#bd0df2]/30",
      badgeText: "Cyberpunk Neon 👾",
      accentText: "text-[#bd0df2]",
    },
  };

  const currentConfig =
    themeConfig[activeTheme as keyof typeof themeConfig] || themeConfig.cyberpunk;

  if (variant === "compact") {
    return (
      <Link href="/" className={cn("flex items-center gap-3 group", className)}>
        <div className={cn("relative h-9 w-9 overflow-hidden rounded-xl border p-0.5 shadow-md", currentConfig.border)}>
          <Image src={logo} alt="Logo" fill className="object-cover rounded-lg" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-tight text-white">
            GAMERS <span className={currentConfig.accentText}>APOSENTADOS</span>
          </span>
          <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">
            {currentConfig.badgeText}
          </span>
        </div>
      </Link>
    );
  }

  // Sidebar Main Large Logo
  return (
    <Link
      href="/"
      className={cn(
        "relative flex flex-col items-center justify-center px-6 pb-4 transition-all duration-500 hover:scale-105 group",
        className
      )}
    >
      {/* Dynamic Theme Ambient Glow */}
      <div
        className={cn(
          "absolute -inset-1 z-0 animate-pulse rounded-[2.5rem] blur-2xl transition-all duration-500",
          currentConfig.glow
        )}
      />

      {/* Logo Glass Container */}
      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-[2.5rem] border bg-transparent p-1 shadow-2xl backdrop-blur-xl transition-all duration-500",
          currentConfig.border
        )}
      >
        <Image
          src={logo}
          alt="Gamers Aposentados Logo"
          width={180}
          height={180}
          priority
          className="relative z-10 h-auto w-full mix-blend-screen transition-all duration-700 group-hover:brightness-110 group-hover:contrast-125"
        />

        {/* Shine Overlay */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
      </div>

      {/* Dynamic Theme Sub-Badge */}
      <div
        className={cn(
          "mt-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-sm transition-all",
          currentConfig.badgeBg
        )}
      >
        <span>{currentConfig.badgeText}</span>
      </div>
    </Link>
  );
}
