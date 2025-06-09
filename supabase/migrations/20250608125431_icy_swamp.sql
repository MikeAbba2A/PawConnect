/*
  # Add friend request notifications

  1. Updates
    - Add 'friend_request' to notification types
    - Create function to send friend request notifications
    - Add trigger for friend request notifications

  2. Security
    - Maintain existing RLS policies
    - Ensure notifications are created for friend requests
*/

-- Update the notification type constraint to include friend_request
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'comment', 'friend_request'));

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  requester_username TEXT;
BEGIN
  -- Only create notification for new friend requests (not updates)
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Get the username of the person who sent the request
    SELECT username INTO requester_username
    FROM users 
    WHERE id = NEW.user_id;
    
    -- Create notification for the person receiving the request
    INSERT INTO notifications (
      user_id,
      type,
      message,
      post_id,
      from_user_id,
      is_read,
      created_at
    ) VALUES (
      NEW.friend_id,
      'friend_request',
      COALESCE(requester_username, 'Quelqu''un') || ' vous a envoyé une demande d''ami',
      NULL, -- No post associated with friend requests
      NEW.user_id,
      false,
      now()
    );
    
    RAISE NOTICE 'Friend request notification created for user % from user %', NEW.friend_id, NEW.user_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create friend request notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend request notifications
DROP TRIGGER IF EXISTS after_friend_request_insert ON friends;
CREATE TRIGGER after_friend_request_insert
  AFTER INSERT ON friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_request_notification();