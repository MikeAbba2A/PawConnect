export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  created_at: string;
};

export type Pet = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  gender: 'male' | 'female' | 'unknown';
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  created_at: string;
};

export type Post = {
  id: string;
  pet_id: string;
  content?: string;
  image_urls?: string[];
  video_url?: string;
  location?: string;
  post_type: 'standard' | 'story';
  is_private: boolean;
  created_at: string;
  pet?: Pet;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
};

export type Like = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  followed_pet_id: string;
  created_at: string;
  followed_pet?: Pet;
};

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  user?: User;
  friend?: User;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'friend_request' | 'follow' | 'new_post' | 'event_join' | 'event_invite';
  message: string;
  post_id: string | null;
  from_user_id: string;
  is_read: boolean;
  created_at: string;
  from_user?: User;
  post?: Post | null;
};

export type Conversation = {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  last_message_content?: string;
  last_message_sender_id?: string;
  created_at: string;
  participant_1?: User;
  participant_2?: User;
  last_message_sender?: User;
  unread_count?: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'image' | 'post_share';
  metadata?: {
    image_url?: string;
    post_id?: string;
    post_title?: string;
    post_image?: string;
  };
  is_read: boolean;
  created_at: string;
  sender?: User;
};

export type MessageReport = {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
};

export type EventType = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
};

export type Event = {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  organizer_id: string;
  date_start: string;
  date_end?: string;
  location?: string;
  address?: string;
  max_participants?: number;
  is_public: boolean;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  organizer?: User;
  event_type_info?: EventType;
  participants_count?: number;
  is_participating?: boolean;
  user_participation?: EventParticipant;
};

export type EventParticipant = {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  invited_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  invited_by_user?: User;
};