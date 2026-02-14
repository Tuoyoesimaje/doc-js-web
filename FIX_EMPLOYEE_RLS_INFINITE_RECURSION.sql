-- =============================================
-- FIX EMPLOYEE RLS INFINITE RECURSION
-- =============================================
-- This fixes the "infinite recursion detected in policy" error
-- by removing the recursive policy and simplifying the logic
-- =============================================

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Employees can view colleagues at their location" ON employees;

-- Drop the duplicate "Employees can view their own record" policy if it exists
DROP POLICY IF EXISTS "Employees can view their own record" ON employees;

-- Recreate a simple policy for employees to view their own record
CREATE POLICY "Employees can view own record"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all employees (this policy already exists, but recreating for safety)
DROP POLICY IF EXISTS "Admins can view all employees" ON employees;
CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Admins can manage employees (this policy already exists, but recreating for safety)
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
CREATE POLICY "Admins can manage employees"
  ON employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- =============================================
-- NOTES
-- =============================================
-- The "Employees can view colleagues at their location" policy was removed
-- because it caused infinite recursion by querying the employees table
-- within the policy itself.
--
-- If you need employees to see colleagues, you can:
-- 1. Query through the application layer with admin privileges
-- 2. Create a separate view or function that doesn't trigger RLS
-- 3. Use a materialized view that's updated periodically
--
-- For now, employees can only see their own record, which is sufficient
-- for the role-based redirect functionality.
-- =============================================
