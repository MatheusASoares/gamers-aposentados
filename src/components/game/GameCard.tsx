// src/components/game/GameCard.tsx
import React from 'react';
import { Game } from '@/types/game';
// Importamos os componentes "craftados" pelo shadcn
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  // Mapeamento de cores para o Badge do shadcn
  // O shadcn usa variantes: 'default', 'secondary', 'destructive', 'outline'
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';      // Preto/Escuro
      case 'COMPLETED': return 'secondary'; // Cinza claro/Verde (se customizar)
      case 'DROPPED': return 'destructive'; // Vermelho
      default: return 'outline';            // Borda simples
    }
  };

  return (
    // O componente Card substitui a div com borda
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold truncate pr-2" title={game.title}>
          {game.title}
        </CardTitle>
        <Badge variant={getBadgeVariant(game.status)}>
          {game.status}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span>Indicado por:</span>
            <span className="font-medium text-foreground">{game.nominatedBy}</span>
          </div>

          <Separator /> {/* Uma linha divisória elegante */}

          <div className="flex justify-between">
            <span>Tipo:</span>
            <span>{game.questType === 'MAIN_QUEST' ? '🛡️ Main' : '⚔️ Side'}</span>
          </div>

          {game.hltbTime && (
            <div className="flex justify-between">
              <span>Tempo:</span>
              <span>~{game.hltbTime}h</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}