-- Fix RLS policy to allow employees to create walk-in customer users
-- This allows employees to create user records for walk-in customers

-- First, ensure the users table has proper defaults for id column
-- The id should be auto-generated as UUID
ALTER TABLE users 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Also ensure created_at and last_login have defaults
ALTER TABLE users 
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE users 
ALTER COLUMN last_login SET DEFAULT now();

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "employees_can_create_walkin_customers" ON users;

-- Create new policy that allows employees to insert walk-in customer records
CREATE POLICY "employees_can_create_walkin_customers"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the authenticated user is an employee
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.user_id = auth.uid()
  )
);

-- Also ensure employees can read user records they create
DROP POLICY IF EXISTS "employees_can_read_customer_users" ON users;

CREATE POLICY "employees_can_read_customer_users"
ON users
FOR SELECT
TO authenticated
USING (
  -- Employees can read any user record
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.user_id = auth.uid()
  )
  OR
  -- Users can read their own record
  id = auth.uid()
);

-- Grant necessary permissions
GRANT INSERT ON users TO authenticated;
GRANT SELECT ON users TO authenticated;
