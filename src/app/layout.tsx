import type { ReactNode } from 'react';
import './globals.css';
import UserMenu from '@/components/auth/user-menu';

export const metadata = {
  title: 'Gamers Aposentados',
  description: 'A comunidade de gamers aposentados'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <header className="border-b p-4 flex justify-between items-center container mx-auto">
          <h1 className="text-xl font-bold">Gamers Aposentados</h1>
          <UserMenu />
        </header>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
