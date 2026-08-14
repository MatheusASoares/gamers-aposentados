// src/components/deals/DealsSearch.tsx

"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import { Search, Loader2, X, Sparkles, Gamepad2 } from "lucide-react";
import { SearchGameItem } from "@/types/deals";
import { cn } from "@/lib/utils";

interface DealsSearchProps {
    onSelectGame: (game: SearchGameItem) => void;
    className?: string;
}

export function DealsSearch({ onSelectGame, className }: DealsSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchGameItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [, startTransition] = useTransition();

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Global keyboard shortcut '/' to focus search input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === "/" &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA"
            ) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search effect
    useEffect(() => {
        if (!query.trim() || query.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/deals/search?q=${encodeURIComponent(query.trim())}`,
                );
                if (res.ok) {
                    const data = await res.json();
                    startTransition(() => {
                        setResults(data.results || []);
                        setIsOpen(true);
                        setSelectedIndex(-1);
                    });
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (game: SearchGameItem) => {
        setIsOpen(false);
        setQuery(game.title);
        onSelectGame(game);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || results.length === 0) {
            if (e.key === "Enter" && query.trim()) {
                onSelectGame({
                    id: query.trim().toLowerCase(),
                    title: query.trim(),
                    slug: query.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                });
                setIsOpen(false);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < results.length) {
                handleSelect(results[selectedIndex]);
            } else if (results.length > 0) {
                handleSelect(results[0]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-theme-primary" />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder="Buscar por nome do jogo para comparar preços..."
                    className="w-full rounded-xl border border-theme/30 bg-zinc-900/80 py-3 pl-11 pr-20 text-sm font-medium text-white placeholder-zinc-500 transition-colors focus:border-theme-primary focus:outline-none"
                />

                <div className="absolute right-3.5 flex items-center gap-1.5">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-theme-primary" />
                    ) : query ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-theme/30 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                            /
                        </kbd>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="glass-card border border-theme bg-zinc-950/95 absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl animate-fade-in-up">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between border-b border-theme/20 mb-1">
                        <span>Jogos Encontrados ({results.length})</span>
                        <span className="text-zinc-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-theme-primary" /> Compare instantâneo
                        </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
                        {results.map((item, idx) => {
                            const isSelected = idx === selectedIndex;
                            return (
                                <button
                                    key={item.id || item.title}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={cn(
                                        "flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                                        isSelected
                                            ? "border border-theme-primary bg-theme-primary/15 text-white theme-glow"
                                            : "border border-transparent text-zinc-300 hover:bg-zinc-900/80 hover:text-white",
                                    )}
                                >
                                    {item.coverImage ? (
                                        <div className="relative h-11 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-theme/30 bg-zinc-900">
                                            <Image
                                                src={item.coverImage}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-theme/30 bg-zinc-900 text-zinc-500">
                                            <Gamepad2 className="h-5 w-5 text-zinc-400" />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-white">
                                            {item.title}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 flex items-center gap-2">
                                            {item.steamAppId ? (
                                                <span className="text-theme-secondary font-semibold">Steam App #{item.steamAppId}</span>
                                            ) : (
                                                <span>Lojas Oficiais</span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="text-[11px] font-bold text-theme-primary opacity-80 group-hover:opacity-100">
                                        Comparar →
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
