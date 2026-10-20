import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    // Verify current user is admin
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (currentProfile?.role !== 'admin' || currentProfile?.status !== 'approved') {
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, targetUserId, newRole, newStatus } = body;

    const adminSupabase = createAdminClient();

    if (action === 'update_status') {
      const { data, error } = await adminSupabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, profile: data });
    }

    if (action === 'update_role') {
      const { data, error } = await adminSupabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, profile: data });
    }

    if (action === 'delete_user') {
      // Don't allow admin to delete themselves
      if (targetUserId === user.id) {
        return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 });
      }

      const { error } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '알 수 없는 요청입니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
