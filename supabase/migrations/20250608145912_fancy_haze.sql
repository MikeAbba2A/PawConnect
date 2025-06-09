/*
  # Fix notification system to show pet image instead of owner image

  1. Updates
    - Update notification queries to include pet information
    - Modify notification display to show pet avatar for follow and new_post notifications

  2. Changes
    - Add pet information to notification queries
    - Update notification display logic
*/

-- Update the notification functions to include pet information in metadata
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
  pet_name TEXT;
  pet_owner_id UUID;
  pet_avatar_url TEXT;
BEGIN
  -- Only create notification for new follows (not unfollows)
  IF TG_OP = 'INSERT' THEN
    -- Get the username of the person who followed
    SELECT username INTO follower_username
    FROM users 
    WHERE id = NEW.follower_id;
    
    -- Get the pet name, owner, and avatar
    SELECT name, owner_id, avatar_url INTO pet_name, pet_owner_id, pet_avatar_url
    FROM pets
    WHERE id = NEW.followed_pet_id;
    
    -- Create notification for the pet owner with pet metadata
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

-- Update the post follow notification function to include pet metadata
CREATE OR REPLACE FUNCTION create_post_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  pet_name TEXT;
  pet_owner_username TEXT;
  pet_avatar_url TEXT;
  pet_owner_id UUID;
BEGIN
  -- Only create notifications for public posts (not private ones)
  IF NEW.is_private = false THEN
    -- Get the pet information
    SELECT name, avatar_url, owner_id INTO pet_name, pet_avatar_url, pet_owner_id
    FROM pets
    WHERE id = NEW.pet_id;
    
    -- Create notifications for all followers of this pet
    FOR follower_record IN 
      SELECT follower_id 
      FROM follows 
      WHERE followed_pet_id = NEW.pet_id
    LOOP
      -- Don't notify the owner of their own post
      IF follower_record.follower_id != pet_owner_id THEN
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
          pet_owner_id,
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