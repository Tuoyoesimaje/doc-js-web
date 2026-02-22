# New Features Implementation Plan

## Feature 1: Employee/Pickup Location Portal 🏪

### Overview
Employees at pickup locations can register walk-in customers and tag clothes with unique IDs.

### User Flow:
1. **Employee Login** → Separate portal for pickup location staff
2. **Customer Walks In** → Employee creates order for them
3. **Select Services** → Same visual selector as customer portal
4. **Generate Garment IDs** → Each clothing item gets unique tag number
5. **Print Tags** → Employee prints/writes tag numbers on clothes
6. **Track by Tag** → Admin and customer can track by tag number

### Database Changes Needed:

```sql
-- Add pickup_locations table
CREATE TABLE pickup_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  pickup_location_id UUID REFERENCES pickup_locations(id),
  employee_name TEXT NOT NULL,
  role TEXT DEFAULT 'staff', -- staff, manager
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add garment_tags table (unique ID for each clothing item)
CREATE TABLE garment_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_number TEXT UNIQUE NOT NULL, -- e.g., "DJS-001234"
  order_id UUID REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  service_name TEXT,
  customer_name TEXT,
  pickup_location_id UUID REFERENCES pickup_locations(id),
  status TEXT DEFAULT 'received', -- received, processing, ready, delivered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);
```

### New Pages:
1. **EmployeeLoginPage** - Login for pickup location staff
2. **EmployeePortal** - Dashboard for employees
3. **WalkInOrderPage** - Create order for walk-in customer
4. **TaggingPage** - Generate and print garment tags

### Features:
- ✅ Employee can create orders for walk-in customers
- ✅ Auto-generate unique tag numbers (DJS-001234)
- ✅ Print tag labels
- ✅ Track each garment individually
- ✅ Update garment status
- ✅ View all orders at their location

---

## Feature 2: Guest Checkout (Order Before Account) 🛒

### Overview
Users can select services and create orders BEFORE creating an account.

### User Flow:
1. **Click "Open Customer Portal"** → Goes to order selection (NOT login)
2. **Select Services** → Visual selector + quick input
3. **Add Address** → Manual address input (not saved yet)
4. **Select Logistics** → Pickup/delivery options
5. **Choose Payment** → Prepay/postpay
6. **Click "Proceed to Payment"** → NOW shows login/signup
7. **Create Account or Login** → Quick signup form
8. **Complete Payment** → Monnify payment
9. **Redirected to Dashboard** → Can track order

### Changes Needed:

#### 1. Update Marketing Site
- Change "Open Customer Portal" button to go to `/app/order` (not `/app/login`)
- Add "Login" and "Sign Up" buttons in header

#### 2. Create Guest Order Flow
- Store order details in localStorage before auth
- After login/signup, retrieve and create order
- Generate account automatically with order

#### 3. New Route Structure
```
/app/order → Guest order page (no auth required)
/app/login → Login page
/app/signup → Signup page
/app/dashboard → After auth (existing)
```

### Implementation:
1. **GuestOrderPage** - Order selection without auth
2. **QuickSignupModal** - Fast signup during checkout
3. **OrderStorage** - Save order in localStorage
4. **Auto-create account** - After payment success

---

## Feature 3: Unique Garment IDs for All Orders 🏷️

### Overview
Every clothing item gets a unique tracking number, whether ordered online or walk-in.

### Tag Number Format:
```
DJS-YYMMDD-XXXX
Example: DJS-250115-0001

DJS = Doc JS Laundry
YYMMDD = Date (25/01/15)
XXXX = Sequential number
```

### Features:
- ✅ Auto-generate tag numbers for online orders
- ✅ Employee generates tags for walk-in orders
- ✅ Print tag labels (PDF)
- ✅ Track by tag number
- ✅ Customer can search by tag number
- ✅ Admin can update status by tag

### Tag Lifecycle:
1. **Order Created** → Tags generated
2. **Clothes Received** → Tags printed and attached
3. **Processing** → Track by tag
4. **Ready** → Verify by tag
5. **Delivered** → Scan tag to confirm

---

## Implementation Priority

### Phase 1: Guest Checkout (Highest Priority)
**Why:** Removes barrier to entry, increases conversions
**Time:** 2-3 hours
**Files to create:**
- `app/src/pages/GuestOrderPage.tsx`
- `app/src/components/QuickSignupModal.tsx`
- `app/src/utils/orderStorage.ts`

### Phase 2: Garment Tagging System
**Why:** Core operational feature
**Time:** 3-4 hours
**Files to create:**
- Database migration for garment_tags
- `app/src/components/TagGenerator.tsx`
- `app/src/pages/TaggingPage.tsx`
- Tag printing functionality

### Phase 3: Employee Portal
**Why:** Enables walk-in customers
**Time:** 4-5 hours
**Files to create:**
- Database migrations for employees, pickup_locations
- `app/src/pages/EmployeeLoginPage.tsx`
- `app/src/pages/EmployeePortal.tsx`
- `app/src/pages/WalkInOrderPage.tsx`

---

## Database Schema Summary

```sql
-- New Tables:
1. pickup_locations (3 locations in Warri)
2. employees (staff at each location)
3. garment_tags (unique ID for each clothing item)

-- Modified Tables:
1. orders (add: created_by_employee_id, pickup_location_id)
2. order_items (add: garment_tag_id)
```

---

## Next Steps

1. **Start with Guest Checkout** (Feature 2)
   - Biggest impact on user experience
   - Removes signup barrier
   - Increases conversions

2. **Then Garment Tagging** (Feature 3)
   - Core operational need
   - Works for both online and walk-in

3. **Finally Employee Portal** (Feature 1)
   - Enables walk-in customers
   - Complete the system

---

## Questions to Clarify

1. **Employee Access:**
   - Should employees see all orders or only their location's orders?
   - Can employees update order status?

2. **Tag Printing:**
   - Do you have a label printer?
   - What size are the tags? (Small stickers?)

3. **Guest Checkout:**
   - Should we require phone number before account creation?
   - Email optional or required?

4. **Pickup Locations:**
   - Confirm 3 locations: Effurun, Airport Road, Ubeji?
   - Any other locations?

---

**Ready to start implementation! Which feature should we build first?**

I recommend: **Guest Checkout (Feature 2)** → **Garment Tagging (Feature 3)** → **Employee Portal (Feature 1)**
