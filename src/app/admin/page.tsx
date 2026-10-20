import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { AdminUserManagement } from './AdminUserManagement';
import { ShieldCheck, Users, Clock, AlertTriangle } from 'lucide-react';
import type { Profile } from '@/types/database';

export const revalidate = 0;

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  if (currentUser.role !== 'admin' || currentUser.status !== 'approved') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100">관리자 전용 페이지입니다</h1>
        <p className="mt-2 text-xs text-zinc-400">
          현재 계정은 관리자 승인 권한이 없습니다. 크루 마스터에게 문의해 주세요.
        </p>
      </div>
    );
  }

  // Fetch all profiles using admin client to ensure full view
  const adminSupabase = createAdminClient();
  const { data: profiles, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const pendingList = (profiles as Profile[] || []).filter(p => p.status === 'pending');
  const approvedList = (profiles as Profile[] || []).filter(p => p.status === 'approved');
  const rejectedList = (profiles as Profile[] || []).filter(p => p.status === 'rejected');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-volt text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>CREW MASTER CONTROL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            크루 멤버 승인 및 권한 관리 센터
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            구글로 로그인한 러너를 승인하거나 권한(관리자, 크루 멤버, 게스트)을 조정합니다.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-surface border border-zinc-800 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">승인대기:</span>
            <span className="font-bold text-amber-400">{pendingList.length}명</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-surface border border-zinc-800 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-volt" />
            <span className="text-zinc-400">활동 크루:</span>
            <span className="font-bold text-volt">{approvedList.length}명</span>
          </div>
        </div>
      </div>

      {/* Interactive Table Component */}
      <AdminUserManagement 
        initialProfiles={profiles as Profile[] || []} 
        currentUserId={currentUser.id} 
      />
    </div>
  );
}
