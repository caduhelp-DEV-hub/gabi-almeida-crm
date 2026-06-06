import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Gabi Almeida - CRM de Estética Premium',
  description: 'Sistema CRM elegante para clínica de estética com módulos de Dashboard, Agenda, Pacientes e Financeiro.',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased text-on-surface bg-background" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
