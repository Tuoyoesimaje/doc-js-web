# How to Create Employee Accounts

## Quick Guide (5 Minutes Per Employee)

---

## Step 1: Get Pickup Location IDs

First, you need to know the location IDs. Run this in Supabase SQL Editor:

```sql
SELECT id, name FROM pickup_locations;
```

**Result will look like:**
```
id: 123e4567-e89b-12d3-a456-426614174000 | name: Doc JS Effurun
id: 223e4567-e89b-12d3-a456-426614174001 | name: Doc JS Airport Road
id: 323e4567-e89b-12d3-a456-426614174002 | name: Doc JS Ubeji
```

Copy the `id` for the location where the employee will work.

---

## Step 2: Employee Signs Up

Have the employee go to: **www.docjslaundry.com/app/login**

1. Click "Sign Up" or use the signup form
2. Enter their email and create a password
3. Complete signup

**Example:**
- Email: `john@docjslaundry.com`
- Password: `SecurePassword123`

---

## Step 3: Get Employee's User ID

### Option A: From Supabase Dashboard (Easiest)
1. Go to Supabase Dashboard
2. Click "Authentication" in sidebar
3. Click "Users"
4. Find the employee by email
5. Copy their `id` (UUID)

### Option B: From SQL Editor
```sql
SELECT id, email FROM auth.users 
WHERE email = 'john@docjslaundry.com';
```

Copy the `id` from the result.

---

## Step 4: Create Employee Record

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO employees (
  user_id, 
  pickup_location_id, 
  employee_name, 
  phone, 
  role
)
VALUES (
  'PASTE_USER_ID_HERE',           -- From Step 3
  'PASTE_LOCATION_ID_HERE',       -- From Step 1
  'John Doe',                      -- Employee's full name
  '08012345678',                   -- Employee's phone
  'staff'                          -- Role: 'staff', 'manager', or 'admin'
);
```

**Real Example:**
```sql
INSERT INTO employees (
  user_id, 
  pickup_location_id, 
  employee_name, 
  phone, 
  role
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '223e4567-e89b-12d3-a456-426614174001',
  'John Doe',
  '08012345678',
  'staff'
);
```

---

## Step 5: Test Employee Login

1. Go to: **www.docjslaundry.com/app/employee/login**
2. Login with the employee's email and password
3. Should see employee dashboard
4. Try creating a walk-in order

---

## Complete Example (Copy & Paste Template)

### 1. Get Location IDs
```sql
SELECT id, name FROM pickup_locations;
```

### 2. Employee Signs Up
- URL: www.docjslaundry.com/app/login
- Email: employee@docjslaundry.com
- Password: (employee creates)

### 3. Get User ID
```sql
SELECT id, email FROM auth.users 
WHERE email = 'employee@docjslaundry.com';
```

### 4. Create Employee Record
```sql
INSERT INTO employees (user_id, pickup_location_id, employee_name, phone, role)
VALUES (
  'USER_ID_FROM_STEP_3',
  'LOCATION_ID_FROM_STEP_1',
  'Employee Full Name',
  '08012345678',
  'staff'
);
```

### 5. Verify
```sql
SELECT 
  e.employee_name,
  e.phone,
  e.role,
  pl.name as location_name,
  u.email
FROM employees e
JOIN pickup_locations pl ON e.pickup_location_id = pl.id
JOIN auth.users u ON e.user_id = u.id
WHERE e.employee_name = 'Employee Full Name';
```

---

## Creating Multiple Employees

### For Effurun Location:
```sql
-- Get Effurun location ID
SELECT id FROM pickup_locations WHERE name = 'Doc JS Effurun';

-- Create employees (replace USER_IDs)
INSERT INTO employees (user_id, pickup_location_id, employee_name, phone, role)
VALUES 
  ('user-id-1', 'effurun-location-id', 'Employee 1', '08011111111', 'staff'),
  ('user-id-2', 'effurun-location-id', 'Employee 2', '08022222222', 'staff'),
  ('user-id-3', 'effurun-location-id', 'Manager Name', '08033333333', 'manager');
