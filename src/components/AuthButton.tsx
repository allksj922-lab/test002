'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogIn, LogOut, Loader2, ShieldCheck, Clock } from 'lucide-react';
import type { Profile } from '@/types/database';

interface AuthButtonProps {
  user: Profile | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(`로그인 실패: ${err.message}`);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      alert(`로그아웃 실패: ${err.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-volt" />
        <span>인증 처리 중...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || 'User'}
              className="w-6 h-6 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
              {(user.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="text-xs font-medium text-zinc-200 hidden sm:inline">
            {user.full_name || user.email?.split('@')[0]}
          </span>

          {user.role === 'admin' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-volt/15 text-volt border border-volt/30 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          ) : user.status === 'approved' ? (
            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Crew
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clock className="w-2.5 h-2.5" /> 승인대기
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">로그아웃</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:shadow-volt/10 hover:shadow-lg active:scale-95"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>Google 로그인</span>
    </button>
  );
}
