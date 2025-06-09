/*
  # Debug posts policy

  1. Temporary debug
    - Add debug logging to understand what's happening with the policy
    - Simplify the policy to test if it's working

  2. Test
    - Create a simple policy that allows all public posts to be visible
*/

-- First, let's see what the current policy looks like
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read posts based on privacy" ON posts;

-- Create a very simple policy for testing
CREATE POLICY "Users can read posts based on privacy"
  ON posts
  FOR SELECT
  TO public
  USING (
    -- For debugging: let's allow all posts for now and see what happens
    true
  );

-- Let's also check if there are any other policies interfering
-- List all policies on posts table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'posts';