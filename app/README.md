# Doc JS Laundry - Customer Portal

React app for customer orders, tracking, and payments.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Payment**: Monnify
- **Deployment**: Vercel

## Project Structure

```
app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── OrderCard.tsx
│   │   ├── OrderTimeline.tsx
│   │   ├── AddressPicker.tsx
│   │   ├── QuickOrderInput.tsx
│   │   └── VisualOrderSelect.tsx
│   ├── pages/           # Route pages
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── NewOrderPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   └── AdminPanel.tsx
│   ├── store/           # State management (Zustand)
│   │   └── authStore.ts
│   ├── lib/             # External integrations
│   │   └── supabase.ts
│   ├── utils/           # Helper functions
│   │   └── orderParser.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Configure Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MONNIFY_API_KEY=your_monnify_api_key
VITE_MONNIFY_CONTRACT_CODE=your_monnify_contract_code
```

### 3. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `../supabase-schema.sql` in the SQL Editor
3. Enable Google OAuth in Authentication > Providers
4. Enable Phone authentication in Authentication > Providers
5. Configure SMS provider (Twilio recommended)

### 4. Run Locally

```bash
npm run dev
```

App will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: Vercel Dashboard

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set root directory to `app`
4. Add environment variables
5. Deploy

### Configure Custom Domain

In Vercel dashboard:
1. Go to Settings > Domains
2. Add `app.docjslaundry.com` or configure as subdirectory

## Key Features

### Authentication
- **Google OAuth**: One-click login
- **Phone OTP**: First-time login only (saves SMS costs)
- **Password**: Set after first OTP, used for subsequent logins
- **Session**: 30-day persistence

### Quick Order Entry
- **Bulk text parsing**: "10 shirts, 5 trousers"
- **Visual selection**: Icon grid with quantity controls
- **Express service**: +50% same-day surcharge

### Order Tracking
- **4 statuses**: received → processing → ready → delivered
- **Timeline view**: Visual progress indicator
- **Notifications**: SMS for critical updates, email for everything else

### Admin Panel
- Hidden route at `/admin`
- Update order status
- Trigger notifications
- View all orders

## Testing

### Test Authentication Flow

1. **New phone user**:
   - Enter phone → OTP sent
   - Verify OTP → Prompt to set password
   - Set password → Login complete

2. **Returning phone user**:
   - Enter phone + password → Login
   - No OTP charged

3. **Google user**:
   - Click Google button → OAuth flow
   - Auto-login on return

### Test Order Flow

1. Login
2. Click "New Order"
3. Select address
4. Enter items (quick or visual)
5. Review summary
6. Continue to payment
7. Track order status

## Next Steps

### Phase 2: Payments & Notifications
- Monnify integration
- Payment webhook handling
- SMS notifications (Twilio)
- Email notifications (Supabase)

### Phase 3: Advanced Features
- Natural language parsing (Claude API)
- Order templates
- Subscription plans
- Barcode tracking
- Rating system

## Troubleshooting

### Build Errors
- Check TypeScript errors: `npm run lint`
- Clear cache: `rm -rf node_modules .vite && npm install`

### Auth Issues
- Verify Supabase URL and keys
- Check RLS policies in Supabase
- Ensure phone provider is configured

### Deployment Issues
- Check environment variables in Vercel
- Verify base path in `vite.config.ts`
- Check build logs in Vercel dashboard

## Support

For issues or questions, contact the development team.
