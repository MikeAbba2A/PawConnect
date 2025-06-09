import { supabase } from './supabase';
import type { Follow, Pet } from '../types/database.types';

export const followPet = async (followerId: string, followedPetId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, followed_pet_id: followedPetId })
    .select()
    .single();
  
  return { follow: data as Follow, error };
};

export const unfollowPet = async (followerId: string, followedPetId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: followerId, followed_pet_id: followedPetId });
  
  return { error };
};

export const getFollowedPets = async (userId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      *,
      followed_pet:pets(*)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  
  return { 
    follows: data as (Follow & { followed_pet: Pet })[], 
    error 
  };
};

export const getPetFollowers = async (petId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      *,
      follower:users(*)
    `)
    .eq('followed_pet_id', petId)
    .order('created_at', { ascending: false });
  
  return { follows: data, error };
};

export const isFollowingPet = async (userId: string, petId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .match({ follower_id: userId, followed_pet_id: petId })
    .maybeSingle();
  
  return { isFollowing: !!data, error };
};