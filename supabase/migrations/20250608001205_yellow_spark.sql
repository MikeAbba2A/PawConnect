/*
  # Fix notification system completely

  1. Debug and fix notification creation
    - Ensure proper RLS policies
    - Fix trigger functions
    - Add proper error handling
    - Test notification creation

  2. Security
    - Proper INSERT policy for notifications
    - Ensure triggers can create notifications
*/

-- First, let's check if the notifications table exists and has the right structure
-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
  message TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Create new policies
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

-- CRITICAL: Allow system to insert notifications (for triggers)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS after_like_insert ON likes;
DROP TRIGGER IF EXISTS after_comment_insert ON comments;
DROP FUNCTION IF EXISTS create_like_notification();
DROP FUNCTION IF EXISTS create_comment_notification();

-- Create improved notification functions with better error handling
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
BEGIN
  -- Get the post owner and pet name
  SELECT pets.owner_id, pets.name 
  INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  -- Get the username of the person who liked
  SELECT username 
  INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Only create notification if:
  -- 1. We found the post owner
  -- 2. The liker is not the post owner (no self-notifications)
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    BEGIN
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
      );
      
      RAISE NOTICE 'Like notification created for user % from user %', post_owner_id, NEW.user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create like notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    END;
  ELSE
    RAISE NOTICE 'No like notification created: post_owner_id=%, user_id=%', post_owner_id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
BEGIN
  -- Get the post owner and pet name
  SELECT pets.owner_id, pets.name 
  INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  -- Get the username of the person who commented
  SELECT username 
  INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Only create notification if:
  -- 1. We found the post owner
  -- 2. The commenter is not the post owner (no self-notifications)
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    BEGIN
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
      );
      
      RAISE NOTICE 'Comment notification created for user % from user %', post_owner_id, NEW.user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create comment notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    END;
  ELSE
    RAISE NOTICE 'No comment notification created: post_owner_id=%, user_id=%', post_owner_id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the triggers
CREATE TRIGGER after_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON notifications TO authenticated;