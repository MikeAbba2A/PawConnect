import { supabase } from './supabase';
import type { Notification } from '../types/database.types';

export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      from_user:users!notifications_from_user_id_fkey(*),
      post:posts(*,
        pet:pets(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { notifications: data as Notification[], error };
};

export const getUnreadNotificationsCount = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  return { count: data?.length || 0, error };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  return { error };
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  return { error };
};

export const deleteNotification = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  
  return { error };
};