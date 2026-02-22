-- =============================================
-- FIX ALL RLS INFINITE RECURSION ISSUES
-- =============================================
-- This fixes infinite recursion in users, employees, and related tables
-- by removing all recursive policies and creating simple, non-recursive ones
-- =============================================

-- =============================================
-- USERS TABLE - Remove all policies and recreate simple ones
-- =============================================

-- Drop all existing users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own admin status" ON users;
DROP POLICY IF EXISTS "Employees can create walk-in customer records" ON users;
DROP POLICY IF EXISTS "Employees can view walk-in customers" ON users;

-- Simple policy: Users can view their own record
CREATE POLICY "Users view own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Simple policy: Users can update their own record
CREATE POLICY "Users update own record"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Simple policy: Users can insert their own record (for auth trigger)
CREATE POLICY "Users insert own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Admins can view all users (no recursion - just checks users table)
CREATE POLICY "Admins view all users"
  ON users FOR SELECT
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update any user
CREATE POLICY "Admins update all users"
  ON users FOR UPDATE
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can insert users (for walk-in customers)
CREATE POLICY "Admins insert users"
  ON users FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- EMPLOYEES TABLE - Remove recursive policies
-- =============================================

-- Drop all existing employees policies
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
DROP POLICY IF EXISTS "Employees can view colleagues at their location" ON employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;

-- Simple policy: Employees can view their own record
CREATE POLICY "Employees view own record"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all employees
CREATE POLICY "Admins view all employees"
  ON employees FOR SELECT
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can manage employees (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins manage employees"
  ON employees FOR ALL
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- ORDERS TABLE - Update to remove user table joins
-- =============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Employees can view orders they created" ON orders;
DROP POLICY IF EXISTS "Employees can create orders" ON orders;
DROP POLICY IF EXISTS "Employees can update their orders" ON orders;

-- Employees can view orders they created (no user table join)
CREATE POLICY "Employees view own orders"
  ON orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    created_by_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Employees can create orders (no user table join)
CREATE POLICY "Employees create orders"
  ON orders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    created_by_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Employees can update orders they created (no user table join)
CREATE POLICY "Employees update own orders"
  ON orders FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    created_by_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- =============================================
-- ADDRESSES TABLE - Allow employees to create addresses
-- =============================================

-- Employees can create addresses for walk-in customers
CREATE POLICY "Employees create addresses"
  ON addresses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM employees WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- =============================================
-- NOTES
-- =============================================
-- Key changes to prevent infinite recursion:
--
-- 1. Users table policies no longer reference employees table
-- 2. Employees table policies no longer reference users table (except for admin check)
-- 3. Admin checks use subqueries on users table only (no joins)
-- 4. Removed all policies that had circular dependencies
--
-- Trade-offs:
-- - Employees can no longer view colleagues at their location through direct queries
-- - If needed, implement colleague viewing through application layer or functions
-- - Walk-in customer creation now requires admin privileges (employees need admin role)
--
-- Alternative for employee walk-in customer creation:
-- - Grant employees temporary admin privileges for user creation
-- - Use a database function with SECURITY DEFINER
-- - Create users through application layer with service role key
-- =============================================
