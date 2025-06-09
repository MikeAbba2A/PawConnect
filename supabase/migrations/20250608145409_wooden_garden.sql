/*
  # Add notifications for new posts from followed pets

  1. New Functions
    - `create_post_follow_notification` - Creates notifications when a followed pet posts

  2. Triggers
    - Trigger on posts table to create notifications for followers

  3. Updates
    - Update notification type constraint to include 'new_post'
*/

-- Update the notification type constraint to include new_post
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'comment', 'friend_request', 'follow', 'new_post'));

-- Function to create notifications for new posts from followed pets
CREATE OR REPLACE FUNCTION create_post_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  pet_name TEXT;
  pet_owner_username TEXT;
BEGIN
  -- Only create notifications for public posts (not private ones)
  IF NEW.is_private = false THEN
    -- Get the pet name
    SELECT name INTO pet_name
    FROM pets
    WHERE id = NEW.pet_id;
    
    -- Get the pet owner's username
    SELECT users.username INTO pet_owner_username
    FROM pets
    JOIN users ON pets.owner_id = users.id
    WHERE pets.id = NEW.pet_id;
    
    -- Create notifications for all followers of this pet
    FOR follower_record IN 
      SELECT follower_id 
      FROM follows 
      WHERE followed_pet_id = NEW.pet_id
    LOOP
      -- Don't notify the owner of their own post
      IF follower_record.follower_id != (SELECT owner_id FROM pets WHERE id = NEW.pet_id) THEN
        INSERT INTO notifications (
          user_id,
          type,
          message,
          post_id,
          from_user_id,
          is_read,
          created_at
        ) VALUES (
          follower_record.follower_id,
          'new_post',
          COALESCE(pet_name, 'Un animal') || ' que vous suivez a publié un nouveau post',
          NEW.id,
          (SELECT owner_id FROM pets WHERE id = NEW.pet_id),
          false,
          now()
        );
        
        RAISE NOTICE 'New post notification created for follower % for pet %', follower_record.follower_id, pet_name;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create post follow notifications: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new post notifications
DROP TRIGGER IF EXISTS after_post_insert_follow_notification ON posts;
CREATE TRIGGER after_post_insert_follow_notification
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION create_post_follow_notification();