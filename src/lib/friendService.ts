import { supabase } from './supabase';
import type { Friend, User } from '../types/database.types';

export const sendFriendRequest = async (userId: string, friendId: string) => {
  const { data, error } = await supabase
    .from('friends')
    .insert({ user_id: userId, friend_id: friendId, status: 'pending' })
    .select(`
      *,
      friend:users!friends_friend_id_fkey(*)
    `)
    .single();
  
  return { friend: data as Friend & { friend: User }, error };
};

export const acceptFriendRequest = async (friendshipId: string) => {
  const { data, error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .select(`
      *,
      user:users!friends_user_id_fkey(*),
      friend:users!friends_friend_id_fkey(*)
    `)
    .single();
  
  return { friend: data as Friend & { user: User; friend: User }, error };
};

export const rejectFriendRequest = async (friendshipId: string) => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', friendshipId);
  
  return { error };
};

export const removeFriend = async (userId: string, friendId: string) => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
  
  return { error };
};

export const getFriends = async (userId: string) => {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      user:users!friends_user_id_fkey(*),
      friend:users!friends_friend_id_fkey(*)
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });
  
  return { friends: data as (Friend & { user: User; friend: User })[], error };
};

export const getFriendRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      user:users!friends_user_id_fkey(*)
    `)
    .eq('friend_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  return { requests: data as (Friend & { user: User })[], error };
};

export const checkFriendshipStatus = async (userId: string, friendId: string) => {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .maybeSingle();
  
  return { friendship: data as Friend | null, error };
};