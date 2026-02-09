// src/types/game.ts

// Usamos 'type' para uniões fixas (Enum-like)
// Baseado no Roadmap: Status de seleção e progresso [cite: 12, 13]
export type GameStatus = 'SUGGESTED' | 'ACTIVE' | 'COMPLETED' | 'DROPPED';

// Baseado nas Regras: Side Quest vs Main Quest [cite: 16, 23]
export type QuestType = 'MAIN_QUEST' | 'SIDE_QUEST';

// Criamos uma entidade separada para representar quem joga
export interface Player {
  id: string;
  name: string; // "Gui", "Padrinho", "Novo Jogador"
  role: 'ADMIN' | 'MEMBER'; // Permissões, se necessário
}
// Interface: Usamos interfaces para objetos que podem ser estendidos futuramente.
// Clean Code: Aberto para extensão, fechado para modificação (Open/Closed Principle).
export interface Game {
  id: string;
  title: string;
  coverUrl: string; // Capa do jogo [cite: 9]
  
  // Regra: Side Quest tem limite de 10h (HLTB) [cite: 21]
  hltbTime?: number; 
  
  status: GameStatus;
  questType: QuestType;
  
  // Quem indicou o jogo? Input (Você) ou Input (Padrinho) [cite: 19, 20]
  nominatedBy: string; // Player ID
  
  createdAt: Date;
  completedAt?: Date;
}

// O "Pote" do mês ou da Main Quest
export interface GamePool {
  month: number; // 1-12
  year: number;  // 2026
  type: QuestType;
  games: Game[]; // Array de jogos (6 p/ Side, 4 p/ Main) [cite: 18, 25]
}