"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkles, Zap, Leaf, Beer, Flame, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GuildRewardItem, MascotThemeConfig } from "@/lib/constants/guild-rewards";

interface GuildMascotCompanionProps {
  mascot: GuildRewardItem | null;
  guildLevel: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  bubblePosition?: "top" | "left";
  animated?: boolean;
}

function MascotSpeechIcon({
  iconName,
  accentColor,
}: {
  iconName?: string;
  accentColor?: string;
}) {
  const iconProps = {
    className: cn("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform", accentColor),
  };

  switch (iconName) {
    case "Zap":
      return <Zap {...iconProps} className={cn(iconProps.className, "animate-pulse")} />;
    case "Leaf":
      return <Leaf {...iconProps} className={cn(iconProps.className, "animate-bounce")} />;
    case "Beer":
      return <Beer {...iconProps} className={cn(iconProps.className, "animate-pulse")} />;
    case "Flame":
      return <Flame {...iconProps} className={cn(iconProps.className, "animate-pulse")} />;
    case "Crown":
      return <Crown {...iconProps} className={cn(iconProps.className, "animate-bounce")} />;
    case "Sparkles":
    default:
      return <Sparkles {...iconProps} className={cn(iconProps.className, "animate-spin-slow")} />;
  }
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
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [hasImageError, setHasImageError] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHasImageError(false);
    setHasVideoError(false);
  }, [mascot?.id]);

  const defaultTheme: MascotThemeConfig = {
    borderColor: "border-[#bd0df2]/70",
    glowColor: "rgba(189, 13, 242, 0.45)",
    textColor: "text-white",
    pointerBorder: "border-[#bd0df2]/70",
    iconName: "Sparkles",
    accentColor: "text-[#bd0df2]",
  };

  const theme = mascot?.mascotTheme || defaultTheme;

  const fallbackPhrases = [
    "Miau! O backlog da Steam nunca dorme, humano!",
    "Acorda, Samurai! Temos um jogo pra zerar!",
    "Ronrom... Esse esquadrão é lendário!",
    "Scanner detectou 100% de carisma nesta guilda!",
    "Pronto para a próxima Quest!",
  ];

  const phrases = mascot?.phrases && mascot.phrases.length > 0 ? mascot.phrases : fallbackPhrases;

  // Personalized Cyber/Organic Sound Effect via Web Audio API
  const playMascotSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const icon = theme.iconName;
      if (icon === "Flame") {
        // Alduin dragon low fiery rumble
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      } else if (icon === "Leaf") {
        // Korok playful wooden pop
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      } else if (icon === "Beer") {
        // Palico cheerful meow chirp
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      } else if (icon === "Sparkles") {
        // Chocobo high kweh chirp
        osc.type = "sine";
        osc.frequency.setValueAtTime(750, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1450, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      } else if (icon === "Crown") {
        // Luna royal joyful boop
        osc.type = "sine";
        osc.frequency.setValueAtTime(340, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      } else {
        // 808 cyber pulse
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
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
    if (!interactive) return;

    playMascotSound();

    // Pick next speech phrase
    const nextPhrase = phrases[phraseIndex % phrases.length];
    setPhraseIndex((prev) => prev + 1);
    setSpeechBubble(nextPhrase);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSpeechBubble(null);
    }, 4500);
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
          <div
            style={{
              boxShadow: `0 0 25px ${theme.glowColor}, inset 0 0 12px ${theme.glowColor}`,
            }}
            className={cn(
              "absolute right-[102%] sm:right-[105%] top-0 sm:top-2 z-50 flex items-start sm:items-center gap-1.5 sm:gap-2.5 rounded-2xl border bg-zinc-950/95 px-3.5 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs md:text-sm font-bold backdrop-blur-xl w-max max-w-[190px] sm:max-w-[300px] text-left leading-snug animate-fade-in",
              theme.borderColor,
              theme.textColor
            )}
          >
            <MascotSpeechIcon iconName={theme.iconName} accentColor={theme.accentColor} />
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{speechBubble}</span>
            {/* Holographic pointer pointing right */}
            <div
              className={cn(
                "absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 border-r border-t bg-zinc-950",
                theme.pointerBorder
              )}
            />
          </div>
        ) : (
          <div
            style={{
              boxShadow: `0 0 25px ${theme.glowColor}, inset 0 0 12px ${theme.glowColor}`,
            }}
            className={cn(
              "absolute -top-16 sm:-top-20 z-50 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2.5 rounded-2xl border bg-zinc-950/95 px-3.5 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs md:text-sm font-bold backdrop-blur-xl w-max max-w-[220px] sm:max-w-[320px] text-center leading-snug animate-fade-in",
              theme.borderColor,
              theme.textColor
            )}
          >
            <MascotSpeechIcon iconName={theme.iconName} accentColor={theme.accentColor} />
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{speechBubble}</span>
            {/* Holographic pointer pointing down */}
            <div
              className={cn(
                "absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b bg-zinc-950",
                theme.pointerBorder
              )}
            />
          </div>
        )
      )}



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
            animated ? "animate-mascot-idle" : ""
          )}
        >
          {/* Ambient Glow Aura */}
          <div
            style={{ backgroundColor: theme.glowColor }}
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 rounded-full opacity-35 blur-xl",
              animated ? "animate-pulse" : ""
            )}
          />

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

                if (animated && !hasVideoError) {
                  return (
                    <video
                      key={`mascot-video-${mascot.id}-${videoWebmSrc}`}
                      src={videoWebmSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      onError={() => setHasVideoError(true)}
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
          style={{
            background: `radial-gradient(ellipse at center, ${theme.glowColor} 0%, transparent 70%)`,
          }}
          className={cn(
            "mx-auto rounded-full blur-sm pointer-events-none transition-all duration-300 opacity-70",
            size === "sm" ? "h-2 w-14 mt-1" : size === "md" ? "h-2.5 w-24 mt-1.5" : size === "lg" ? "h-3 w-32 mt-2" : "h-3.5 w-40 mt-2.5",
            animated ? "animate-mascot-shadow" : ""
          )}
        />
      </div>
    </div>
  );
}
