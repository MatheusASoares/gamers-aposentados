"use client";

import React from "react";
import { BannerEffectType } from "@/lib/constants/rewards";

interface BannerFxOverlayProps {
  effectType?: BannerEffectType;
  bannerId?: string;
  className?: string;
}

export function BannerFxOverlay({ effectType, bannerId, className = "" }: BannerFxOverlayProps) {
  // Infer effectType if not explicitly passed
  const activeEffect: BannerEffectType | undefined =
    effectType ||
    (bannerId === "banner-retro-arcade"
      ? "scanline"
      : bannerId === "banner-fantasy-dragon"
      ? "dragon-fire"
      : bannerId === "banner-chronos"
      ? "cosmic-stars"
      : bannerId === "banner-astral-crystal"
      ? "crystal-aura"
      : bannerId === "banner-japanese-sunrise" || bannerId === "banner-sakura-fuji"
      ? "sakura-twilight"
      : bannerId === "banner-synthwave-neon" || bannerId === "banner-synthwave-grid"
      ? "synthwave-grid"
      : bannerId === "banner-holoflux-matrix"
      ? "hologram-sweep"
      : undefined);

  if (!activeEffect) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 overflow-hidden ${className}`}>
      {/* 1. RETRO SCANLINE EFFECT */}
      {activeEffect === "scanline" && (
        <div className="relative h-full w-full">
          {/* CRT Line Pattern */}
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.75) 51%)",
              backgroundSize: "100% 4px",
            }}
          />
          {/* Moving Scanline Sweep */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scanline-sweep" />
          {/* Retro Pixel Corners */}
          <div className="absolute top-2 left-2 h-2 w-2 bg-pink-500/80 shadow-[0_0_8px_#ec4899]" />
          <div className="absolute bottom-2 right-2 h-2 w-2 bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]" />
        </div>
      )}

      {/* 2. DRAGON FIRE & RUNE EMBERS EFFECT (Skyrim / Witcher) */}
      {activeEffect === "dragon-fire" && (
        <div className="relative h-full w-full">
          {/* Fiery Crimson Blood Moon Glow */}
          <div className="absolute top-0 right-1/4 h-56 w-56 rounded-full bg-rose-600/30 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-amber-500/20 blur-2xl" />

          {/* Ember Particles Ascending */}
          <div className="absolute inset-0 opacity-80">
            <div className="absolute bottom-4 left-1/4 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-ping" />
            <div className="absolute bottom-8 left-1/2 h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] animate-pulse" />
            <div className="absolute bottom-12 left-3/4 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_14px_#ef4444] animate-ping" />
            <div className="absolute bottom-16 left-1/3 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047] animate-pulse" />
          </div>

          {/* Gold Nordic Rune Border Accent */}
          <div className="absolute inset-0 border border-amber-500/40 shadow-[inset_0_0_20px_rgba(245,158,11,0.25)]" />
        </div>
      )}

      {/* 3. ASTRAL CRYSTAL & MAKO ETHER EFFECT (Final Fantasy / Sci-Fi JRPG) */}
      {activeEffect === "crystal-aura" && (
        <div className="relative h-full w-full">
          {/* Mako Cyan & Crystal Violet Nebula Pulse */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-[#bd0df2]/20 to-cyan-500/10 animate-laser-sweep" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl animate-pulse" />

          {/* Twinkling Crystal Shards & Ether Starlight */}
          <div className="absolute inset-0 opacity-85">
            <div className="absolute top-1/3 left-1/4 h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_15px_#a5f3fc] animate-ping" />
            <div className="absolute top-1/2 left-3/4 h-3 w-3 rounded-full bg-purple-300 shadow-[0_0_18px_#d8b4fe] animate-pulse" />
            <div className="absolute bottom-1/4 left-1/2 h-2 w-2 rounded-full bg-white shadow-[0_0_12px_#ffffff] animate-ping" />
          </div>

          {/* Celestial Holographic Border */}
          <div className="absolute inset-0 border-2 border-cyan-300/50 shadow-[0_0_25px_rgba(103,232,249,0.4)]" />
        </div>
      )}

      {/* 4. COSMIC STARS & NEBULA EFFECT */}
      {activeEffect === "cosmic-stars" && (
        <div className="relative h-full w-full">
          {/* Ambient Cosmic Nebula Pulse */}
          <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-purple-600/25 blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />

          {/* Twinkling Star Particles */}
          <div className="absolute inset-0 opacity-70">
            <div className="absolute top-1/4 left-1/5 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] animate-ping" />
            <div className="absolute top-2/3 left-3/4 h-2 w-2 rounded-full bg-purple-300 shadow-[0_0_10px_#d8b4fe] animate-pulse" />
            <div className="absolute top-1/3 left-2/3 h-1 w-1 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-ping" />
            <div className="absolute top-3/4 left-1/4 h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_#fde68a] animate-pulse" />
          </div>
        </div>
      )}

      {/* 5. SYNTHWAVE NEON GRID EFFECT */}
      {activeEffect === "synthwave-grid" && (
        <div className="relative h-full w-full">
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#bd0df2]/30 via-cyan-500/10 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#bd0df2]/20 to-transparent animate-laser-sweep" />
          <div className="absolute inset-0 border border-[#bd0df2]/40 shadow-[inset_0_0_30px_rgba(189,13,242,0.3)] rounded-inherit" />
        </div>
      )}

      {/* 6. HOLOGRAM SWEEP & MATRIX EFFECT */}
      {activeEffect === "hologram-sweep" && (
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-300/25 to-transparent animate-holo-sweep" />
          <div className="absolute inset-0 border-2 border-cyan-400/30 shadow-[0_0_25px_rgba(34,211,238,0.35)]" />
          <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-amber-400 shadow-[0_0_10px_#facc15]" />
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#bd0df2] shadow-[0_0_10px_#bd0df2]" />
        </div>
      )}

      {/* 7. SAKURA TWILIGHT & MT FUJI EFFECT */}
      {activeEffect === "sakura-twilight" && (
        <div className="relative h-full w-full">
          {/* Subtle Twilight Sunset Horizon Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/15 via-amber-500/10 to-indigo-950/25 animate-pulse" />

          {/* Drifting Sakura Petals & Floating Lantern Embers */}
          <div className="absolute inset-0 opacity-80">
            <div className="absolute top-1/4 left-1/6 h-2 w-2 rounded-full bg-pink-300 shadow-[0_0_10px_#f472b6] animate-ping" />
            <div className="absolute bottom-1/3 left-1/3 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_#fde047] animate-pulse" />
            <div className="absolute top-1/3 right-1/4 h-2 w-2 rounded-full bg-pink-200 shadow-[0_0_12px_#fbcfe8] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_14px_#facc15] animate-ping" />
            <div className="absolute top-1/2 left-2/3 h-1 w-1 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-ping" />
          </div>

          {/* Cherry Blossom & Japanese Gold Border Accent */}
          <div className="absolute inset-0 border border-pink-400/40 shadow-[inset_0_0_25px_rgba(244,114,182,0.25)]" />
        </div>
      )}
    </div>
  );
}
