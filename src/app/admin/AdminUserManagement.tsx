'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  X, 
  Shield, 
  UserCheck, 
  Trash2, 
  Clock, 
  ShieldAlert,
  Loader2,
  Mail,
  User,
  Filter
} from 'lucide-react';
import type { Profile, UserRole, UserStatus } from '@/types/database';

interface AdminUserManagementProps {
  initialProfiles: Profile[];
  currentUserId: string;
}

export function AdminUserManagement({ initialProfiles, currentUserId }: AdminUserManagementProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const pendingUsers = profiles.filter(p => p.status === 'pending');

  const handleUpdateStatus = async (targetUserId: string, newStatus: UserStatus) => {
    try {
      setLoadingId(targetUserId);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          targetUserId,
          newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfiles(prev => prev.map(p => p.id === targetUserId ? { ...p, status: newStatus } : p));
      router.refresh();
    } catch (err: any) {
      alert(`상태 변경 실패: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: UserRole) => {
    try {
      setLoadingId(targetUserId);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          targetUserId,
          newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfiles(prev => prev.map(p => p.id === targetUserId ? { ...p, role: newRole } : p));
      router.refresh();
    } catch (err: any) {
      alert(`역할 변경 실패: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetUserId: string, name: string) => {
    if (!confirm(`'${name}' 러너의 프로필을 정말 삭제하시겠습니까?`)) return;

    try {
      setLoadingId(targetUserId);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user',
          targetUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfiles(prev => prev.filter(p => p.id !== targetUserId));
      router.refresh();
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="mt-8 space-y-10">
      {/* 1. Fast Approval Queue for Pending Users */}
      {pendingUsers.length > 0 && (
        <section className="rounded-2xl bg-amber-500/5 border border-amber-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider font-mono">
              승인 대기 중인 신규 러너 ({pendingUsers.length}명)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingUsers.map(user => {
              const isLoading = loadingId === user.id;
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                        {(user.full_name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate">
                        {user.full_name || '이름 없음'}
                      </p>
                      <p className="text-xs text-zinc-400 truncate flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        {user.email}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                        가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(user.id, 'approved')}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-volt hover:bg-volt-hover text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      title="크루 멤버로 즉시 승인 (글쓰기/참석 권한 부여)"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>승인</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(user.id, 'rejected')}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700 text-xs transition-colors disabled:opacity-50"
                      title="가입 반려"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>반려</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Entire Member Directory & Role Tuning */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-volt" />
            <span>전체 러너 명단 및 권한 관리</span>
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-volt"
            >
              <option value="all">전체 상태 보기 ({profiles.length})</option>
              <option value="approved">승인 완료 (Approved)</option>
              <option value="pending">승인 대기 (Pending)</option>
              <option value="rejected">반려됨 (Rejected)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5 font-semibold">러너 정보</th>
                <th className="px-4 py-3.5 font-semibold">승인 상태</th>
                <th className="px-4 py-3.5 font-semibold">역할 / 권한</th>
                <th className="px-4 py-3.5 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProfiles.map(user => {
                const isSelf = user.id === currentUserId;
                const isLoading = loadingId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-zinc-900/40 transition-colors">
                    {/* User Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                            {(user.full_name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-200">
                              {user.full_name || '이름 없음'}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-volt/20 text-volt">
                                ME
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-500 font-mono text-[11px]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Select */}
                    <td className="px-4 py-3.5">
                      <select
                        value={user.status}
                        disabled={isLoading || isSelf}
                        onChange={(e) => handleUpdateStatus(user.id, e.target.value as UserStatus)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium border focus:outline-none transition-colors ${
                          user.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : user.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        } disabled:opacity-50`}
                      >
                        <option value="approved" className="bg-zinc-900 text-zinc-200">승인 (Approved)</option>
                        <option value="pending" className="bg-zinc-900 text-zinc-200">대기 (Pending)</option>
                        <option value="rejected" className="bg-zinc-900 text-zinc-200">반려 (Rejected)</option>
                      </select>
                    </td>

                    {/* Role Select */}
                    <td className="px-4 py-3.5">
                      <select
                        value={user.role}
                        disabled={isLoading || isSelf}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-volt disabled:opacity-50"
                      >
                        <option value="admin">관리자 (Admin: 모든 글/승인 권한)</option>
                        <option value="member">크루 멤버 (Member: 글/댓글/참석)</option>
                        <option value="guest">게스트 (Guest: 열람 전용)</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.full_name || user.email || '')}
                          disabled={isLoading}
                          className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          title="회원 삭제"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
