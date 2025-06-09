/*
  # Fix notification system

  1. Debug and fix notification triggers
  2. Ensure proper RLS policies
  3. Add debugging to understand what's happening

  This migration will ensure notifications are created when users like or comment on posts.
*/

-- First, let's check if notifications are being created at all
-- Drop and recreate the notification functions with better debugging

DROP TRIGGER IF EXISTS after_like_insert ON likes;
DROP TRIGGER IF EXISTS after_comment_insert ON comments;
DROP FUNCTION IF EXISTS create_like_notification();
DROP FUNCTION IF EXISTS create_comment_notification();

-- Create a more robust like notification function
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
  notification_id UUID;
BEGIN
  RAISE NOTICE 'Like notification trigger fired for post_id: %, user_id: %', NEW.post_id, NEW.user_id;
  
  -- Get the post owner and pet name
  SELECT pets.owner_id, pets.name 
  INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  RAISE NOTICE 'Found post owner: %, pet name: %', post_owner_id, pet_name;
  
  -- Get the username of the person who liked
  SELECT username 
  INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  RAISE NOTICE 'From username: %', from_username;
  
  -- Only create notification if someone else liked the post
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    RAISE NOTICE 'Creating like notification for user: %', post_owner_id;
    
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
      COALESCE(from_username, 'Quelqu''un') || ' a aimé le post de ' || COALESCE(pet_name, 'votre animal'),
      NEW.post_id,
      NEW.user_id,
      false,
      now()
    ) RETURNING id INTO notification_id;
    
    RAISE NOTICE 'Like notification created with ID: %', notification_id;
  ELSE
    RAISE NOTICE 'No notification created - same user or no post owner found';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_like_notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a more robust comment notification function
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
  notification_id UUID;
BEGIN
  RAISE NOTICE 'Comment notification trigger fired for post_id: %, user_id: %', NEW.post_id, NEW.user_id;
  
  -- Get the post owner and pet name
  SELECT pets.owner_id, pets.name 
  INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  RAISE NOTICE 'Found post owner: %, pet name: %', post_owner_id, pet_name;
  
  -- Get the username of the person who commented
  SELECT username 
  INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  RAISE NOTICE 'From username: %', from_username;
  
  -- Only create notification if someone else commented on the post
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    RAISE NOTICE 'Creating comment notification for user: %', post_owner_id;
    
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
      COALESCE(from_username, 'Quelqu''un') || ' a commenté le post de ' || COALESCE(pet_name, 'votre animal'),
      NEW.post_id,
      NEW.user_id,
      false,
      now()
    ) RETURNING id INTO notification_id;
    
    RAISE NOTICE 'Comment notification created with ID: %', notification_id;
  ELSE
    RAISE NOTICE 'No notification created - same user or no post owner found';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_comment_notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the triggers
CREATE TRIGGER after_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Ensure the notification policies are correct
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Recreate policies
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow system to create notifications (this is crucial for triggers)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Enable logging to see what's happening
SET log_statement = 'all';
SET log_min_messages = 'notice';