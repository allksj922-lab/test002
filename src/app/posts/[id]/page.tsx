import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { PostDetailView } from './PostDetailView';
import type { Post } from '@/types/database';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*),
      participants:run_participants(*, user:profiles(*))
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    notFound();
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <PostDetailView
        post={post as Post}
        initialComments={comments || []}
        currentUser={currentUser}
      />
    </div>
  );
}
