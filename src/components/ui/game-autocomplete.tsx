"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Gamepad2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface GameSearchResult {
    id: string;
    nome: string;
    imageUrl: string;
    tempoMainStory?: number;
    tempoCompletionist?: number;
}

interface GameAutocompleteProps {
    onSelect: (game: GameSearchResult) => void;
    onCancel: () => void;
}

export function GameAutocomplete({ onSelect, onCancel }: GameAutocompleteProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GameSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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
                    if (!response.ok) throw new Error("API Route Failed");
                    const data = await response.json();
                    setResults(data);
                } catch (error) {
                    console.error("IGDB Route fetch error:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Handle click outside to close (or cancel)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                onCancel();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onCancel]);

    return (
        <div ref={wrapperRef} className="relative z-50 w-full">
            <div className="flex w-full items-center gap-2">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        autoFocus
                        placeholder="Buscar jogo no IGDB..."
                        className="focus-visible:ring-primary focus-visible:border-primary w-full rounded-xl border-white/10 bg-zinc-900/80 py-6 pr-4 pl-9 text-white placeholder:text-zinc-500"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {isLoading && (
                        <Loader2 className="text-primary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
                    )}
                </div>
                <button
                    onClick={onCancel}
                    className="p-3 text-zinc-500 transition-colors hover:text-white"
                >
                    Cancelar
                </button>
            </div>

            {results.length > 0 && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-80 overflow-hidden overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
                    <div className="flex flex-col gap-1 p-2">
                        {results.map((game) => (
                            <button
                                key={game.id}
                                onClick={() => onSelect(game)}
                                className="group flex w-full items-center gap-4 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-800 md:size-12">
                                    {game.imageUrl ? (
                                        <img
                                            src={game.imageUrl}
                                            alt={game.nome}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        />
                                    ) : (
                                        <Gamepad2 className="h-5 w-5 text-zinc-600" />
                                    )}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-bold text-white">
                                        {game.nome}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
