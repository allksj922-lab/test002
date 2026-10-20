import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'PACE CRU — Urban Running Club',
  description: '도심 러너들을 위한 프라이빗 러닝 크루 커뮤니티 & 정기런 아지트',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-background text-zinc-100 antialiased selection:bg-volt selection:text-zinc-950 flex flex-col font-sans">
        <Header user={currentUser} />
        <div className="flex-1">
          {children}
        </div>
        <footer className="mt-20 border-t border-zinc-800/80 bg-zinc-950 py-10 text-xs text-zinc-500">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-300 font-mono">PACE CRU</span>
              <span className="text-zinc-700">|</span>
              <span>EST. 2026 • SEOUL URBAN RUNNERS</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-600">
              POWERED BY SUPABASE AUTH & VERCEL
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
