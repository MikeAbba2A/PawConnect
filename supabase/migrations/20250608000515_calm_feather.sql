/*
  # Fix notification system

  1. Security Changes
    - Add missing INSERT policy for notifications table
    - Ensure notification functions work correctly

  2. Function Updates
    - Update notification functions to handle edge cases
    - Add better error handling

  This migration fixes the notification system so users receive notifications
  when their posts are liked or commented on.
*/

-- Ensure the INSERT policy exists for notifications
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recreate the like notification function with better error handling
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
BEGIN
  -- Get the post owner and pet name
  SELECT pets.owner_id, pets.name INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  -- Get the username of the person who liked
  SELECT username INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Only create notification if someone else liked the post
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      post_id,
      from_user_id,
      is_read,
      created_at
    ) VALUES (
      post_owner_id,
      'like',
      COALESCE(from_username, 'Someone') || ' a aimé le post de ' || COALESCE(pet_name, 'votre animal'),
      NEW.post_id,
      NEW.user_id,
      false,
      now()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the like operation
    RAISE WARNING 'Failed to create like notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the comment notification function with better error handling
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
BEGIN
  -- Get the post owner and pet name
  SELECT pets.owner_id, pets.name INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  -- Get the username of the person who commented
  SELECT username INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Only create notification if someone else commented on the post
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      post_id,
      from_user_id,
      is_read,
      created_at
    ) VALUES (
      post_owner_id,
      'comment',
      COALESCE(from_username, 'Someone') || ' a commenté le post de ' || COALESCE(pet_name, 'votre animal'),
      NEW.post_id,
      NEW.user_id,
      false,
      now()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the comment operation
    RAISE WARNING 'Failed to create comment notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers exist and are properly configured
DROP TRIGGER IF EXISTS after_like_insert ON likes;
DROP TRIGGER IF EXISTS after_comment_insert ON comments;

CREATE TRIGGER after_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();