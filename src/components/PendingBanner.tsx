import { Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Profile } from '@/types/database';

interface PendingBannerProps {
  user: Profile | null;
}

export function PendingBanner({ user }: PendingBannerProps) {
  if (!user) return null;

  if (user.status === 'pending') {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
            <span>
              <strong>가입 대기 중입니다:</strong> 구글 계정으로 로그인되었습니다. 현재 관리자의 크루 승인을 기다리고 있으며, 승인 전까지는 게시글 열람만 가능합니다.
            </span>
          </div>
          <span className="hidden md:inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono uppercase font-bold tracking-wider">
            STATUS: PENDING
          </span>
        </div>
      </div>
    );
  }

  if (user.status === 'rejected') {
    return (
      <div className="w-full bg-rose-500/10 border-b border-rose-500/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2.5 text-xs text-rose-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>
            <strong>가입이 승인되지 않았습니다:</strong> 관리자에 의해 멤버십이 보류 또는 반려되었습니다. 크루 운영진에게 문의해 주세요.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
