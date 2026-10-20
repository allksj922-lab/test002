export type UserRole = 'admin' | 'member' | 'guest';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export type PostCategory = 
  | 'NOTICE' 
  | 'REGULAR_RUN' 
  | 'FLASH_RUN' 
  | 'COURSE_RECOMMEND' 
  | 'FREE_TALK' 
  | 'GEAR_REVIEW';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  bio: string | null;
  pace_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: PostCategory;
  run_date: string | null;
  location: string | null;
  distance_km: number | null;
  pace: string | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  participants?: RunParticipant[];
  comments_count?: number;
}

export interface RunParticipant {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  user?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}
