'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Flame, Zap, Compass, MessageCircle, ShoppingBag, LayoutGrid } from 'lucide-react';

const FILTERS = [
  { key: '', label: '전체', icon: LayoutGrid },
  { key: 'REGULAR_RUN', label: '정기런', icon: Flame },
  { key: 'FLASH_RUN', label: '번개런', icon: Zap },
  { key: 'COURSE_RECOMMEND', label: '코스추천', icon: Compass },
  { key: 'FREE_TALK', label: '자유수다', icon: MessageCircle },
  { key: 'GEAR_REVIEW', label: '장비리뷰', icon: ShoppingBag },
];

export function PostFilters() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
      {FILTERS.map(f => {
        const active = currentCategory === f.key;
        const Icon = f.icon;
        return (
          <Link
            key={f.key}
            href={f.key ? `/?category=${f.key}` : '/'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              active
                ? 'bg-zinc-100 text-zinc-950 shadow-sm font-semibold'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span>{f.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
