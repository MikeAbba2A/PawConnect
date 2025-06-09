/*
  # Add CASCADE DELETE constraints for post deletion

  1. Changes
    - Drop existing foreign key constraints for comments and likes tables
    - Recreate them with ON DELETE CASCADE to automatically delete related records
    - This ensures that when a post is deleted, all associated comments and likes are automatically removed

  2. Security
    - No changes to RLS policies
    - Maintains existing data integrity while fixing deletion issues
*/

-- Drop existing foreign key constraints
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_post_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_post_id_fkey;

-- Recreate foreign key constraints with CASCADE DELETE
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE likes 
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;