import { supabase } from './supabase';
import type { Post, Comment, Like } from '../types/database.types';

export const createPost = async (postData: Omit<Post, 'id' | 'created_at' | 'likes_count' | 'comments_count' | 'has_liked'>) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single();
  
  return { post: data as Post, error };
};

export const getFeedPosts = async (userId: string, page = 1, limit = 10) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  console.log('🔍 getFeedPosts called with userId:', userId, 'page:', page);

  // Get all posts with their pet information
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      pet:pets(*)
    `)
    .order('created_at', { ascending: false })
    .range(from, to);
  
  console.log('🔍 Raw posts data from database:', data);
  console.log('🔍 Posts query error:', error);
  
  if (error) {
    console.error('🔍 Error getting posts:', error);
    return { posts: [], error };
  }

  // For each post, get the real likes count and check if current user has liked it
  const processedPosts = await Promise.all(
    (data || []).map(async (post) => {
      // Get the real likes count and comments count from the database
      const { data: likesCountData } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id);
      
      const { data: commentsCountData } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id);
      
      // Check if current user has liked this post
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', userId)
        .maybeSingle();
      
      return {
        ...post,
        likes_count: likesCountData?.length || 0,
        comments_count: commentsCountData?.length || 0,
        has_liked: !!likeData
      };
    })
  );

  console.log('🔍 Processed posts:', processedPosts);
  
  return { posts: processedPosts as Post[], error: null };
};

export const likePost = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .insert({ post_id: postId, user_id: userId })
    .select()
    .single();
  
  return { like: data as Like, error };
};

export const unlikePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from('likes')
    .delete()
    .match({ post_id: postId, user_id: userId });
  
  return { error };
};

export const addComment = async (postId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`
      *,
      user:users(*)
    `)
    .single();
  
  return { comment: data as Comment, error };
};

export const getPostComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  
  return { comments: data as Comment[], error };
};

export const uploadPostImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) return { url: null, error };
  
  const { data: publicUrlData } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path);
  
  return { url: publicUrlData.publicUrl, error: null };
};

export const getPetPosts = async (petId: string, page = 1, limit = 10) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      pet:pets(*)
    `)
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) {
    return { posts: [], error };
  }

  // Process posts to get proper likes count
  const processedPosts = await Promise.all(
    (data || []).map(async (post) => {
      const { data: likesCountData } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id);
      
      const { data: commentsCountData } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id);
      
      return {
        ...post,
        likes_count: likesCountData?.length || 0,
        comments_count: commentsCountData?.length || 0
      };
    })
  );

  return { posts: processedPosts as Post[], error: null };
};

export const deletePost = async (postId: string) => {
  // Delete the post - associated comments, likes, and notifications 
  // will be automatically deleted due to CASCADE DELETE constraints
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  
  return { error };
};

export const getPostById = async (postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      pet:pets(*)
    `)
    .eq('id', postId)
    .single();
  
  return { post: data as Post, error };
};

export const updatePost = async (postId: string, updateData: Partial<Omit<Post, 'id' | 'created_at' | 'likes_count' | 'comments_count' | 'has_liked'>>) => {
  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .select(`
      *,
      pet:pets(*)
    `)
    .single();
  
  return { post: data as Post, error };
};