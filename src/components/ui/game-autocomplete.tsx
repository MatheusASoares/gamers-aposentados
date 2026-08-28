"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Gamepad2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export interface GameSearchResult {
    id: string;
    nome: string;
    imageUrl: string;
    tempoMainStory?: number;
    tempoCompletionist?: number;
}

interface GameAutocompleteProps {
    onSelect: (game: GameSearchResult) => void;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function GameAutocomplete({
    onSelect,
    onCancel,
    placeholder = "Buscar jogo no IGDB...",
    autoFocus = false,
}: GameAutocompleteProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GameSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.trim().length > 2) {
                setIsLoading(true);
                try {
                    const response = await fetch("/api/igdb", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query: query.trim() }),
                    });
                    if (!response.ok) {
                        setResults([]);
                        setIsOpen(false);
                        return;
                    }
                    const data = await response.json();
                    const list = Array.isArray(data) ? data : [];
                    setResults(list);
                    setIsOpen(list.length > 0);
                } catch (error) {
                    console.error("IGDB Route fetch error:", error);
                    setResults([]);
                    setIsOpen(false);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (game: GameSearchResult) => {
        setIsOpen(false);
        setResults([]);
        setQuery("");
        onSelect(game);
    };

    const handleCancel = () => {
        setIsOpen(false);
        setResults([]);
        setQuery("");
        onCancel?.();
    };

    // Armazena a callback em um ref para evitar re-binding do listener de clique
    const handleCancelRef = useRef(handleCancel);
    useEffect(() => {
        handleCancelRef.current = handleCancel;
    });

    // Handle click outside & escape key
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (onCancel) {
                    handleCancelRef.current();
                }
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
                handleCancelRef.current();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onCancel]);

    return (
        <div ref={wrapperRef} className="relative z-50 w-full">
            <div className="flex w-full items-center gap-2">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        autoFocus={autoFocus}
                        aria-label="Buscar jogo no banco de dados IGDB"
                        placeholder={placeholder}
                        className="focus-visible:ring-primary focus-visible:border-primary w-full rounded-xl border-white/10 bg-zinc-900/80 py-6 pr-10 pl-9 text-white placeholder:text-zinc-500"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (e.target.value.trim().length > 2 && results.length > 0) {
                                setIsOpen(true);
                            }
                        }}
                        onFocus={() => {
                            if (results.length > 0) {
                                setIsOpen(true);
                            }
                        }}
                    />
                    {isLoading ? (
                        <Loader2 className="text-primary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
                    ) : query.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setResults([]);
                                setIsOpen(false);
                            }}
                            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:text-white"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>
                {onCancel && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-3 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-white"
                    >
                        Cancelar
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="custom-scrollbar absolute top-full right-0 left-0 z-50 mt-2 max-h-60 sm:max-h-80 overflow-hidden overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex flex-col gap-1 p-2">
                        {results.map((game) => (
                            <button
                                key={game.id}
                                type="button"
                                onClick={() => handleSelect(game)}
                                className="group flex w-full items-center gap-3 sm:gap-4 rounded-lg p-2 text-left transition-colors hover:bg-white/10 active:bg-white/15"
                            >
                                <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-800 md:size-12 border border-white/5">
                                    {game.imageUrl ? (
                                        <Image
                                            src={game.imageUrl}
                                            alt={game.nome}
                                            fill
                                            unoptimized
                                            className="object-cover transition-transform group-hover:scale-110"
                                        />
                                    ) : (
                                        <Gamepad2 className="h-5 w-5 text-zinc-600" />
                                    )}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-bold text-white group-hover:text-primary transition-colors">
                                        {game.nome}
                                    </span>
                                    {(game.tempoMainStory || game.tempoCompletionist) && (
                                        <span className="text-[11px] text-zinc-500 font-mono">
                                            {game.tempoMainStory ? `${game.tempoMainStory}h main` : ""}
                                            {game.tempoMainStory && game.tempoCompletionist ? " • " : ""}
                                            {game.tempoCompletionist ? `${game.tempoCompletionist}h 100%` : ""}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
