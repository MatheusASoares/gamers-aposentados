import { GameCard } from '@/components/game/GameCard';
import { Game } from '@/types/game';

const mapDbToGame = (db: any): Game => ({
  id: db.id,
  title: db.title,
  coverUrl: db.cover_url ?? '',
  status: db.status,
  questType: db.quest_type,
  nominatedBy: db.nominator?.display_name ?? db.nominated_by_id ?? null,
  hltbTime: db.hltb_time ?? null,
  createdAt: db.created_at ? new Date(db.created_at) : new Date(),
  completedAt: db.end_date ? new Date(db.end_date) : undefined,
});

export default async function Home() {
  let games: Game[] = [];

  try {
    const res = await fetch('/api/games');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) games = data.map(mapDbToGame);
    }
  } catch (err) {
    // keep empty list on error
    console.error('Failed to fetch games:', err);
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Gamers Aposentados 🎮</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Jogos</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {games.length === 0 ? (
            <p className="text-gray-600">Nenhum jogo disponível.</p>
          ) : (
            games.map((g) => <GameCard key={g.id} game={g} />)
          )}
        </div>
      </section>
    </main>
  );
}