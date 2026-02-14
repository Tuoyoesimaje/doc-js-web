# Fix Employee Login Error - Infinite Recursion in RLS Policy

## Problem

When logging in as any user, the app was throwing a 500 Internal Server Error:
```
GET .../employees?select=*&user_id=eq.[uuid]&is_active=eq.true 500 (Internal Server Error)
infinite recursion detected in policy for relation "employees"
```

## Root Cause

The RLS policy "Employees can view colleagues at their location" was causing infinite recursion:

```sql
CREATE POLICY "Employees can view colleagues at their location"
  ON employees FOR SELECT
  USING (
    pickup_location_id IN (
      SELECT pickup_location_id FROM employees WHERE user_id = auth.uid()
    )
  );
```

This policy queries the `employees` table within the policy itself, creating a circular dependency:
1. User tries to query employees table
2. RLS policy checks if user can access the row
3. Policy queries employees table to check location
4. That query triggers RLS again
5. Infinite loop → 500 error

## Solution

### 1. Run the SQL Migration

Execute `FIX_EMPLOYEE_RLS_INFINITE_RECURSION.sql` in your Supabase SQL Editor:

```sql
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Employees can view colleagues at their location" ON employees;

-- Keep only the simple, non-recursive policies
CREATE POLICY "Employees can view own record"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );
```

### 2. Updated Role-Based Redirect Logic

The `roleBasedRedirect.ts` utility has been updated to:
- Check admin status first (simpler query, no RLS issues)
- Handle employee check errors gracefully
- Log errors but continue execution
- Always return a valid redirect path

```typescript
// Check admin first (no RLS issues)
const { data: userData } = await supabase
  .from('users')
  .select('is_admin, role')
  .eq('id', userId)
  .single()

if (userData?.is_admin === true || userData?.role === 'admin') {
  return '/admin'
}

// Then check employee (with error handling)
const { data: employeeData, error: employeeError } = await supabase
  .from('employees')
  .select('id')
  .eq('user_id', userId)
  .eq('is_active', true)
  .maybeSingle()

if (employeeError) {
  console.error('Error checking employee status:', employeeError)
}

if (employeeData) {
  return '/employee'
}

// Default to customer
return '/dashboard'
```

## What Changed

### Before:
- ❌ Recursive RLS policy caused infinite loop
- ❌ Employee check happened first (more likely to fail)
- ❌ No error handling for RLS issues
- ❌ 500 errors blocked all logins

### After:
- ✅ Simple, non-recursive RLS policies
- ✅ Admin check happens first (more reliable)
- ✅ Graceful error handling
- ✅ Users can always log in, even if employee check fails

## Impact on Features

### What Still Works:
- ✅ Employees can view their own record
- ✅ Admins can view all employees
- ✅ Role-based redirect (employee → /employee, admin → /admin, customer → /dashboard)
- ✅ Employee login and portal access
- ✅ Walk-in order creation

### What Changed:
- ⚠️ Employees can no longer view colleagues at their location through direct queries
- ⚠️ If you need employees to see colleagues, implement it in the application layer with admin privileges or use a function

## Alternative Solutions (If Needed)

If you need employees to view colleagues at their location, you can:

### Option 1: Application-Layer Query
```typescript
// In your app, use a function that bypasses RLS
const { data } = await supabase.rpc('get_employees_at_location', {
  location_id: employeeLocationId
})
```

### Option 2: Create a Database Function
```sql
CREATE OR REPLACE FUNCTION get_employees_at_location(location_id UUID)
RETURNS TABLE (
  id UUID,
  employee_name TEXT,
  role TEXT
) 
SECURITY DEFINER -- Runs with function owner's privileges, bypassing RLS
AS $
BEGIN
  RETURN QUERY
  SELECT e.id, e.employee_name, e.role
  FROM employees e
  WHERE e.pickup_location_id = location_id
  AND e.is_active = true;
END;
$ LANGUAGE plpgsql;
```

### Option 3: Materialized View
```sql
CREATE MATERIALIZED VIEW employee_directory AS
SELECT id, employee_name, pickup_location_id, role
FROM employees
WHERE is_active = true;

-- Refresh periodically
REFRESH MATERIALIZED VIEW employee_directory;
```

## Testing Checklist

After applying the fix:

- [ ] Regular customer can log in → redirects to /dashboard
- [ ] Admin can log in → redirects to /admin
- [ ] Employee can log in → redirects to /employee
- [ ] No 500 errors in console
- [ ] No "infinite recursion" errors
- [ ] Employee portal loads correctly
- [ ] Walk-in order creation works

## Files Modified

1. `FIX_EMPLOYEE_RLS_INFINITE_RECURSION.sql` - SQL migration to fix RLS policies
2. `app/src/utils/roleBasedRedirect.ts` - Updated with better error handling and admin-first logic

---

**Status**: ✅ FIXED - Apply SQL migration and test
