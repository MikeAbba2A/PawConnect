import { supabase } from './supabase';
import type { Event, EventParticipant, EventType } from '../types/database.types';

// Event Types
export const getEventTypes = async () => {
  const { data, error } = await supabase
    .from('event_types')
    .select('*')
    .order('name');
  
  return { eventTypes: data as EventType[], error };
};

// Events
export const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'participants_count' | 'is_participating' | 'user_participation'>) => {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select(`
      *,
      organizer:users!events_organizer_id_fkey(*),
      event_type_info:event_types!events_event_type_fkey(*)
    `)
    .single();
  
  return { event: data as Event, error };
};

export const getEvents = async (filters?: {
  type?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from('events')
    .select(`
      *,
      organizer:users!events_organizer_id_fkey(*),
      event_type_info:event_types!events_event_type_fkey(*)
    `)
    .eq('is_public', true)
    .eq('is_active', true)
    .gte('date_start', new Date().toISOString())
    .order('date_start', { ascending: true });

  if (filters?.type) {
    query = query.eq('event_type', filters.type);
  }

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters?.dateFrom) {
    query = query.gte('date_start', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('date_start', filters.dateTo);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const { data, error } = await query;
  
  if (error) return { events: [], error };

  // Get participants count for each event
  const eventsWithParticipants = await Promise.all(
    (data || []).map(async (event) => {
      const { data: participantsData } = await supabase
        .from('event_participants')
        .select('id', { count: 'exact' })
        .eq('event_id', event.id)
        .eq('status', 'confirmed');

      return {
        ...event,
        participants_count: participantsData?.length || 0
      };
    })
  );
  
  return { events: eventsWithParticipants as Event[], error: null };
};

export const getEventById = async (eventId: string, userId?: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:users!events_organizer_id_fkey(*),
      event_type_info:event_types!events_event_type_fkey(*)
    `)
    .eq('id', eventId)
    .single();

  if (error) return { event: null, error };

  let event = data as Event;

  // Get participants count
  const { data: participantsData } = await supabase
    .from('event_participants')
    .select('id', { count: 'exact' })
    .eq('event_id', eventId)
    .eq('status', 'confirmed');

  event.participants_count = participantsData?.length || 0;

  // Check if user is participating
  if (userId) {
    const { data: participationData } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    event.is_participating = !!participationData;
    event.user_participation = participationData as EventParticipant;
  }

  return { event, error: null };
};

export const getUserEvents = async (userId: string, type: 'organized' | 'participating' = 'participating') => {
  let query;

  if (type === 'organized') {
    query = supabase
      .from('events')
      .select(`
        *,
        organizer:users!events_organizer_id_fkey(*),
        event_type_info:event_types!events_event_type_fkey(*)
      `)
      .eq('organizer_id', userId)
      .order('date_start', { ascending: true });
  } else {
    query = supabase
      .from('event_participants')
      .select(`
        *,
        event:events(
          *,
          organizer:users!events_organizer_id_fkey(*),
          event_type_info:event_types!events_event_type_fkey(*)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (type === 'participating') {
    const events = (data as any[])?.map(participation => participation.event) || [];
    return { events: events as Event[], error };
  }

  return { events: data as Event[], error };
};

export const updateEvent = async (eventId: string, updateData: Partial<Event>) => {
  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .select(`
      *,
      organizer:users!events_organizer_id_fkey(*),
      event_type_info:event_types!events_event_type_fkey(*)
    `)
    .single();
  
  return { event: data as Event, error };
};

export const deleteEvent = async (eventId: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  
  return { error };
};

// Event Participation
export const joinEvent = async (eventId: string, userId: string, notes?: string) => {
  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: 'confirmed',
      notes
    })
    .select(`
      *,
      user:users!event_participants_user_id_fkey(*)
    `)
    .single();
  
  return { participation: data as EventParticipant, error };
};

export const leaveEvent = async (eventId: string, userId: string) => {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  
  return { error };
};

export const updateParticipation = async (participationId: string, updateData: Partial<EventParticipant>) => {
  const { data, error } = await supabase
    .from('event_participants')
    .update(updateData)
    .eq('id', participationId)
    .select(`
      *,
      user:users!event_participants_user_id_fkey(*)
    `)
    .single();
  
  return { participation: data as EventParticipant, error };
};

export const getEventParticipants = async (eventId: string) => {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      id,
      event_id,
      user_id,
      status,
      invited_by,
      notes,
      created_at,
      updated_at,
      user:users!event_participants_user_id_fkey(*),
      invited_by_user:users!event_participants_invited_by_fkey(*)
    `)
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true });
  
  return { participants: data as EventParticipant[], error };
};

// Image upload
export const uploadEventImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) return { url: null, error };
  
  const { data: publicUrlData } = supabase.storage
    .from('event-images')
    .getPublicUrl(data.path);
  
  return { url: publicUrlData.publicUrl, error: null };
};

// Get friends who are not participating in an event
export const getFriendsNotParticipating = async (userId: string, eventId: string) => {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      user:users!friends_user_id_fkey(*),
      friend:users!friends_friend_id_fkey(*)
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) return { friends: [], error };

  // Get current event participants
  const { data: participants } = await supabase
    .from('event_participants')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'confirmed');

  const participantIds = new Set(participants?.map(p => p.user_id) || []);

  // Filter out friends who are already participating
  const nonParticipatingFriends = (data || []).filter(friendship => {
    const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
    return !participantIds.has(friendId);
  });

  return { friends: nonParticipatingFriends, error: null };
};

// Send event invitation to a friend via message
export const sendEventInvitation = async (
  eventId: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  fromUserId: string,
  toUserId: string
) => {
  // Import here to avoid circular dependency
  const { getOrCreateConversation, sendTextMessage } = await import('./messageService');
  
  try {
    // Create or get conversation
    const { conversationId, error: convError } = await getOrCreateConversation(fromUserId, toUserId);
    if (convError) throw convError;

    // Create invitation message
    const inviteMessage = `🎉 Je t'invite à rejoindre l'événement "${eventTitle}" !
📅 ${eventDate}
📍 ${eventLocation || 'Lieu à confirmer'}

Tu peux voir les détails et t'inscrire ici : ${window.location.origin}/events/${eventId}`;

    // Send message
    const { error: messageError } = await sendTextMessage(conversationId, fromUserId, inviteMessage);
    if (messageError) throw messageError;

    return { error: null };
  } catch (error) {
    return { error };
  }
};