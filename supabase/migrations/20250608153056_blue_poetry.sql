/*
  # Add event notifications support

  1. Updates
    - Add 'event_join' and 'event_invite' to notification types
    - Update notification functions to handle event-related notifications

  2. Security
    - Maintain existing RLS policies
    - Ensure notifications are created for event activities
*/

-- Update the notification type constraint to include event types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'comment', 'friend_request', 'follow', 'new_post', 'event_join', 'event_invite'));

-- Update the event notification function
CREATE OR REPLACE FUNCTION create_event_notification()
RETURNS TRIGGER AS $$
DECLARE
  organizer_username TEXT;
  event_title TEXT;
  participant_username TEXT;
BEGIN
  -- Notification when someone joins an event
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Get event title and organizer info
    SELECT events.title, users.username INTO event_title, organizer_username
    FROM events
    JOIN users ON events.organizer_id = users.id
    WHERE events.id = NEW.event_id;
    
    -- Get participant username
    SELECT username INTO participant_username
    FROM users
    WHERE id = NEW.user_id;
    
    -- Notify the organizer (unless they're joining their own event)
    IF NEW.user_id != (SELECT organizer_id FROM events WHERE id = NEW.event_id) THEN
      INSERT INTO notifications (
        user_id,
        type,
        message,
        post_id,
        from_user_id,
        is_read,
        created_at
      ) VALUES (
        (SELECT organizer_id FROM events WHERE id = NEW.event_id),
        'event_join',
        COALESCE(participant_username, 'Quelqu''un') || ' s''est inscrit à votre événement "' || COALESCE(event_title, 'Événement') || '"',
        NULL,
        NEW.user_id,
        false,
        now()
      );
      
      RAISE NOTICE 'Event join notification created for organizer from user %', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create event notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;