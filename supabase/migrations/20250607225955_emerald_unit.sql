/*
  # Fix posts RLS policies completely

  1. Security Changes
    - Drop all existing policies on posts table
    - Create new, simple policies that work correctly
    - Ensure public posts are visible to everyone
    - Ensure private posts are visible to owner and friends

  This migration completely resets the posts table policies to ensure they work correctly.
*/

-- Drop ALL existing policies on posts table
DROP POLICY IF EXISTS "Users can read posts based on privacy" ON posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Users can insert posts for their pets" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create new, working policies

-- 1. SELECT policy - handle both public and private posts
CREATE POLICY "Posts visibility policy"
  ON posts
  FOR SELECT
  TO public
  USING (
    -- Public posts are visible to everyone (including anonymous users)
    (is_private = false)
    OR
    -- For authenticated users, also show private posts they can access
    (
      auth.uid() IS NOT NULL
      AND is_private = true
      AND (
        -- Owner can see their own posts
        EXISTS (
          SELECT 1 FROM pets
          WHERE pets.id = posts.pet_id
          AND pets.owner_id = auth.uid()
        )
        OR
        -- Friends can see private posts
        EXISTS (
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
    )
  );

-- 2. INSERT policy
CREATE POLICY "Users can insert posts for their pets"
  ON posts
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = posts.pet_id
      AND pets.owner_id = auth.uid()
    )
  );

-- 3. UPDATE policy
CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = posts.pet_id
      AND pets.owner_id = auth.uid()
    )
  );

-- 4. DELETE policy
CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = posts.pet_id
      AND pets.owner_id = auth.uid()
    )
  );