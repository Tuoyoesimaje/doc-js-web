# Design Document: Customer Portal App

## Overview

The Doc JS Laundry Customer Portal is a React-based web application that enables customers to book laundry services, make payments via Monnify, and track orders in real-time. The app integrates with an existing static marketing site and uses Supabase as a fully managed backend (authentication, database, storage, edge functions).

**Key Design Principles:**
- **Speed First**: Complete order flow in ≤2 minutes
- **Minimal SMS**: Use SMS only for critical notifications (OTP, order confirmed, ready)
- **No Custom Backend**: Leverage Supabase for all backend needs
- **Progressive Enhancement**: Quick text parsing as default, visual UI as fallback
- **Mobile-First**: Responsive design from 320px to 1920px

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    docjslaundry.com                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │  Marketing Site      │  │   Customer Portal App    │   │
│  │  (Static HTML/CSS)   │  │   (React on Vercel)      │   │
│  │  /                   │  │   /app/*                 │   │
│  └──────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────┐  ┌──────────────┐
            │   Supabase   │ │ Monnify  │  │  SMS/Email   │
            │   Backend    │ │ Payments │  │  Services    │
            └──────────────┘ └──────────┘  └──────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- React Router (routing)
- Zustand (state management)
- @supabase/supabase-js (backend client)

**Backend (Supabase):**
- Supabase Auth (Google OAuth + Phone OTP)
- Supabase Postgres (database with RLS)
- Supabase Storage (file uploads)
- Supabase Edge Functions (webhooks, notifications)

**External Services:**
- Monnify (payment processing)
- SMS provider (OTP and critical notifications)
- Email service (order updates, receipts)

### Deployment Architecture

- **Marketing Site**: Existing hosting (stays unchanged)
- **React App**: Vercel deployment at `/app` path or `app.docjslaundry.com` subdomain
- **Backend**: Supabase managed infrastructure
- **CDN**: Vercel Edge Network for React app assets


## Components and Interfaces

### Component Hierarchy

```
AppRoot
├── AuthProvider (context)
├── Router
│   ├── LoginPage
│   │   └── LoginModal
│   │       ├── GoogleLoginButton
│   │       └── PhoneLoginForm
│   ├── DashboardPage
│   │   ├── WelcomeHeader
│   │   ├── QuickActions
│   │   └── RecentOrders
│   ├── NewOrderPage
│   │   ├── OrderModeSelector
│   │   ├── QuickOrderInput
│   │   ├── VisualOrderGrid
│   │   ├── OrderReview
│   │   ├── AddressPicker
│   │   └── PaymentButton
│   ├── OrdersListPage
│   │   └── OrderCard[]
│   ├── OrderDetailPage
│   │   ├── OrderHeader
│   │   ├── OrderItems
│   │   ├── StatusTimeline
│   │   └── OrderActions
│   └── AdminPanel (hidden route)
│       ├── OrdersTable
│       ├── StatusUpdateForm
│       └── OrderStats
└── Shared Components
    ├── Button
    ├── Input
    ├── Modal
    ├── LoadingSpinner
    ├── ErrorBoundary
    └── Toast
```

### Core Components

#### 1. AppRoot
**Purpose**: Application entry point with routing and global providers

**Props**: None

**State**: 
- `user`: Current authenticated user
- `session`: Supabase session

**Key Methods**:
- `initializeApp()`: Load session, check auth state
- `handleAuthChange()`: React to auth state changes

#### 2. LoginModal
**Purpose**: Handle Google and phone authentication

**Props**:
- `isOpen: boolean`
- `onClose: () => void`

**State**:
- `authMode: 'google' | 'phone' | 'otp' | 'setPassword'`
- `phoneNumber: string`
- `otpCode: string`
- `password: string`
- `loading: boolean`
- `error: string | null`

**Key Methods**:
- `handleGoogleLogin()`: Initiate Google OAuth flow
- `handlePhoneSendOTP()`: Send OTP to phone number
- `handleVerifyOTP()`: Verify OTP code
- `handleSetPassword()`: Set password for phone user
- `handlePhonePasswordLogin()`: Login with phone + password

#### 3. QuickOrderInput
**Purpose**: Parse bulk text into order items

**Props**:
- `onItemsParsed: (items: OrderItem[]) => void`

**State**:
- `inputText: string`
- `parsedItems: OrderItem[]`
- `parseErrors: string[]`

**Key Methods**:
- `parseBulkOrder(text: string): OrderItem[]`
- `handleTextChange(text: string)`: Debounced parsing
- `validateParsedItems()`: Check for ambiguous items

#### 4. VisualOrderGrid
**Purpose**: Icon-based service selection with quantity controls

**Props**:
- `services: Service[]`
- `selectedItems: Map<string, number>`
- `onItemsChange: (items: Map<string, number>) => void`

**State**:
- `quantities: Map<serviceId, quantity>`

**Key Methods**:
- `incrementQuantity(serviceId: string)`
- `decrementQuantity(serviceId: string)`
- `calculateTotal(): number`

#### 5. AddressPicker
**Purpose**: Select or add delivery address

**Props**:
- `addresses: Address[]`
- `selectedAddressId: string | null`
- `onAddressSelect: (id: string) => void`
- `onAddressAdd: (address: Address) => void`

**State**:
- `showAddForm: boolean`
- `newAddress: Partial<Address>`

**Key Methods**:
- `handleSelectAddress(id: string)`
- `handleAddAddress(address: Address)`
- `validateAddress(address: Address): boolean`

#### 6. StatusTimeline
**Purpose**: Visual representation of order status progression

**Props**:
- `currentStatus: OrderStatus`
- `events: OrderEvent[]`

**State**: None (presentational)

**Key Methods**:
- `getStatusIcon(status: OrderStatus): ReactNode`
- `isStatusComplete(status: OrderStatus): boolean`

#### 7. AdminPanel
**Purpose**: Admin interface for order management

**Props**: None (admin-only route)

**State**:
- `orders: Order[]`
- `filters: { status?: OrderStatus, search?: string }`
- `selectedOrder: Order | null`

**Key Methods**:
- `fetchOrders(filters: Filters): Promise<Order[]>`
- `updateOrderStatus(orderId: string, status: OrderStatus)`
- `sendNotification(orderId: string, type: NotificationType)`


## Data Models

### Database Schema (Supabase Postgres)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  display_name TEXT,
  google_provider_id TEXT,
  password_set BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

#### Addresses Table
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = TRUE;
```

#### Services Table
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  base_price_cents INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'item',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_key ON services(key);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = TRUE;
```

#### Orders Table
```sql
CREATE TYPE order_status AS ENUM ('received', 'processing', 'ready', 'delivered');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES addresses(id),
  total_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status order_status DEFAULT 'received',
  payment_status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

#### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  description TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  modifiers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

#### Order Events Table
```sql
CREATE TYPE event_type AS ENUM (
  'created', 
  'payment_received', 
  'received', 
  'processing', 
  'ready', 
  'delivered',
  'status_updated',
  'notification_sent'
);

CREATE TABLE order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  note TEXT,
  actor_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_events_order_id ON order_events(order_id, created_at DESC);
```

#### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'monnify',
  provider_payload JSONB NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### Uploads Table
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_user_id ON uploads(user_id);
```

### Row-Level Security (RLS) Policies

#### Users Table RLS
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

#### Addresses Table RLS
```sql
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  USING (auth.uid() = user_id);

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses"
  ON addresses FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

#### Orders Table RLS
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Edge functions can update orders (for webhooks)
CREATE POLICY "Service role can update orders"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');
```

#### Services Table RLS
```sql
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Everyone can read active services
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = TRUE);

-- Admins can manage services
CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

#### Payments Table RLS
```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their orders
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Edge functions can insert/update payments
CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```


### TypeScript Interfaces

```typescript
// User types
interface User {
  id: string;
  email?: string;
  phone?: string;
  display_name?: string;
  google_provider_id?: string;
  password_set: boolean;
  created_at: string;
  last_login?: string;
}

// Address types
interface Address {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Service types
interface Service {
  id: string;
  key: string;
  name: string;
  base_price_cents: number;
  unit: string;
  description?: string;
  is_active: boolean;
}

// Order types
type OrderStatus = 'received' | 'processing' | 'ready' | 'delivered';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface Order {
  id: string;
  user_id: string;
  address_id: string;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  address?: Address;
  items?: OrderItem[];
  events?: OrderEvent[];
}

interface OrderItem {
  id: string;
  order_id: string;
  service_id: string;
  description?: string;
  quantity: number;
  unit_price_cents: number;
  modifiers: Record<string, any>;
  // Joined data
  service?: Service;
}

// Event types
type EventType = 
  | 'created' 
  | 'payment_received' 
  | 'received' 
  | 'processing' 
  | 'ready' 
  | 'delivered'
  | 'status_updated'
  | 'notification_sent';

interface OrderEvent {
  id: string;
  order_id: string;
  event_type: EventType;
  note?: string;
  actor_user_id?: string;
  created_at: string;
}

// Payment types
interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_payload: Record<string, any>;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

// Upload types
interface Upload {
  id: string;
  user_id: string;
  object_key: string;
  url: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Parsed order item (from QuickOrder)
interface ParsedOrderItem {
  service_key: string;
  quantity: number;
  original_text: string;
  confidence: 'high' | 'medium' | 'low';
}
```


## Authentication Flow Design

### Google OAuth Flow

```
1. User clicks "Sign in with Google"
2. App calls supabase.auth.signInWithOAuth({ provider: 'google' })
3. User redirected to Google consent screen
4. Google redirects back to app with auth code
5. Supabase exchanges code for session
6. App receives session via onAuthStateChange
7. Check if user record exists in users table
8. If not, create user record with google_provider_id
9. Redirect to dashboard
```

### Phone OTP Flow (First Time)

```
1. User enters phone number
2. App calls supabase.auth.signInWithOtp({ phone })
3. Supabase sends SMS with 6-digit code
4. User enters OTP code
5. App calls supabase.auth.verifyOtp({ phone, token })
6. Supabase creates auth user and returns session
7. App checks users table for phone number
8. If not found, create user record with password_set=false
9. Show "Set Password" modal
10. User enters new password
11. App calls supabase.auth.updateUser({ password })
12. Update users.password_set = true
13. Redirect to dashboard
```

### Phone Password Flow (Returning User)

```
1. User enters phone number and password
2. App calls supabase.auth.signInWithPassword({ phone, password })
3. Supabase validates credentials and returns session
4. Redirect to dashboard
```

### Forgot Password Flow

```
1. User clicks "Forgot Password"
2. User enters phone number
3. App calls supabase.auth.signInWithOtp({ phone })
4. User enters OTP code
5. App calls supabase.auth.verifyOtp({ phone, token })
6. Show "Reset Password" modal
7. User enters new password
8. App calls supabase.auth.updateUser({ password })
9. Redirect to dashboard
```

### Session Persistence

```typescript
// Initialize Supabase client with session persistence
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Update user state
    setUser(session?.user);
  } else if (event === 'SIGNED_OUT') {
    // Clear user state
    setUser(null);
  } else if (event === 'TOKEN_REFRESHED') {
    // Session refreshed automatically
    console.log('Token refreshed');
  }
});
```

### Auth Hook Implementation

```typescript
// useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`
      }
    });
    if (error) throw error;
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    if (error) throw error;
    return data;
  };

  const setPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    
    // Update password_set flag in users table
    await supabase
      .from('users')
      .update({ password_set: true })
      .eq('id', user?.id);
  };

  const signInWithPassword = async (phone: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    setPassword,
    signInWithPassword,
    signOut
  };
}
```


## Quick Order Parser Algorithm

### Parser Design

The Quick Order parser uses a combination of regex patterns and heuristics to extract garment types and quantities from natural language text.

### Algorithm Pseudocode

```typescript
function parseBulkOrder(input: string): ParsedOrderItem[] {
  const items: ParsedOrderItem[] = [];
  const lines = input.split(/\n|,|;/).map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    // Pattern 1: "10 shirts" or "10x shirts"
    const pattern1 = /(\d+)\s*x?\s+([a-z\s]+)/i;
    
    // Pattern 2: "shirts 10" or "shirts: 10"
    const pattern2 = /([a-z\s]+)[\s:]+(\d+)/i;
    
    // Pattern 3: "wash 50 clothes" (generic)
    const pattern3 = /wash\s+(\d+)\s+clothes/i;
    
    let match = line.match(pattern1) || line.match(pattern2);
    
    if (match) {
      const quantity = parseInt(match[1]);
      const garmentText = match[2].toLowerCase().trim();
      const serviceKey = mapGarmentToService(garmentText);
      
      if (serviceKey) {
        items.push({
          service_key: serviceKey,
          quantity,
          original_text: line,
          confidence: 'high'
        });
      } else {
        items.push({
          service_key: 'unknown',
          quantity,
          original_text: line,
          confidence: 'low'
        });
      }
    } else if (line.match(pattern3)) {
      // Generic "wash X clothes" - prompt user to specify
      items.push({
        service_key: 'mixed',
        quantity: parseInt(line.match(pattern3)![1]),
        original_text: line,
        confidence: 'low'
      });
    }
  }
  
  return items;
}

function mapGarmentToService(text: string): string | null {
  const mappings: Record<string, string[]> = {
    'tshirt': ['tshirt', 't-shirt', 't shirt', 'tee', 'polo'],
    'shirt': ['shirt', 'long sleeve', 'short sleeve'],
    'trouser': ['trouser', 'trousers', 'pants', 'jeans'],
    'native': ['native', 'senator', 'agbada', 'kaftan', 'jalabiya'],
    'suit': ['suit', 'blazer', 'jacket'],
    'bedsheet': ['bedsheet', 'bed sheet', 'sheet'],
    'duvet': ['duvet', 'comforter', 'blanket'],
    'gown': ['gown', 'dress', 'evening gown'],
    'tie': ['tie', 'necktie'],
    'scarf': ['scarf', 'headscarf']
  };
  
  for (const [key, aliases] of Object.entries(mappings)) {
    if (aliases.some(alias => text.includes(alias))) {
      return key;
    }
  }
  
  return null;
}
```

### Parser Examples

**Input**: "10 shirts, 5 trousers, 2 suits"
**Output**:
```json
[
  { "service_key": "shirt", "quantity": 10, "original_text": "10 shirts", "confidence": "high" },
  { "service_key": "trouser", "quantity": 5, "original_text": "5 trousers", "confidence": "high" },
  { "service_key": "suit", "quantity": 2, "original_text": "2 suits", "confidence": "high" }
]
```

**Input**: "wash 50 clothes"
**Output**:
```json
[
  { "service_key": "mixed", "quantity": 50, "original_text": "wash 50 clothes", "confidence": "low" }
]
```

**Input**: "3x polo shirts\n5 jeans\nbedsheet 2"
**Output**:
```json
[
  { "service_key": "tshirt", "quantity": 3, "original_text": "3x polo shirts", "confidence": "high" },
  { "service_key": "trouser", "quantity": 5, "original_text": "5 jeans", "confidence": "high" },
  { "service_key": "bedsheet", "quantity": 2, "original_text": "bedsheet 2", "confidence": "high" }
]
```

### Parser Error Handling

1. **Ambiguous Items**: Items with `confidence: 'low'` are flagged for user review
2. **Unknown Garments**: Items with `service_key: 'unknown'` show a dropdown to select correct service
3. **No Matches**: If no items parsed, suggest switching to Visual Order mode
4. **Duplicate Items**: Merge quantities for same service_key


## Payment Integration Design

### Monnify Integration Architecture

```
┌─────────────────┐
│  React App      │
│  (Customer)     │
└────────┬────────┘
         │ 1. Create Order
         ▼
┌─────────────────┐
│  Supabase       │
│  Edge Function  │
│  (init-payment) │
└────────┬────────┘
         │ 2. Initialize Payment
         ▼
┌─────────────────┐
│  Monnify API    │
└────────┬────────┘
         │ 3. Payment URL
         ▼
┌─────────────────┐
│  React App      │
│  (Redirect)     │
└─────────────────┘
         │ 4. Customer Pays
         ▼
┌─────────────────┐
│  Monnify        │
│  (Process)      │
└────────┬────────┘
         │ 5. Webhook
         ▼
┌─────────────────┐
│  Supabase       │
│  Edge Function  │
│  (webhook)      │
└────────┬────────┘
         │ 6. Update Order
         │ 7. Send SMS
         ▼
┌─────────────────┐
│  Database       │
│  + SMS Service  │
└─────────────────┘
```

### Edge Function: Initialize Payment

```typescript
// supabase/functions/init-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { orderId } = await req.json();
    
    // Get order details
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, users(*)')
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    
    // Initialize Monnify payment
    const monnifyResponse = await fetch('https://api.monnify.com/api/v1/merchant/transactions/init-transaction', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MONNIFY_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: order.total_cents / 100,
        customerName: order.users.display_name,
        customerEmail: order.users.email || `${order.users.phone}@docjslaundry.com`,
        paymentReference: `ORDER-${orderId}`,
        paymentDescription: `Laundry Order ${orderId}`,
        currencyCode: 'NGN',
        contractCode: Deno.env.get('MONNIFY_CONTRACT_CODE'),
        redirectUrl: `${Deno.env.get('APP_URL')}/app/orders/${orderId}`,
        paymentMethods: ['CARD', 'ACCOUNT_TRANSFER']
      })
    });
    
    const monnifyData = await monnifyResponse.json();
    
    // Store payment record
    await supabase.from('payments').insert({
      order_id: orderId,
      provider: 'monnify',
      provider_payload: monnifyData,
      amount_cents: order.total_cents,
      currency: 'NGN',
      status: 'pending'
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: monnifyData.responseBody.checkoutUrl 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Edge Function: Monnify Webhook

```typescript
// supabase/functions/monnify-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

serve(async (req) => {
  try {
    const payload = await req.json();
    const signature = req.headers.get('monnify-signature');
    
    // Verify webhook signature
    const expectedSignature = createHmac('sha512', Deno.env.get('MONNIFY_SECRET_KEY')!)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return new Response('Invalid signature', { status: 401 });
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { paymentReference, paymentStatus, amountPaid } = payload;
    const orderId = paymentReference.replace('ORDER-', '');
    
    if (paymentStatus === 'PAID') {
      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'paid', provider_payload: payload })
        .eq('order_id', orderId);
      
      // Update order status
      await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId);
      
      // Create order event
      await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          event_type: 'payment_received',
          note: `Payment of ₦${amountPaid} received via Monnify`
        });
      
      // Send SMS notification
      const { data: order } = await supabase
        .from('orders')
        .select('*, users(*)')
        .eq('id', orderId)
        .single();
      
      await sendSMS(
        order.users.phone,
        `Your order ${orderId.slice(0, 8)} has been confirmed! We'll notify you when it's ready.`
      );
      
      // Send email receipt
      await sendEmail(
        order.users.email || `${order.users.phone}@docjslaundry.com`,
        'Order Confirmed',
        `Your order has been received and payment confirmed.`
      );
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});

async function sendSMS(phone: string, message: string) {
  // SMS provider integration
  await fetch(Deno.env.get('SMS_API_URL')!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message })
  });
}

async function sendEmail(email: string, subject: string, body: string) {
  // Email provider integration (e.g., SendGrid, Resend)
  await fetch(Deno.env.get('EMAIL_API_URL')!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: email, subject, body })
  });
}
```

### Client-Side Payment Flow

```typescript
// Payment component
async function handlePayment(orderId: string) {
  try {
    setLoading(true);
    
    // Call edge function to initialize payment
    const { data, error } = await supabase.functions.invoke('init-payment', {
      body: { orderId }
    });
    
    if (error) throw error;
    
    // Redirect to Monnify checkout
    window.location.href = data.checkoutUrl;
  } catch (error) {
    console.error('Payment error:', error);
    toast.error('Failed to initialize payment. Please try again.');
  } finally {
    setLoading(false);
  }
}
```


## Notification System Design

### Notification Rules

**SMS Notifications (Critical Only):**
1. OTP for first-time phone login
2. Order confirmed (after payment received)
3. Order ready for pickup/delivery

**Email Notifications (All Others):**
1. Order receipt (after payment)
2. Order processing started
3. Order delivered
4. Rating request (after delivery)
5. Payment failed
6. Password reset confirmation

### Edge Function: Send Notifications

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationRequest {
  orderId: string;
  type: 'order_confirmed' | 'order_ready' | 'order_processing' | 'order_delivered';
}

serve(async (req) => {
  try {
    const { orderId, type }: NotificationRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Get order and user details
    const { data: order } = await supabase
      .from('orders')
      .select('*, users(*), order_items(*, services(*))')
      .eq('id', orderId)
      .single();
    
    if (!order) throw new Error('Order not found');
    
    const shortOrderId = orderId.slice(0, 8).toUpperCase();
    
    // Send appropriate notification based on type
    switch (type) {
      case 'order_confirmed':
        // SMS: Order confirmed
        await sendSMS(
          order.users.phone,
          `Order ${shortOrderId} confirmed! Total: ₦${order.total_cents / 100}. We'll notify you when ready.`
        );
        // Email: Receipt
        await sendEmail(
          order.users.email || `${order.users.phone}@docjslaundry.com`,
          'Order Receipt - Doc JS Laundry',
          generateReceiptEmail(order)
        );
        break;
        
      case 'order_processing':
        // Email only
        await sendEmail(
          order.users.email || `${order.users.phone}@docjslaundry.com`,
          'Your Order is Being Processed',
          `Your order ${shortOrderId} is now being processed. We'll notify you when it's ready!`
        );
        break;
        
      case 'order_ready':
        // SMS: Ready for pickup
        await sendSMS(
          order.users.phone,
          `Great news! Order ${shortOrderId} is ready for pickup/delivery. See you soon!`
        );
        // Email: Ready notification
        await sendEmail(
          order.users.email || `${order.users.phone}@docjslaundry.com`,
          'Your Order is Ready!',
          `Your order ${shortOrderId} is ready. Please arrange pickup or delivery.`
        );
        break;
        
      case 'order_delivered':
        // Email: Delivered + rating request
        await sendEmail(
          order.users.email || `${order.users.phone}@docjslaundry.com`,
          'Order Delivered - Rate Your Experience',
          generateDeliveredEmail(order)
        );
        break;
    }
    
    // Log notification event
    await supabase.from('order_events').insert({
      order_id: orderId,
      event_type: 'notification_sent',
      note: `${type} notification sent`
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function generateReceiptEmail(order: any): string {
  const items = order.order_items
    .map((item: any) => `${item.quantity}x ${item.services.name} - ₦${item.unit_price_cents / 100}`)
    .join('\n');
  
  return `
    Thank you for your order!
    
    Order ID: ${order.id.slice(0, 8).toUpperCase()}
    Total: ₦${order.total_cents / 100}
    
    Items:
    ${items}
    
    We'll notify you when your order is ready.
    
    Track your order: ${Deno.env.get('APP_URL')}/app/orders/${order.id}
  `;
}

function generateDeliveredEmail(order: any): string {
  return `
    Your order has been delivered!
    
    Order ID: ${order.id.slice(0, 8).toUpperCase()}
    
    How was your experience? Rate us:
    ${Deno.env.get('APP_URL')}/app/orders/${order.id}/rate
    
    Thank you for choosing Doc JS Laundry!
  `;
}
```

### Notification Retry Logic

```typescript
// Retry failed SMS notifications with exponential backoff
async function sendSMSWithRetry(phone: string, message: string, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sendSMS(phone, message);
      return { success: true };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`SMS failed after ${maxRetries} retries:`, error);
        return { success: false, error };
      }
      // Exponential backoff: 2^attempt seconds
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```


## Error Handling

### Error Boundary Component

```typescript
// ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to Supabase for debugging
    supabase.from('error_logs').insert({
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
      user_id: getCurrentUserId(),
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.href = '/app/dashboard'}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// api/client.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleSupabaseError<T>(
  promise: Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await promise;
  
  if (error) {
    // Map Supabase errors to user-friendly messages
    const message = getErrorMessage(error);
    throw new APIError(message, error.status || 500, error.code);
  }
  
  if (!data) {
    throw new APIError('No data returned', 404);
  }
  
  return data;
}

function getErrorMessage(error: any): string {
  const errorMap: Record<string, string> = {
    'PGRST116': 'No data found',
    '23505': 'This record already exists',
    '23503': 'Related record not found',
    '42501': 'You do not have permission to perform this action',
    'auth/invalid-phone': 'Invalid phone number format',
    'auth/invalid-otp': 'Invalid or expired OTP code',
    'auth/weak-password': 'Password must be at least 8 characters'
  };
  
  return errorMap[error.code] || error.message || 'An unexpected error occurred';
}
```

### Network Error Handling

```typescript
// hooks/useRetry.ts
export function useRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  
  const executeWithRetry = async (): Promise<T> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          onError?.(error as Error);
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
    throw new Error('Max retries exceeded');
  };
  
  return executeWithRetry;
}
```

### Form Validation

```typescript
// utils/validation.ts
export const validators = {
  phone: (value: string): string | null => {
    const phoneRegex = /^\+?234[0-9]{10}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid Nigerian phone number';
    }
    return null;
  },
  
  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  password: (value: string): string | null => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    return null;
  },
  
  required: (value: any): string | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return null;
  }
};
```

