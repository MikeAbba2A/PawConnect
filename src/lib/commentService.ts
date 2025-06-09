import { supabase } from './supabase';

export const deleteComment = async (commentId: string) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  
  return { error };
};