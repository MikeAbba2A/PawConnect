import { supabase } from './supabase';
import type { User } from '../types/database.types';

export const updateUserProfile = async (userId: string, updateData: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();
  
  return { user: data as User, error };
};

export const uploadUserAvatar = async (file: File, path: string) => {
  console.log('Uploading avatar to path:', path);
  console.log('File details:', { name: file.name, size: file.size, type: file.type });
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) {
    console.error('Upload error:', error);
    return { url: null, error };
  }
  
  console.log('Upload successful, data:', data);
  
  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);
  
  console.log('Generated public URL:', publicUrlData.publicUrl);
  
  return { url: publicUrlData.publicUrl, error: null };
};

export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { user: data as User, error };
};