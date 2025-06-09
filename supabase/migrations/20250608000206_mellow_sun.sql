/*
  # Add INSERT policy for notifications table

  1. Security Changes
    - Add INSERT policy for notifications table to allow authenticated users to create notifications
    - This policy allows any authenticated user to insert notifications, which is needed for database triggers
      that create notifications when users like posts or add comments

  The policy allows INSERT operations for authenticated users since notifications are typically
  created by database triggers/functions when users interact with posts (likes, comments).
*/

-- Add INSERT policy for notifications table
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);