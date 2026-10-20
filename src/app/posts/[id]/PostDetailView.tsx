'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Gauge, 
  Users, 
  CheckCircle2, 
  Trash2, 
  Send, 
  MessageSquare,
  ShieldCheck,
  Share2
} from 'lucide-react';
import type { Post, Profile, Comment } from '@/types/database';

interface PostDetailViewProps {
  post: Post;
  initialComments: Comment[];
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

export function PostDetailView({ post, initialComments, currentUser }: PostDetailViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [participants, setParticipants] = useState(post.participants || []);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
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

  const handleToggleJoin = async () => {
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
        const { error } = await supabase
          .from('run_participants')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        setParticipants(prev => prev.filter(p => p.user_id !== currentUser.id));
      } else {
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

  const handleDeletePost = async () => {
    if (!confirm('이 게시글을 정말 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      router.push('/');
      router.refresh();
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUser) {
      alert('댓글 작성을 위해 구글 로그인이 필요합니다.');
      return;
    }
    if (!isApproved) {
      alert('크루 관리자의 승인 완료 후 댓글을 작성할 수 있습니다.');
      return;
    }

    try {
      setSubmittingComment(true);
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_id: currentUser.id,
          content: commentText.trim(),
        })
        .select('*, author:profiles(*)')
        .single();

      if (error) throw error;
      setComments(prev => [...prev, data]);
      setCommentText('');
    } catch (err: any) {
      alert(`댓글 등록 실패: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(`댓글 삭제 실패: ${err.message}`);
    }
  };

  const cat = CATEGORY_MAP[post.category] || { label: post.category, color: 'bg-zinc-800 text-zinc-300' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 목록으로 돌아가기
        </Link>

        {canDelete && (
          <button
            onClick={handleDeletePost}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>게시글 삭제</span>
          </button>
        )}
      </div>

      {/* Main Post Article */}
      <article className="rounded-3xl bg-surface border border-zinc-800 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${cat.color}`}>
            {cat.label}
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {new Date(post.created_at).toLocaleString('ko-KR')}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight leading-snug">
          {post.title}
        </h1>

        {/* Author Header */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800/80">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
              {(post.author?.full_name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-200">
                {post.author?.full_name || '크루 멤버'}
              </span>
              {post.author?.role === 'admin' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-volt/15 text-volt border border-volt/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Host Admin
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {post.author?.email}
            </span>
          </div>
        </div>

        {/* Running telemetry box if run event */}
        {isRunEvent && (
          <div className="mt-8 rounded-2xl bg-zinc-950 border border-zinc-800/90 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-volt uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4" /> CREW RUN TELEMETRY
              </span>
              <span className="text-xs font-mono text-zinc-400">
                참가 인원: <strong className="text-zinc-100">{participants.length}</strong> / {maxCount}명
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-volt" /> 일시
                </span>
                <span className="mt-1 font-medium text-xs sm:text-sm text-zinc-200 block">
                  {post.run_date
                    ? new Date(post.run_date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '미정'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blaze" /> 집결 장소
                </span>
                <span className="mt-1 font-medium text-xs sm:text-sm text-zinc-200 block truncate" title={post.location || ''}>
                  {post.location || '추후 공지'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-volt" /> 거리
                </span>
                <span className="mt-1 font-mono font-bold text-xs sm:text-sm text-zinc-100 block">
                  {post.distance_km ? `${post.distance_km} KM` : '-'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-volt" /> 페이스
                </span>
                <span className="mt-1 font-mono font-bold text-xs sm:text-sm text-zinc-100 block">
                  {post.pace || '자율'}
                </span>
              </div>
            </div>

            {/* Attendance CTA */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-zinc-300 block mb-2">참석 러너 명단</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {participants.map(p => (
                    <div
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                    >
                      {p.user?.avatar_url ? (
                        <img src={p.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-zinc-800 text-[8px] flex items-center justify-center font-bold">
                          {(p.user?.full_name || 'U')[0]}
                        </span>
                      )}
                      <span>{p.user?.full_name || '러너'}</span>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <span className="text-xs text-zinc-600">아직 신청자가 없습니다.</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleToggleJoin}
                disabled={joining || (!isParticipating && isFull)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md ${
                  isParticipating
                    ? 'bg-zinc-800 text-volt border border-volt/40 hover:bg-zinc-700'
                    : isFull
                    ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-800'
                    : 'bg-volt text-zinc-950 hover:bg-volt-hover active:scale-95'
                }`}
              >
                {isParticipating ? '참석 취소하기' : isFull ? '정원 마감' : '지금 러닝 참가하기'}
              </button>
            </div>
          </div>
        )}

        {/* Post Content */}
        <div className="mt-8 text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
          {post.content}
        </div>
      </article>

      {/* Comments Section */}
      <section className="mt-10">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-volt" />
          <span>크루 댓글 ({comments.length})</span>
        </h2>

        {/* Comment input form */}
        {isApproved ? (
          <form onSubmit={handleCreateComment} className="mb-6">
            <div className="rounded-2xl bg-surface border border-zinc-800 p-3 flex flex-col gap-2">
              <textarea
                rows={3}
                placeholder="댓글을 남겨주세요 (집결 질문, 코스 문의 등)"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="w-full bg-transparent p-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-end border-t border-zinc-800/80 pt-2">
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-volt hover:bg-volt-hover text-zinc-950 text-xs font-bold disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>댓글 등록</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-500 mb-6 text-center">
            댓글 작성은 구글 로그인 및 관리자 승인 완료 후에 가능합니다.
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments.map(c => {
            const isCommentAuthor = currentUser?.id === c.author_id;
            const canDeleteComment = isCommentAuthor || isAdmin;

            return (
              <div key={c.id} className="p-4 rounded-xl bg-surface/60 border border-zinc-800/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {c.author?.avatar_url ? (
                      <img src={c.author.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-zinc-800 text-[9px] font-bold flex items-center justify-center text-zinc-400">
                        {(c.author?.full_name || 'U')[0]}
                      </div>
                    )}
                    <span className="text-xs font-bold text-zinc-200">
                      {c.author?.full_name || '크루'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  {canDeleteComment && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-zinc-600 hover:text-rose-400 transition-colors"
                      title="댓글 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
