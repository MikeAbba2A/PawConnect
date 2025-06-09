/*
  # Fix post deletion foreign key constraint

  1. Security Policy Updates
    - Add policy to allow post owners to delete all likes on their posts
    - This enables proper cascade deletion when removing posts

  2. Changes
    - New RLS policy: "Post owners can delete all likes on their posts"
    - Allows users to delete any like record associated with posts they own
*/

-- Add policy to allow post owners to delete all likes on their posts
CREATE POLICY "Post owners can delete all likes on their posts"
  ON likes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      JOIN pets ON posts.pet_id = pets.id 
      WHERE posts.id = likes.post_id 
      AND pets.owner_id = auth.uid()
    )
  );