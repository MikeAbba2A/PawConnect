import { supabase } from './supabase';
import type { Pet } from '../types/database.types';

export const createPet = async (petData: Omit<Pet, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('pets')
    .insert(petData)
    .select()
    .single();
  
  return { pet: data as Pet, error };
};

export const getUserPets = async (userId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  
  return { pets: data as Pet[], error };
};

export const getPetById = async (petId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .single();
  
  return { pet: data as Pet, error };
};

export const updatePet = async (petId: string, updateData: Partial<Pet>) => {
  const { data, error } = await supabase
    .from('pets')
    .update(updateData)
    .eq('id', petId)
    .select()
    .single();
  
  return { pet: data as Pet, error };
};

export const uploadPetImage = async (file: File, path: string) => {
  console.log('Uploading image to path:', path);
  console.log('File details:', { name: file.name, size: file.size, type: file.type });
  
  const { data, error } = await supabase.storage
    .from('pet-images')
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
    .from('pet-images')
    .getPublicUrl(data.path);
  
  console.log('Generated public URL:', publicUrlData.publicUrl);
  
  // Test if the URL is accessible
  try {
    const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
    console.log('URL accessibility test:', response.status, response.statusText);
  } catch (testError) {
    console.error('URL accessibility test failed:', testError);
  }
  
  return { url: publicUrlData.publicUrl, error: null };
};
