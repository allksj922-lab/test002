import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { PostCard } from '@/components/PostCard';
import { PostFilters } from '@/components/PostFilters';
import { PendingBanner } from '@/components/PendingBanner';
import { PlusCircle, Flame, Calendar, Trophy, Footprints, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { Post } from '@/types/database';

export const revalidate = 0; // Dynamic

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams?.category;
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  // Fetch posts with author and participants
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*),
      participants:run_participants(*, user:profiles(*))
    `)
    .order('created_at', { ascending: false });

  if (currentCategory) {
    query = query.eq('category', currentCategory);
  }

  const { data: posts, error } = await query;

  // Stats
  const { count: memberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: runCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .in('category', ['REGULAR_RUN', 'FLASH_RUN']);

  const isApproved = currentUser?.status === 'approved';

  return (
    <div>
      <PendingBanner user={currentUser} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Editorial Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-surface border border-zinc-800 p-6 sm:p-10 mb-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-volt/5 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-volt/10 border border-volt/20 text-volt text-xs font-mono font-bold uppercase tracking-wider mb-4">
              <Footprints className="w-3.5 h-3.5" />
              <span>PACE CRU • EVERY TUESDAY & SATURDAY</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
              도심을 질주하는 <br className="hidden sm:inline" />
              <span className="text-volt underline decoration-volt/40 underline-offset-8">
                러너들의 프라이빗 아지트
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed font-sans">
              구글 계정으로 로그인하고 크루 관리자의 승인을 받아보세요. 
              정기 세션, 번개런 참가부터 코스 추천까지 오직 승인된 러너들과 함께 기록을 채워갑니다.
            </p>

            {/* Quick Metrics Bar */}
            <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center gap-8 text-xs font-mono">
              <div>
                <span className="text-zinc-500 uppercase text-[10px] block">공식 승인 러너</span>
                <span className="text-xl sm:text-2xl font-black text-zinc-100">{memberCount || 1}명</span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <span className="text-zinc-500 uppercase text-[10px] block">완료된 러닝 세션</span>
                <span className="text-xl sm:text-2xl font-black text-volt">{runCount || 0}회</span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <span className="text-zinc-500 uppercase text-[10px] block">메인 집결지</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-300">여의도 한강공원</span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <PostFilters />

          {isApproved ? (
            <Link
              href="/posts/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-volt hover:bg-volt-hover text-zinc-950 text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>새 게시글 / 러닝 등록</span>
            </Link>
          ) : (
            <div className="text-xs text-zinc-500 flex items-center gap-1.5 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>글쓰기는 승인된 멤버만 가능합니다</span>
            </div>
          )}
        </div>

        {/* Post List */}
        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post: Post) => (
              <PostCard key={post.id} post={post} currentUser={currentUser} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-950/40">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto mb-3">
              <Flame className="w-6 h-6 text-zinc-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-200">등록된 게시글이 없습니다</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              선택한 카테고리에 등록된 러닝이나 소식이 없습니다. 첫 번째 러닝을 주최해보세요!
            </p>
            {isApproved && (
              <Link
                href="/posts/new"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-volt" />
                <span>새 러닝 등록하기</span>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
