"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  frameUrl?: string | null;
  cssFrameClass?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-xl",
  "2xl": "h-28 w-28 md:h-32 md:w-32 text-2xl",
};

const frameSizePadding = {
  sm: "p-[3px]",
  md: "p-[5px]",
  lg: "p-[7px]",
  xl: "p-[10px]",
  "2xl": "p-[12px]",
};

export function UserAvatar({
  src,
  name,
  frameUrl,
  cssFrameClass,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "GA";

  return (
    <div className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
      {/* 1. FOTO DE PERFIL / AVATAR DO USUÁRIO (Camada de Fundo) */}
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300",
          !frameUrl && "ring-1 ring-white/10",
          sizeMap[size],
          cssFrameClass && frameSizePadding[size],
          cssFrameClass
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name || "Avatar"}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* 2. MOLDURA DE ASSET PNG (Camada Superior / Overlay Transparente no Centro) */}
      {frameUrl && (
        <div className="pointer-events-none absolute inset-0 -m-[15%] h-[130%] w-[130%] z-10 flex items-center justify-center">
          <Image
            src={frameUrl}
            alt="Borda de Perfil"
            fill
            sizes="(max-width: 768px) 120px, 160px"
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}
