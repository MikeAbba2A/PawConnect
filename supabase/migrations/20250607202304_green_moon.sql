/*
  # Add INSERT policy for users table

  1. Security Changes
    - Add INSERT policy for 'users' table to allow authenticated users to create their own profile
    - This enables the signup process to work properly by allowing new users to insert their profile data

  The policy ensures that users can only insert a row where the user ID matches their authenticated user ID,
  maintaining security while enabling the signup flow.
*/

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);