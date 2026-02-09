import { GameCard } from '@/components/game/GameCard';
import { Game } from '@/types/game';


export default function Home() {
  // MOCK DATA: Dados simulados para visualizar a UI sem backend.
  // Isso permite que o Frontend trabalhe independente do Backend.
  const mockGame: Game = {
    id: '1',
    title: 'Mad Max',
    coverUrl: 'https://exemplo.com/capa.jpg',
    status: 'ACTIVE',
    questType: 'MAIN_QUEST',
    nominatedBy: 'Lucas', // Testando sua string flexível
    hltbTime: 20,
    createdAt: new Date(),
  };

  const mockSideQuest: Game = {
    id: '2',
    title: 'Streets of Rage 4',
    coverUrl: '',
    status: 'SUGGESTED',
    questType: 'SIDE_QUEST',
    nominatedBy: 'Matheus',
    hltbTime: 3,
    createdAt: new Date(),
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Gamers Aposentados 🎮
      </h1>



      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Test Area</h2>

        {/* Grid System: 1 coluna no mobile, 3 no desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GameCard game={mockGame} />
          <GameCard game={mockSideQuest} />
        </div>
      </section>
    </main>
  );
}