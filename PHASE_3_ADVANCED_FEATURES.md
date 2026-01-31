# Phase 3: Advanced Features

## Overview

Phase 3 focuses on making the app smarter and more user-friendly with advanced features that enhance the customer experience.

## Features to Implement

### 1. Natural Language Order Parsing
**Status**: Ready to implement  
**Priority**: HIGH

Allow users to type orders naturally like:
- "3 shirts, 2 trousers, 1 bedsheet"
- "5 polo shirts and 2 jeans"
- "1 agbada, 2 native wear, express delivery"

**Implementation**:
- Already have `QuickOrderInput` component
- Need to enhance `app/src/utils/orderParser.ts`
- Parse quantities, item names, and modifiers
- Match against services database
- Handle typos and variations

**Benefits**:
- Faster order creation
- Better UX for repeat customers
- Reduces clicks and navigation

---

### 2. Order Templates
**Status**: New feature  
**Priority**: MEDIUM

Let users save frequently ordered combinations:
- "Weekly Laundry" (5 shirts, 3 trousers, 2 bedsheets)
- "Work Clothes" (10 shirts, 5 trousers)
- "Special Occasion" (1 agbada, 1 native)

**Database Schema**:
```sql
CREATE TABLE order_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL, -- [{ service_id, quantity, modifiers }]
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_templates_user_id ON order_templates(user_id);
```

**UI Components**:
- Template picker on New Order page
- "Save as Template" button after order creation
- Template management page
- Quick reorder from template

---

### 3. Subscription Orders
**Status**: New feature  
**Priority**: MEDIUM

Recurring orders for regular customers:
- Weekly, bi-weekly, or monthly schedules
- Auto-create orders on schedule
- Auto-charge saved payment method
- Pause/resume subscriptions

**Database Schema**:
```sql
CREATE TYPE subscription_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES order_templates(id),
  frequency subscription_frequency NOT NULL,
  status subscription_status DEFAULT 'active',
  next_order_date DATE NOT NULL,
  last_order_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_date ON subscriptions(next_order_date) WHERE status = 'active';
```

**Edge Function**:
Create `supabase/functions/process-subscriptions/index.ts` to run daily and create orders for due subscriptions.

---

### 4. Barcode/QR Tracking
**Status**: New feature  
**Priority**: HIGH

Generate unique codes for each order:
- QR code on order receipt
- Barcode for physical tags
- Scan to track order status
- Scan at pickup/delivery

**Implementation**:
- Generate QR code with order ID
- Display on order detail page
- Create admin scanner page
- Update order status on scan

**Libraries**:
```bash
npm install qrcode react-qr-scanner
```

**Usage**:
```typescript
import QRCode from 'qrcode'

// Generate QR code
const generateQR = async (orderId: string) => {
  const url = `https://docjs.com/track/${orderId}`
  return await QRCode.toDataURL(url)
}
```

---

### 5. Ratings & Reviews
**Status**: New feature  
**Priority**: MEDIUM

Let customers rate completed orders:
- 5-star rating system
- Optional written review
- Service quality feedback
- Delivery experience rating

**Database Schema**:
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
  delivery_experience INTEGER CHECK (delivery_experience >= 1 AND delivery_experience <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

**UI Components**:
- Rating modal after delivery
- Review display on order detail
- Average rating on dashboard
- Admin review management

---

### 6. Smart Notifications
**Status**: Enhancement  
**Priority**: HIGH

Intelligent notification system:
- Push notifications (PWA)
- SMS for critical updates
- Email for detailed info
- In-app notification center

**Notification Types**:
- Order confirmed
- Payment received
- Processing started
- Ready for pickup
- Out for delivery
- Delivered
- Review reminder (24h after delivery)

**Implementation**:
```typescript
// Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  marketing_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 7. Loyalty Program
**Status**: New feature  
**Priority**: LOW

Reward repeat customers:
- Points per order
- Tier system (Bronze, Silver, Gold)
- Discounts and perks
- Referral bonuses

**Database Schema**:
```sql
CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

CREATE TABLE loyalty_accounts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  tier loyalty_tier DEFAULT 'bronze',
  lifetime_spent_cents INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  points INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'earned', 'redeemed', 'bonus'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Points System**:
- 1 point per ₦100 spent
- Bronze: 0-999 points
- Silver: 1000-4999 points (5% discount)
- Gold: 5000-9999 points (10% discount)
- Platinum: 10000+ points (15% discount)

---

## Design Consistency

All new features will maintain the premium design:
- Sora font for headings
- Inter font for body text
- Primary blue (#2563EB)
- Smooth animations
- Modern rounded corners (12-24px)
- Gradient backgrounds
- Professional spacing (8px grid)

---

## Implementation Order

### Week 1: Core Enhancements
1. Natural language order parsing
2. QR code generation and tracking
3. Smart notifications setup

### Week 2: User Features
4. Order templates
5. Ratings & reviews
6. Notification preferences

### Week 3: Advanced Features
7. Subscription orders
8. Loyalty program
9. Testing and refinement

---

## Quick Start

### 1. Natural Language Parsing (Start Here!)

This is the highest priority and easiest to implement:

**Update `app/src/utils/orderParser.ts`**:
```typescript
import { Service } from '../types'

interface ParsedItem {
  quantity: number
  serviceName: string
  modifiers: string[]
}

export function parseOrderText(text: string, services: Service[]): ParsedItem[] {
  const items: ParsedItem[] = []
  
  // Common patterns
  const patterns = [
    /(\d+)\s+([\w\s]+?)(?:,|and|$)/gi,
    /(\d+)x\s+([\w\s]+?)(?:,|and|$)/gi,
  ]
  
  // Extract items
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const quantity = parseInt(match[1])
      const serviceName = match[2].trim().toLowerCase()
      
      // Find matching service
      const service = services.find(s => 
        s.name.toLowerCase().includes(serviceName) ||
        serviceName.includes(s.name.toLowerCase())
      )
      
      if (service) {
        items.push({
          quantity,
          serviceName: service.name,
          modifiers: extractModifiers(text),
        })
      }
    }
  }
  
  return items
}

function extractModifiers(text: string): string[] {
  const modifiers: string[] = []
  
  if (/express|same day|urgent/i.test(text)) {
    modifiers.push('express')
  }
  
  if (/starch|heavy starch/i.test(text)) {
    modifiers.push('starch')
  }
  
  return modifiers
}
```

**Update `QuickOrderInput.tsx`** to use the parser and auto-populate the visual selector.

---

## Next Steps

1. **Choose a feature** from the list above
2. **Review the implementation** details
3. **Create database migrations** if needed
4. **Build UI components** with premium design
5. **Test thoroughly**
6. **Deploy and monitor**

---

## Questions?

Each feature is designed to be implemented independently. Start with natural language parsing as it provides immediate value and is straightforward to implement.

**Ready to start?** Let me know which feature you'd like to tackle first.

