/*
  # Add event invitation notifications

  1. Updates
    - Update notification type constraint to include 'event_invite'
    - Create function to detect event invitations in messages
    - Add trigger to create notifications when event invitations are sent

  2. Security
    - Maintain existing RLS policies
    - Ensure notifications are created for event invitations
*/

-- Update the notification type constraint to include event_invite
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'comment', 'friend_request', 'follow', 'new_post', 'event_join', 'event_invite'));

-- Function to create event invitation notification when a message contains event invitation
CREATE OR REPLACE FUNCTION create_event_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_username TEXT;
  event_title TEXT;
  event_id_extracted TEXT;
  recipient_id UUID;
BEGIN
  -- Only process text messages that contain event invitations
  IF NEW.message_type = 'text' AND NEW.content IS NOT NULL THEN
    -- Check if the message contains an event invitation pattern
    -- Look for messages that contain event URLs or invitation text
    IF NEW.content LIKE '%événement%' AND NEW.content LIKE '%t''invite%' THEN
      -- Extract event ID from the message content (assuming it contains the URL)
      -- This is a simple pattern match - you might need to adjust based on your URL structure
      event_id_extracted := substring(NEW.content from 'events/([a-f0-9-]{36})');
      
      IF event_id_extracted IS NOT NULL THEN
        -- Get event title
        SELECT title INTO event_title
        FROM events
        WHERE id = event_id_extracted::UUID;
        
        -- Get sender username
        SELECT username INTO sender_username
        FROM users
        WHERE id = NEW.sender_id;
        
        -- Get recipient ID (the other participant in the conversation)
        SELECT CASE 
          WHEN participant_1_id = NEW.sender_id THEN participant_2_id
          ELSE participant_1_id
        END INTO recipient_id
        FROM conversations
        WHERE id = NEW.conversation_id;
        
        -- Create notification for the recipient
        IF recipient_id IS NOT NULL AND event_title IS NOT NULL THEN
          INSERT INTO notifications (
            user_id,
            type,
            message,
            post_id,
            from_user_id,
            is_read,
            created_at
          ) VALUES (
            recipient_id,
            'event_invite',
            COALESCE(sender_username, 'Quelqu''un') || ' vous a invité à l''événement "' || event_title || '"',
            NULL,
            NEW.sender_id,
            false,
            now()
          );
          
          RAISE NOTICE 'Event invitation notification created for user % from user %', recipient_id, NEW.sender_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create event invitation notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for event invitation notifications
DROP TRIGGER IF EXISTS after_message_insert_event_invitation ON messages;
CREATE TRIGGER after_message_insert_event_invitation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_event_invitation_notification();