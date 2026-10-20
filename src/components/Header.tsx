import Link from 'next/link';
import { AuthButton } from './AuthButton';
import { PlusCircle, Shield, Flame, Activity } from 'lucide-react';
import type { Profile } from '@/types/database';

interface HeaderProps {
  user: Profile | null;
}

export function Header({ user }: HeaderProps) {
  const isAdmin = user?.role === 'admin' && user?.status === 'approved';
  const isApproved = user?.status === 'approved';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-background/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-volt group-hover:border-volt/50 transition-colors">
              <Activity className="w-4 h-4 text-volt" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tighter text-zinc-100 flex items-center gap-1.5 leading-none">
                PACE CRU
                <span className="w-1.5 h-1.5 rounded-full bg-volt inline-block animate-pulse"></span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mt-0.5">
                Urban Running Club
              </span>
            </div>
          </Link>

          {/* Quick Nav */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-800 text-xs font-medium text-zinc-400">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
            >
              전체 피드
            </Link>
            <Link
              href="/?category=REGULAR_RUN"
              className="px-3 py-1.5 rounded-lg hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-blaze" /> 정기런
            </Link>
            <Link
              href="/?category=FLASH_RUN"
              className="px-3 py-1.5 rounded-lg hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
            >
              번개런
            </Link>
          </nav>
        </div>

        {/* Right CTA & Auth */}
        <div className="flex items-center gap-3">
          {/* Admin Management Link */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-volt/10 hover:bg-volt/20 text-volt border border-volt/30 text-xs font-bold tracking-tight transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>관리자 승인 센터</span>
            </Link>
          )}

          {/* New Post Button */}
          {isApproved && (
            <Link
              href="/posts/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-volt" />
              <span>러닝 등록/글쓰기</span>
            </Link>
          )}

          <AuthButton user={user} />
        </div>
      </div>
    </header>
  );
}
