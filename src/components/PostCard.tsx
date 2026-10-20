'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, 
  MapPin, 
  Gauge, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Trash2,
  Share2
} from 'lucide-react';
import type { Post, Profile } from '@/types/database';

interface PostCardProps {
  post: Post;
  currentUser: Profile | null;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  NOTICE: { label: '공지사항', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' },
  REGULAR_RUN: { label: '정기런', color: 'bg-volt/15 text-volt border-volt/30' },
  FLASH_RUN: { label: '번개런', color: 'bg-blaze/15 text-blaze border-blaze/30' },
  COURSE_RECOMMEND: { label: '코스추천', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  FREE_TALK: { label: '자유수다', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  GEAR_REVIEW: { label: '장비리뷰', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
};

export function PostCard({ post, currentUser }: PostCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [participants, setParticipants] = useState(post.participants || []);
  const [joining, setJoining] = useState(false);

  const isApproved = currentUser?.status === 'approved';
  const isAdmin = currentUser?.role === 'admin' && isApproved;
  const isAuthor = currentUser?.id === post.author_id;
  const canDelete = isAuthor || isAdmin;

  const isParticipating = currentUser 
    ? participants.some(p => p.user_id === currentUser.id)
    : false;

  const isRunEvent = post.category === 'REGULAR_RUN' || post.category === 'FLASH_RUN';
  const maxCount = post.max_participants || 20;
  const isFull = participants.length >= maxCount;

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert('참가 신청을 위해 구글 로그인이 필요합니다.');
      return;
    }
    if (!isApproved) {
      alert('크루 관리자의 승인 완료 후 참가 신청할 수 있습니다.');
      return;
    }

    try {
      setJoining(true);
      if (isParticipating) {
        // Cancel
        const { error } = await supabase
          .from('run_participants')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        setParticipants(prev => prev.filter(p => p.user_id !== currentUser.id));
      } else {
        // Join
        if (isFull) {
          alert('정원이 마감되었습니다.');
          return;
        }
        const { data, error } = await supabase
          .from('run_participants')
          .insert({
            post_id: post.id,
            user_id: currentUser.id,
          })
          .select('*, user:profiles(*)')
          .single();

        if (error) throw error;
        setParticipants(prev => [...prev, data]);
      }
    } catch (err: any) {
      alert(`신청 처리 실패: ${err.message}`);
    } finally {
      setJoining(false);
    }
  };

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });

  const cat = CATEGORY_MAP[post.category] || { label: post.category, color: 'bg-zinc-800 text-zinc-300' };

  return (
    <article className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/40">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${cat.color}`}>
            {cat.label}
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            {formattedDate}
          </span>
        </div>

        {canDelete && (
          <button
            onClick={handleDeletePost}
            className="text-zinc-400 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-colors"
            title="게시글 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <Link href={`/posts/${post.id}`} className="block">
        <h3 className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-volt transition-colors line-clamp-1">
          {post.title}
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
          {post.content}
        </p>
      </Link>

      {/* Running Metric Grid if it's a Run Event */}
      {isRunEvent && (
        <div className="mt-4 p-3.5 rounded-xl bg-surface border border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {post.run_date && (
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-volt" /> 러닝일시
              </span>
              <span className="mt-0.5 font-medium text-zinc-200">
                {new Date(post.run_date).toLocaleDateString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {post.location && (
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blaze" /> 집결지
              </span>
              <span className="mt-0.5 font-medium text-zinc-200 truncate" title={post.location}>
                {post.location}
              </span>
            </div>
          )}

          {post.distance_km && (
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-volt" /> 거리 / 페이스
              </span>
              <span className="mt-0.5 font-mono font-semibold text-zinc-100">
                {post.distance_km} KM {post.pace ? `(${post.pace})` : ''}
              </span>
            </div>
          )}

          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase font-mono text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1"><Users className="w-3 h-3 text-zinc-400" /> 인원</span>
              <span className="font-mono text-zinc-200">{participants.length} / {maxCount}명</span>
            </span>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? 'bg-rose-500' : 'bg-volt'
                }`}
                style={{ width: `${Math.min(100, (participants.length / maxCount) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-300">
              {(post.author?.full_name || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="text-xs text-zinc-400 font-medium">
            {post.author?.full_name || '크루 멤버'}
          </span>
          {post.author?.role === 'admin' && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-volt/10 text-volt border border-volt/20">
              HOST
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Join Run Button for running events */}
          {isRunEvent && (
            <button
              onClick={handleToggleJoin}
              disabled={joining || (!isParticipating && isFull)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isParticipating
                  ? 'bg-zinc-800 text-volt border border-volt/40 hover:bg-zinc-700'
                  : isFull
                  ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-800'
                  : 'bg-volt text-zinc-950 hover:bg-volt-hover active:scale-95 shadow-sm'
              }`}
            >
              {isParticipating ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> 참석 완료 (취소)
                </>
              ) : isFull ? (
                '마감됨'
              ) : (
                '러닝 참석'
              )}
            </button>
          )}

          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.comments_count || 0}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