```

---

## Employee Roles

### staff
- Can create walk-in orders
- Can view orders at their location
- Can generate tags
- Cannot update order status

### manager
- All staff permissions
- Can update order status
- Can view location analytics

### admin
- All manager permissions
- Can view all locations
- Full system access

---

## Troubleshooting

### Error: "You are not registered as an employee"
**Problem**: Employee record not created or user_id doesn't match

**Fix**:
```sql
-- Check if employee record exists
SELECT * FROM employees WHERE user_id = 'USER_ID';

-- If not found, create it using Step 4
```

### Error: "Cannot find user"
**Problem**: Employee hasn't signed up yet

**Fix**: Have employee complete Step 2 first

### Employee Can't See Orders
**Problem**: Wrong location assigned

**Fix**:
```sql
-- Update employee's location
UPDATE employees 
SET pickup_location_id = 'CORRECT_LOCATION_ID'
WHERE user_id = 'USER_ID';
```

### Employee Shows as Inactive
**Problem**: is_active set to false

**Fix**:
```sql
-- Activate employee
UPDATE employees 
SET is_active = true
WHERE user_id = 'USER_ID';
```

---

## Quick Reference Commands

### View All Employees
```sql
SELECT 
  e.employee_name,
  e.phone,
  e.role,
  pl.name as location,
  u.email,
  e.is_active
FROM employees e
JOIN pickup_locations pl ON e.pickup_location_id = pl.id
JOIN auth.users u ON e.user_id = u.id
ORDER BY pl.name, e.employee_name;
```

### View Employees by Location
```sql
SELECT 
  e.employee_name,
  e.phone,
  e.role,
  u.email
FROM employees e
JOIN auth.users u ON e.user_id = u.id
WHERE e.pickup_location_id = (
  SELECT id FROM pickup_locations WHERE name = 'Doc JS Effurun'
);
```

### Deactivate Employee
```sql
UPDATE employees 
SET is_active = false
WHERE employee_name = 'Employee Name';
```

### Change Employee Location
```sql
UPDATE employees 
SET pickup_location_id = (
  SELECT id FROM pickup_locations WHERE name = 'Doc JS Airport Road'
)
WHERE employee_name = 'Employee Name';
```

### Promote to Manager
```sql
UPDATE employees 
SET role = 'manager'
WHERE employee_name = 'Employee Name';
```

---

## Bulk Employee Creation Script

If you have multiple employees to create:

```sql
-- Step 1: Get location IDs
SELECT id, name FROM pickup_locations;

-- Step 2: Have all employees sign up first

-- Step 3: Get all user IDs
SELECT id, email FROM auth.users 
WHERE email IN (
  'employee1@docjslaundry.com',
  'employee2@docjslaundry.com',
  'employee3@docjslaundry.com'
);

-- Step 4: Create all employee records at once
INSERT INTO employees (user_id, pickup_location_id, employee_name, phone, role)
VALUES 
  ('user-id-1', 'location-id-effurun', 'John Doe', '08011111111', 'staff'),
  ('user-id-2', 'location-id-effurun', 'Jane Smith', '08022222222', 'staff'),
  ('user-id-3', 'location-id-airport', 'Bob Johnson', '08033333333', 'manager'),
  ('user-id-4', 'location-id-ubeji', 'Alice Williams', '08044444444', 'staff');
```

---

## Summary

**To create an employee:**
1. Get location ID from database
2. Employee signs up at /app/login
3. Get employee's user ID from Supabase
4. Run INSERT SQL to create employee record
5. Employee can now login at /app/employee/login

**Time per employee**: ~5 minutes

---

## Need Help?

If you get stuck:
1. Check Supabase logs for errors
2. Verify employee signed up successfully
3. Confirm location ID is correct
4. Make sure user_id matches exactly
5. Check is_active is true

---

**Quick Start**: Just follow Steps 1-5 above for each employee!
