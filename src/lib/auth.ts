import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (err) {
    return null;
  }
}
