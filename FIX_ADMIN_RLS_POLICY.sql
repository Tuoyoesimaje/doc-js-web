-- Allow users to read their own admin status after login
-- This is needed for the admin OTP flow to work

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can read own admin status" ON users;

-- Create policy to allow users to read their own record (including admin status)
CREATE POLICY "Users can read own admin status"
  ON users FOR SELECT
  USING (id = auth.uid());
