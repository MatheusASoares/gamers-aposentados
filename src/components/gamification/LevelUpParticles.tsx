"use client";

import React, { useEffect, useRef } from "react";

interface LevelUpParticlesProps {
  theme?: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRotation: number;
  shape: "circle" | "square" | "diamond" | "streak";
}

export function LevelUpParticles({ theme = "cyberpunk", className = "" }: LevelUpParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cleanTheme = theme.toLowerCase();
    const isMedieval = cleanTheme.includes("medieval");
    const isSpace = cleanTheme.includes("space");
    const isPixel = cleanTheme.includes("pixel");
    const isDarkSouls = cleanTheme.includes("darksouls") || cleanTheme.includes("ascendant") || cleanTheme.includes("souls");

    // Palette per theme
    let colors: string[] = [];
    if (isDarkSouls) {
      colors = ["#ea580c", "#f97316", "#ef4444", "#dc2626", "#d4d4d8", "#f3f4f6", "#71717a", "#451a03"];
    } else if (isMedieval) {
      colors = ["#f59e0b", "#dc2626", "#d97706", "#fbbf24", "#ef4444", "#fef08a"];
    } else if (isSpace) {
      colors = ["#38bdf8", "#fbbf24", "#818cf8", "#c084fc", "#e0f2fe", "#ffffff"];
    } else if (isPixel) {
      colors = ["#22c55e", "#f59e0b", "#06b6d4", "#ec4899", "#a855f7", "#ffffff"];
    } else {
      // Cyberpunk default
      colors = ["#bd0df2", "#06b6d4", "#f43f5e", "#d946ef", "#38bdf8", "#ffffff"];
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const particleCount = isDarkSouls ? 200 : isSpace ? 180 : 150;

    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];

      if (isDarkSouls) {
        // Bonfire intense fiery sparks & turbulent ash flakes
        const angle = (Math.random() - 0.5) * Math.PI * 0.9 - Math.PI / 2; // Upward volcanic cone
        const speed = Math.random() * 9 + 4;
        particles.push({
          x: centerX + (Math.random() - 0.5) * 140,
          y: centerY + (Math.random() - 0.5) * 80,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.007 + 0.003,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.1,
          shape: Math.random() > 0.4 ? "diamond" : "circle",
        });
      } else if (isMedieval) {
        // Campfire rising embers
        particles.push({
          x: centerX + (Math.random() - 0.5) * window.innerWidth * 0.8,
          y: window.innerHeight * 0.75 + Math.random() * 200,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 4 + 2),
          size: Math.random() * 5 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.006 + 0.003,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.05,
          shape: Math.random() > 0.4 ? "circle" : "diamond",
        });
      } else if (isSpace) {
        // Hyperspace warp / starburst
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 3;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 1.5,
          color,
          alpha: 1,
          decay: Math.random() * 0.008 + 0.004,
          rotation: angle,
          vRotation: 0,
          shape: Math.random() > 0.3 ? "streak" : "circle",
        });
      } else if (isPixel) {
        // Chunky 8-bit square confetti
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          size: Math.floor(Math.random() * 6) + 4, // Integer pixel steps
          color,
          alpha: 1,
          decay: Math.random() * 0.007 + 0.003,
          rotation: (Math.floor(Math.random() * 4) * Math.PI) / 2, // 90deg steps
          vRotation: ((Math.random() > 0.5 ? 1 : -1) * Math.PI) / 30,
          shape: "square",
        });
      } else {
        // Cyberpunk neon diamonds and shards
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 3;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: Math.random() * 6 + 3,
          color,
          alpha: 1,
          decay: Math.random() * 0.007 + 0.004,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.1,
          shape: Math.random() > 0.5 ? "diamond" : "square",
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        if (p.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (isDarkSouls) {
          // Intense bonfire sparks and rising ash
          p.x += p.vx + (Math.random() - 0.5) * 1.5;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy -= 0.08; // accelerated buoyant rise
          p.rotation += p.vRotation;
          p.alpha -= p.decay;
        } else if (isMedieval) {
          // Ember rising physics
          p.x += p.vx + Math.sin(p.y * 0.02) * 0.8;
          p.y += p.vy;
          p.alpha -= p.decay;
        } else if (isSpace) {
          // Warp expansion
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 1.01;
          p.vy *= 1.01;
          p.alpha -= p.decay;
        } else if (isPixel) {
          // Arcade gravity
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18; // gravity
          p.rotation += p.vRotation;
          p.alpha -= p.decay;
        } else {
          // Cyberpunk friction & gravity
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy += 0.12;
          p.rotation += p.vRotation;
          p.alpha -= p.decay;
        }

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Theme glow effect
        if (isDarkSouls) {
          ctx.shadowBlur = 16;
          ctx.shadowColor = p.color;
        } else if (isMedieval) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
        } else if (isSpace) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        } else if (isPixel) {
          ctx.shadowBlur = 0; // Crisp pixel edges
        } else {
          ctx.shadowBlur = 14;
          ctx.shadowColor = p.color;
        }

        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.6, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.6, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "streak") {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(-p.size * 4, 0);
          ctx.lineTo(p.size * 4, 0);
          ctx.stroke();
        }

        ctx.restore();
      });

      // Filter out dead particles
      particles = particles.filter((p) => p.alpha > 0);

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-50 h-full w-full ${className}`}
    />
  );
}
