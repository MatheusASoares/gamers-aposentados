"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { GuildRewardItem } from "@/lib/constants/guild-rewards";

interface GuildMascotCompanionProps {
  mascot: GuildRewardItem | null;
  guildLevel: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  bubblePosition?: "top" | "left";
  animated?: boolean;
}

export function GuildMascotCompanion({
  mascot,
  guildLevel,
  className,
  size = "md",
  interactive = true,
  bubblePosition = "top",
  animated = true,
}: GuildMascotCompanionProps) {
  const [isJumping, setIsJumping] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [hasImageError, setHasImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fallbackPhrases = [
    "Miau! O backlog da Steam nunca dorme, humano!",
    "Acorda, Samurai! Temos um jogo pra zerar!",
    "Ronrom... Esse esquadrão é lendário!",
    "Scanner detectou 100% de carisma nesta guilda!",
    "Pronto para a próxima Quest!",
  ];

  const phrases = mascot?.phrases && mascot.phrases.length > 0 ? mascot.phrases : fallbackPhrases;

  // Gentle Cyber Meow Beep Audio via Web Audio API (zero external assets needed)
  const playCyberSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio context silently handled
    }
  };

  // Parallax Mouse 3D Tilt
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      setMouseOffset({
        x: Math.max(-1, Math.min(1, deltaX)),
        y: Math.max(-1, Math.min(1, deltaY)),
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || isJumping) return;

    setIsJumping(true);
    playCyberSound();

    // Pick next speech phrase
    const nextPhrase = phrases[phraseIndex % phrases.length];
    setPhraseIndex((prev) => prev + 1);
    setSpeechBubble(nextPhrase);

    // Spawn floating heart particles
    const newHeart = {
      id: Date.now(),
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 20,
    };
    setHearts((prev) => [...prev.slice(-3), newHeart]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSpeechBubble(null);
    }, 4500);

    setTimeout(() => {
      setIsJumping(false);
    }, 650);
  };

  if (!mascot || !mascot.assetUrl) {
    return null;
  }

  const dimensions = {
    sm: "h-20 w-20 sm:h-28 sm:w-28",
    md: "h-24 w-24 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-52 lg:w-52",
    lg: "h-36 w-36 sm:h-48 sm:w-48 lg:h-64 lg:w-64",
    xl: "h-48 w-48 sm:h-60 sm:w-60 lg:h-72 lg:w-72",
  }[size];

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-center select-none", className)}
    >
      {/* 1. Holographic Speech Bubble Popup */}
      {speechBubble && (
        bubblePosition === "left" ? (
          <div className="absolute right-[102%] sm:right-[105%] top-0 sm:top-4 z-50 flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-theme bg-zinc-950/95 px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs md:text-sm font-black text-white shadow-[0_0_30px_var(--theme-glow)] backdrop-blur-xl w-max max-w-[170px] sm:max-w-[260px] text-left leading-tight animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-theme-primary shrink-0 animate-spin-slow" />
            <span>{speechBubble}</span>
            {/* Holographic pointer pointing right */}
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 border-r border-t border-theme bg-zinc-950" />
          </div>
        ) : (
          <div className="absolute -top-14 sm:-top-16 z-50 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-theme bg-zinc-950/95 px-3 py-2 sm:px-4 sm:py-2 text-[11px] sm:text-xs md:text-sm font-black text-white shadow-[0_0_30px_var(--theme-glow)] backdrop-blur-xl w-max max-w-[200px] sm:max-w-[280px] text-center leading-tight animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-theme-primary shrink-0 animate-spin-slow" />
            <span>{speechBubble}</span>
            {/* Holographic pointer pointing down */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b border-theme bg-zinc-950" />
          </div>
        )
      )}

      {/* Floating Hearts Sparks on Poke */}
      {hearts.map((h) => (
        <div
          key={h.id}
          className="pointer-events-none absolute top-2 z-40 animate-float-up text-theme-primary"
          style={{ transform: `translate(${h.x}px, ${h.y}px)` }}
        >
          <Heart className="h-5 w-5 fill-[var(--theme-primary)] drop-shadow-[0_0_10px_var(--theme-glow)]" />
        </div>
      ))}

      {/* 2. Outer Parallax Wrapper (Mouse 3D Tilt) */}
      <div
        style={{
          transform: `perspective(600px) rotateY(${mouseOffset.x * 16}deg) rotateX(${mouseOffset.y * -10}deg)`,
          transformStyle: "preserve-3d",
        }}
        className="transition-transform duration-150 ease-out flex flex-col items-center"
      >
        {/* 3. Physics & Floating Layer (Continuous Float when animated) */}
        <div
          className={cn(
            "relative flex items-center justify-center",
            animated ? (isJumping ? "animate-mascot-jump" : "animate-mascot-idle") : ""
          )}
        >
          {/* Ambient Glow Aura */}
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[var(--theme-primary)]/20 blur-xl animate-pulse" />

          {/* Clickable Mascot Body */}
          <div
            onClick={handlePoke}
            title={interactive ? "Clique para interagir com o mascote!" : undefined}
            className={cn(
              "group relative transition-transform duration-200",
              interactive ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default",
              dimensions
            )}
          >
            {/* Animated Mascot (Transparent WebM Video or Static PNG) */}
            {!hasImageError ? (
              (() => {
                const baseAssetPath = mascot.assetUrl
                  ? mascot.assetUrl.replace(/\.(webm|mp4|png|webp)$/i, "")
                  : "/assets/guild/mascots/kuro-bot";
                const videoWebmSrc = `${baseAssetPath}.webm`;
                const videoMp4Src = `${baseAssetPath}.mp4`;
                const imagePngSrc = `${baseAssetPath}.png`;

                if (animated) {
                  return (
                    <video
                      key={`mascot-video-${mascot.id}-${videoWebmSrc}`}
                      src={videoWebmSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] filter transition-all duration-300 group-hover:drop-shadow-[0_0_25px_var(--theme-primary)]"
                    >
                      <source src={videoWebmSrc} type="video/webm" />
                      <source src={videoMp4Src} type="video/mp4" />
                    </video>
                  );
                }

                return (
                  <Image
                    key={`mascot-img-${mascot.id}-${imagePngSrc}`}
                    src={imagePngSrc}
                    alt={mascot.name}
                    fill
                    priority
                    unoptimized
                    onError={() => setHasImageError(true)}
                    sizes="320px"
                    className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] filter transition-all duration-300 group-hover:drop-shadow-[0_0_22px_var(--theme-primary)]"
                  />
                );
              })()
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl border border-theme bg-zinc-950/80 p-3 text-theme-primary shadow-[0_0_20px_var(--theme-glow)]">
                <Sparkles className="h-10 w-10 animate-pulse text-theme-primary" />
              </div>
            )}
          </div>
        </div>

        {/* 4. Ambient Neon Radial Glow Base (100% borderless, NO black line!) */}
        <div
          className={cn(
            "mx-auto rounded-full bg-gradient-to-r from-transparent via-[var(--theme-primary)]/30 to-transparent blur-sm pointer-events-none transition-all duration-300",
            size === "sm" ? "h-2 w-14 mt-1" : size === "md" ? "h-2.5 w-24 mt-1.5" : size === "lg" ? "h-3 w-32 mt-2" : "h-3.5 w-40 mt-2.5",
            isJumping ? "scale-50 opacity-20" : "animate-mascot-shadow"
          )}
        />
      </div>
    </div>
  );
}
