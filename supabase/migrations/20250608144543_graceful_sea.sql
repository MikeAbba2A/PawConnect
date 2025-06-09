/*
  # Add follow notifications

  1. Updates
    - Add 'follow' to notification types
    - Create function to send follow notifications
    - Add trigger for follow notifications

  2. Security
    - Maintain existing RLS policies
    - Ensure notifications are created when users follow pets
*/

-- Update the notification type constraint to include follow
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'comment', 'friend_request', 'follow'));

-- Function to create follow notification
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
  pet_name TEXT;
  pet_owner_id UUID;
BEGIN
  -- Only create notification for new follows (not unfollows)
  IF TG_OP = 'INSERT' THEN
    -- Get the username of the person who followed
    SELECT username INTO follower_username
    FROM users 
    WHERE id = NEW.follower_id;
    
    -- Get the pet name and owner
    SELECT name, owner_id INTO pet_name, pet_owner_id
    FROM pets
    WHERE id = NEW.followed_pet_id;
    
    -- Create notification for the pet owner
    INSERT INTO notifications (
      user_id,
      type,
      message,
      post_id,
      from_user_id,
      is_read,
      created_at
    ) VALUES (
      pet_owner_id,
      'follow',
      COALESCE(follower_username, 'Quelqu''un') || ' suit maintenant ' || COALESCE(pet_name, 'votre animal'),
      NULL, -- No post associated with follows
      NEW.follower_id,
      false,
      now()
    );
    
    RAISE NOTICE 'Follow notification created for user % from user %', pet_owner_id, NEW.follower_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create follow notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for follow notifications
DROP TRIGGER IF EXISTS after_follow_insert ON follows;
CREATE TRIGGER after_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();