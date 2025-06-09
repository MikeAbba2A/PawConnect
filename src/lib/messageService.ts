import { supabase } from './supabase';
import type { Conversation, Message, MessageReport } from '../types/database.types';

// Conversations
export const getUserConversations = async (userId: string) => {
  try {
    // Use the optimized database function to get conversations with unread counts
    const { data, error } = await supabase.rpc('get_user_conversations_with_unread', {
      user_uuid: userId
    });

    if (error) return { conversations: [], error };

    // Transform the flat data structure back to the expected nested format
    const conversations = (data || []).map((row: any) => ({
      id: row.id,
      participant_1_id: row.participant_1_id,
      participant_2_id: row.participant_2_id,
      last_message_at: row.last_message_at,
      last_message_content: row.last_message_content,
      last_message_sender_id: row.last_message_sender_id,
      created_at: row.created_at,
      unread_count: row.unread_count,
      participant_1: {
        id: row.participant_1_id,
        email: row.participant_1_email,
        username: row.participant_1_username,
        avatar_url: row.participant_1_avatar_url,
        bio: row.participant_1_bio,
        created_at: row.participant_1_created_at
      },
      participant_2: {
        id: row.participant_2_id,
        email: row.participant_2_email,
        username: row.participant_2_username,
        avatar_url: row.participant_2_avatar_url,
        bio: row.participant_2_bio,
        created_at: row.participant_2_created_at
      },
      last_message_sender: row.last_message_sender_id ? {
        id: row.last_message_sender_id,
        email: row.last_message_sender_email,
        username: row.last_message_sender_username,
        avatar_url: row.last_message_sender_avatar_url,
        bio: row.last_message_sender_bio,
        created_at: row.last_message_sender_created_at
      } : null
    }));

    return { conversations: conversations as Conversation[], error: null };
  } catch (err) {
    console.error('Error in getUserConversations:', err);
    return { conversations: [], error: err };
  }
};

export const getOrCreateConversation = async (user1Id: string, user2Id: string) => {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    user1_id: user1Id,
    user2_id: user2Id
  });

  if (error) return { conversationId: null, error };
  return { conversationId: data as string, error: null };
};

// Messages
export const getConversationMessages = async (conversationId: string, page = 1, limit = 50) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return { messages: [], error };

  // Inverser l'ordre pour avoir les messages du plus ancien au plus récent
  return { messages: (data || []).reverse() as Message[], error: null };
};

export const sendTextMessage = async (conversationId: string, senderId: string, content: string) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: 'text'
    })
    .select(`
      *,
      sender:users(*)
    `)
    .single();

  return { message: data as Message, error };
};

export const sendImageMessage = async (conversationId: string, senderId: string, imageUrl: string) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: 'image',
      metadata: { image_url: imageUrl }
    })
    .select(`
      *,
      sender:users(*)
    `)
    .single();

  return { message: data as Message, error };
};

export const sendPostShareMessage = async (
  conversationId: string, 
  senderId: string, 
  postId: string,
  postTitle?: string,
  postImage?: string
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: 'post_share',
      metadata: { 
        post_id: postId,
        post_title: postTitle,
        post_image: postImage
      }
    })
    .select(`
      *,
      sender:users(*)
    `)
    .single();

  return { message: data as Message, error };
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  return { error };
};

export const deleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  return { error };
};

// Upload d'images pour messages
export const uploadMessageImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('message-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) return { url: null, error };

  const { data: publicUrlData } = supabase.storage
    .from('message-images')
    .getPublicUrl(data.path);

  return { url: publicUrlData.publicUrl, error: null };
};

// Signalements
export const reportMessage = async (
  messageId: string, 
  reporterId: string, 
  reason: MessageReport['reason'],
  description?: string
) => {
  const { data, error } = await supabase
    .from('message_reports')
    .insert({
      message_id: messageId,
      reporter_id: reporterId,
      reason,
      description
    })
    .select()
    .single();

  return { report: data as MessageReport, error };
};

// Temps réel
export const subscribeToConversation = (conversationId: string, callback: (message: Message) => void) => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        // Récupérer les détails complets du message avec l'utilisateur
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users(*)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          callback(data as Message);
        }
      }
    );
  
  return channel;
};

export const subscribeToConversations = (userId: string, callback: (conversation: Conversation) => void) => {
  const channel = supabase
    .channel(`user_conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `participant_1_id=eq.${userId}`
      },
      async (payload) => {
        const { data } = await supabase
          .from('conversations')
          .select(`
            *,
            participant_1:users!conversations_participant_1_id_fkey(*),
            participant_2:users!conversations_participant_2_id_fkey(*),
            last_message_sender:users!conversations_last_message_sender_id_fkey(*)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          callback(data as Conversation);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `participant_2_id=eq.${userId}`
      },
      async (payload) => {
        const { data } = await supabase
          .from('conversations')
          .select(`
            *,
            participant_1:users!conversations_participant_1_id_fkey(*),
            participant_2:users!conversations_participant_2_id_fkey(*),
            last_message_sender:users!conversations_last_message_sender_id_fkey(*)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          callback(data as Conversation);
        }
      }
    );
  
  return channel;
};