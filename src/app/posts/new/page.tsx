import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { CreatePostForm } from './CreatePostForm';
import { Footprints, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function NewPostPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  if (currentUser.status !== 'approved') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100">가입 승인 대기 중입니다</h1>
        <p className="mt-2 text-xs text-zinc-400">
          크루 관리자의 승인 완료 후 새로운 러닝 일정이나 글을 등록하실 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 메인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 목록으로 돌아가기
        </Link>
        <div className="flex items-center gap-2 text-volt text-xs font-mono font-bold uppercase tracking-wider mb-1">
          <Footprints className="w-4 h-4" />
          <span>NEW CREW RUN & POST</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
          새 러닝 세션 및 게시글 작성
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          정기 러닝, 번개런 모임을 열거나 크루들과 코스 및 장비 정보를 공유하세요.
        </p>
      </div>

      <CreatePostForm currentUser={currentUser} />
    </div>
  );
}
