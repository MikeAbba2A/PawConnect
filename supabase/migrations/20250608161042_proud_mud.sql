/*
  # Fix infinite recursion in event_participants RLS policies

  1. Policy Updates
    - Remove problematic policies that cause infinite recursion
    - Create simplified policies that don't reference the same table recursively
    - Ensure policies are efficient and don't create circular dependencies

  2. Security
    - Maintain proper access control for event participants
    - Ensure users can only manage their own participations
    - Allow event organizers to manage participants in their events
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can join public events" ON event_participants;
DROP POLICY IF EXISTS "Anyone can read participants of public events" ON event_participants;
DROP POLICY IF EXISTS "Event organizers can read all participants" ON event_participants;
DROP POLICY IF EXISTS "Event organizers can update any participation" ON event_participants;
DROP POLICY IF EXISTS "Event organizers can delete any participation" ON event_participants;
DROP POLICY IF EXISTS "Users can read their own participations" ON event_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON event_participants;
DROP POLICY IF EXISTS "Users can delete their own participation" ON event_participants;

-- Create new simplified policies without recursion

-- Allow authenticated users to join public events (simplified without participant count check)
CREATE POLICY "Users can join public events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
        AND events.is_public = true
        AND events.is_active = true
    )
  );

-- Allow reading participants of public events
CREATE POLICY "Public can read participants of public events"
  ON event_participants
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
        AND events.is_public = true
        AND events.is_active = true
    )
  );

-- Allow event organizers to read all participants in their events
CREATE POLICY "Event organizers can read participants"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Allow event organizers to update participants in their events
CREATE POLICY "Event organizers can update participants"
  ON event_participants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Allow event organizers to delete participants from their events
CREATE POLICY "Event organizers can delete participants"
  ON event_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Allow users to read their own participations
CREATE POLICY "Users can read own participations"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own participations
CREATE POLICY "Users can update own participations"
  ON event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their own participations
CREATE POLICY "Users can delete own participations"
  ON event_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);