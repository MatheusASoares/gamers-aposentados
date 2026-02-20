import { Metadata } from 'next';
import { RandomizerClient } from '@/components/game/RandomizerClient';

export const metadata: Metadata = {
    title: 'Randomizer | Gamers Aposentados',
    description: 'Sorteie o próximo jogo da sua backlog',
};

export default function RandomizerPage() {
    return (
        <main className="w-full">
            <div className="max-w-7xl mx-auto py-8">
                <RandomizerClient />
            </div>
        </main>
    );
}
