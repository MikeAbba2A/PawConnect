/*
  # Optimize conversations query with unread count

  1. New Functions
    - `get_user_conversations_with_unread` - Optimized function to get conversations with unread counts in a single query
  
  2. Performance
    - Eliminates N+1 query problem by calculating unread counts in a single database query
    - Uses efficient joins and aggregations
*/

-- Function to get user conversations with unread message counts
CREATE OR REPLACE FUNCTION get_user_conversations_with_unread(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  participant_1_id UUID,
  participant_2_id UUID,
  last_message_at TIMESTAMPTZ,
  last_message_content TEXT,
  last_message_sender_id UUID,
  created_at TIMESTAMPTZ,
  unread_count BIGINT,
  participant_1_email TEXT,
  participant_1_username TEXT,
  participant_1_avatar_url TEXT,
  participant_1_bio TEXT,
  participant_1_created_at TIMESTAMPTZ,
  participant_2_email TEXT,
  participant_2_username TEXT,
  participant_2_avatar_url TEXT,
  participant_2_bio TEXT,
  participant_2_created_at TIMESTAMPTZ,
  last_message_sender_email TEXT,
  last_message_sender_username TEXT,
  last_message_sender_avatar_url TEXT,
  last_message_sender_bio TEXT,
  last_message_sender_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.participant_1_id,
    c.participant_2_id,
    c.last_message_at,
    c.last_message_content,
    c.last_message_sender_id,
    c.created_at,
    COALESCE(unread.count, 0) as unread_count,
    p1.email as participant_1_email,
    p1.username as participant_1_username,
    p1.avatar_url as participant_1_avatar_url,
    p1.bio as participant_1_bio,
    p1.created_at as participant_1_created_at,
    p2.email as participant_2_email,
    p2.username as participant_2_username,
    p2.avatar_url as participant_2_avatar_url,
    p2.bio as participant_2_bio,
    p2.created_at as participant_2_created_at,
    lms.email as last_message_sender_email,
    lms.username as last_message_sender_username,
    lms.avatar_url as last_message_sender_avatar_url,
    lms.bio as last_message_sender_bio,
    lms.created_at as last_message_sender_created_at
  FROM conversations c
  LEFT JOIN users p1 ON c.participant_1_id = p1.id
  LEFT JOIN users p2 ON c.participant_2_id = p2.id
  LEFT JOIN users lms ON c.last_message_sender_id = lms.id
  LEFT JOIN (
    SELECT 
      conversation_id,
      COUNT(*) as count
    FROM messages 
    WHERE is_read = false 
      AND sender_id != user_uuid
    GROUP BY conversation_id
  ) unread ON c.id = unread.conversation_id
  WHERE c.participant_1_id = user_uuid OR c.participant_2_id = user_uuid
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_conversations_with_unread(UUID) TO authenticated;