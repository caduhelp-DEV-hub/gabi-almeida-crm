import type {Metadata, Viewport} from 'next';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Gabi Almeida - Sistema de Estética Premium',
  description: 'Sistema elegante para clínica de estética com módulos de Dashboard, Agenda, Pacientes e Financeiro.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#79542e',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap" rel="stylesheet" />
      </head>
      <body className={`${jakarta.variable} ${manrope.variable} font-sans antialiased text-on-surface bg-background`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
