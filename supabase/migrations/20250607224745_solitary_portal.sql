/*
  # Add privacy settings for posts

  1. Schema Changes
    - Add `is_private` column to posts table
    - Add `friends` table for friend relationships
    - Update RLS policies to respect privacy settings

  2. New Tables
    - `friends` table to manage friend relationships between users

  3. Security
    - Update post visibility policies based on privacy settings
    - Private posts only visible to owner and friends
    - Public posts visible to everyone
*/

-- Add is_private column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_private BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create friends table for friend relationships
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Friends table policies
CREATE POLICY "Users can read their own friend relationships"
  ON friends
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend requests they received"
  ON friends
  FOR UPDATE
  USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend relationships"
  ON friends
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Update posts policies to handle privacy
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;

-- New policy for reading posts based on privacy
CREATE POLICY "Users can read posts based on privacy"
  ON posts
  FOR SELECT
  USING (
    -- Public posts are visible to everyone
    is_private = false
    OR
    -- Private posts are visible to the owner
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = posts.pet_id
      AND pets.owner_id = auth.uid()
    )
    OR
    -- Private posts are visible to friends of the owner
    (
      is_private = true
      AND EXISTS (
        SELECT 1 FROM pets
        JOIN friends ON (
          (friends.user_id = pets.owner_id AND friends.friend_id = auth.uid())
          OR
          (friends.friend_id = pets.owner_id AND friends.user_id = auth.uid())
        )
        WHERE pets.id = posts.pet_id
        AND friends.status = 'accepted'
      )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for friends table
CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();