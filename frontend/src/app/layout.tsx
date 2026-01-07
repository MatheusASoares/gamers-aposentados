import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Gamers Aposentados',
  description: 'A comunidade de gamers aposentados'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
