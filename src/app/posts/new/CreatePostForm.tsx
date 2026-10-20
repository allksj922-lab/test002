'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, MapPin, Gauge, Users, Loader2 } from 'lucide-react';
import type { Profile, PostCategory } from '@/types/database';

interface CreatePostFormProps {
  currentUser: Profile;
}

const CATEGORIES: { key: PostCategory; label: string; desc: string }[] = [
  { key: 'REGULAR_RUN', label: '정기런', desc: '크루 공식 정기 세션 일정' },
  { key: 'FLASH_RUN', label: '번개런', desc: '오늘/내일 즉흥 러닝 모임' },
  { key: 'COURSE_RECOMMEND', label: '코스추천', desc: '추천 러닝 코스 및 GPX 경로' },
  { key: 'FREE_TALK', label: '자유수다', desc: '러너들의 일상 및 훈련 이야기' },
  { key: 'GEAR_REVIEW', label: '장비리뷰', desc: '러닝화, 워치, 의류 실착 후기' },
  { key: 'NOTICE', label: '공지사항', desc: '크루 운영 공지 (관리자 권장)' },
];

export function CreatePostForm({ currentUser }: CreatePostFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState<PostCategory>('REGULAR_RUN');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Running meta
  const [runDate, setRunDate] = useState('');
  const [location, setLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState('7.0');
  const [pace, setPace] = useState('5:45/km');
  const [maxParticipants, setMaxParticipants] = useState('15');

  const isRunEvent = category === 'REGULAR_RUN' || category === 'FLASH_RUN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);

      const postData: any = {
        author_id: currentUser.id,
        title: title.trim(),
        content: content.trim(),
        category,
      };

      if (isRunEvent) {
        postData.run_date = runDate ? new Date(runDate).toISOString() : null;
        postData.location = location.trim() || '추후 공지';
        postData.distance_km = distanceKm ? parseFloat(distanceKm) : null;
        postData.pace = pace.trim() || null;
        postData.max_participants = maxParticipants ? parseInt(maxParticipants, 10) : 20;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      // Automatically join the host to the run
      if (isRunEvent && data) {
        await supabase.from('run_participants').insert({
          post_id: data.id,
          user_id: currentUser.id,
        });
      }

      router.push(`/posts/${data.id}`);
      router.refresh();
    } catch (err: any) {
      alert(`등록 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category selector */}
      <div>
        <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
          카테고리 선택
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(cat => {
            const selected = category === cat.key;
            return (
              <button
                type="button"
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  selected
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                    : 'bg-surface hover:bg-surfaceHover border-zinc-800 text-zinc-400'
                }`}
              >
                <div className={`text-xs font-bold ${selected ? 'text-zinc-950' : 'text-zinc-200'}`}>
                  {cat.label}
                </div>
                <div className={`text-[11px] mt-0.5 line-clamp-1 ${selected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                  {cat.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Running Event Meta Inputs (If Run) */}
      {isRunEvent && (
        <div className="rounded-2xl bg-surface border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-2 text-volt text-xs font-mono font-bold uppercase tracking-wider">
            <Gauge className="w-3.5 h-3.5" />
            <span>러닝 세션 상세 스펙</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-volt" /> 러닝 일시
              </label>
              <input
                type="datetime-local"
                value={runDate}
                onChange={e => setRunDate(e.target.value)}
                required={isRunEvent}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-volt"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blaze" /> 집결 장소
              </label>
              <input
                type="text"
                placeholder="예: 여의도 한강공원 물빛광장 피아노 앞"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required={isRunEvent}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-volt"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-volt" /> 목표 거리 (KM)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="예: 7.0"
                value={distanceKm}
                onChange={e => setDistanceKm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-volt"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-volt" /> 목표 페이스
              </label>
              <input
                type="text"
                placeholder="예: 5:30/km 또는 6:00 펀런"
                value={pace}
                onChange={e => setPace(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-volt"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-zinc-400" /> 최대 모집 인원
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-volt"
              />
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
          제목
        </label>
        <input
          type="text"
          placeholder="러닝 세션 제목 또는 게시글 제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full bg-surface border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-volt font-medium"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
          본문 내용
        </label>
        <textarea
          rows={7}
          placeholder="러닝 코스 설명, 준비물(헤드랜턴, 러닝벨트), 짐 보관 장소 등 상세 내용을 자유롭게 적어주세요."
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          className="w-full bg-surface border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-volt leading-relaxed"
        />
      </div>

      {/* Submit CTA */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          취소
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-volt hover:bg-volt-hover text-zinc-950 text-xs font-bold tracking-tight shadow-md active:scale-95 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>등록 중...</span>
            </>
          ) : (
            <span>러닝 세션 발행하기</span>
          )}
        </button>
      </div>
    </form>
  );
}
