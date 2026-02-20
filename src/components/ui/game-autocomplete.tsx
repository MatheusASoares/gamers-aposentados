"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Gamepad2 } from "lucide-react";
import { searchGamesIGDB } from "@/app/lib/igdb";
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
                    const data = await searchGamesIGDB(query);
                    setResults(data);
                } catch (error) {
                    console.error(error);
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
        <div ref={wrapperRef} className="relative w-full z-50">
            <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        autoFocus
                        placeholder="Buscar jogo no IGDB..."
                        className="w-full pl-9 pr-4 py-6 bg-zinc-900/80 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-zinc-500 rounded-xl"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                    )}
                </div>
                <button
                    onClick={onCancel}
                    className="p-3 text-zinc-500 hover:text-white transition-colors"
                >
                    Cancelar
                </button>
            </div>

            {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
                    <div className="p-2 flex flex-col gap-1">
                        {results.map((game) => (
                            <button
                                key={game.id}
                                onClick={() => onSelect(game)}
                                className="flex items-center gap-4 w-full p-2 text-left hover:bg-white/5 rounded-lg transition-colors group"
                            >
                                <div className="size-10 md:size-12 rounded bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                                    {game.imageUrl ? (
                                        <img
                                            src={game.imageUrl}
                                            alt={game.nome}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                    ) : (
                                        <Gamepad2 className="h-5 w-5 text-zinc-600" />
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-white font-bold text-sm truncate">{game.nome}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
