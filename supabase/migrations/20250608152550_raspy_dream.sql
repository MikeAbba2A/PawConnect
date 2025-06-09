/*
  # Fix infinite recursion in events RLS policies

  1. Problem
    - Current RLS policies on events table are causing infinite recursion
    - Policies reference event_participants which creates circular dependency
    
  2. Solution
    - Drop existing problematic policies
    - Create simplified, non-recursive policies
    - Ensure policies don't create circular references

  3. New Policies
    - Public can read public active events (simple condition)
    - Authenticated users can read their own events
    - Event organizers can manage their events
    - Remove complex subqueries that cause recursion
*/

-- Drop all existing policies on events table
DROP POLICY IF EXISTS "Anyone can read public active events" ON events;
DROP POLICY IF EXISTS "Users can read events they participate in" ON events;
DROP POLICY IF EXISTS "Users can read their own events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;

-- Create new simplified policies without recursion

-- Allow public to read public active events (simple condition, no subqueries)
CREATE POLICY "Public can read public active events"
  ON events
  FOR SELECT
  TO public
  USING (is_public = true AND is_active = true);

-- Allow authenticated users to read their own events
CREATE POLICY "Users can read own events"
  ON events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = organizer_id);

-- Allow authenticated users to create events
CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

-- Allow users to update their own events
CREATE POLICY "Users can update own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Allow users to delete their own events
CREATE POLICY "Users can delete own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = organizer_id);