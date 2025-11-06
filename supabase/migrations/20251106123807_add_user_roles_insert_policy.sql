/*
  # Add INSERT policy for user_roles table

  ## Summary
  Fixes the issue where users cannot set their role during signup by adding
  a missing INSERT policy to the user_roles table.

  ## Changes
  - Add INSERT policy allowing users to set their own role during registration
  
  ## Security
  - Users can only insert a role for themselves (auth.uid() = user_id)
  - This is essential for the signup flow to work properly
*/

-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert own role"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);