import React from 'react';
import { Game } from '@/types/game';

interface GameCardProps {
    game: Game;
}

export function GameCard({ game }: GameCardProps) {
    const statusColors = {
        SUGGESTED: 'bg-gray-200 text-gray-700',
        ACTIVE: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-green-100 text-green-800',
        DROPPED: 'bg-red-100 text-red-800',
    };

    return (
    // Card Container com Tailwind
    // border, rounded-lg, shadow-sm: Estética básica
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
      
      {/* Header do Card: Título e Badge de Status */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-1" title={game.title}>
          {game.title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[game.status]}`}>
          {game.status}
        </span>
      </div>

      {/* Meta Infos */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <span className="font-semibold">Indicado por:</span> {game.nominatedBy}
        </p>
        <p>
          <span className="font-semibold">Tipo:</span> {game.questType === 'MAIN_QUEST' ? '🛡️ Main Quest' : '⚔️ Side Quest'}
        </p>
        
        {/* Renderização Condicional: Só mostra HLTB se existir */}
        {game.hltbTime && (
          <p>
            <span className="font-semibold">Tempo:</span> ~{game.hltbTime}h
          </p>
        )}
      </div>
    </div>
  );
}
