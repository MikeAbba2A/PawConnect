/*
  # Fix public posts visibility policy

  1. Policy Updates
    - Update the posts SELECT policy to properly handle public posts
    - Ensure public posts (is_private = false) are visible to all authenticated users
    - Maintain privacy for private posts

  2. Security
    - Public posts: visible to everyone (authenticated users)
    - Private posts: visible only to owner and accepted friends
    - Maintain existing RLS protection
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read posts based on privacy" ON posts;

-- Create a new, clearer policy for reading posts
CREATE POLICY "Users can read posts based on privacy"
  ON posts
  FOR SELECT
  TO public
  USING (
    -- Public posts are visible to everyone
    (is_private = false)
    OR
    -- Private posts are visible to the pet owner
    (
      is_private = true
      AND EXISTS (
        SELECT 1 FROM pets
        WHERE pets.id = posts.pet_id
        AND pets.owner_id = auth.uid()
      )
    )
    OR
    -- Private posts are visible to friends of the pet owner
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