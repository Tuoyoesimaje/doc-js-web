# Vercel Deployment Guide

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the settings

### Step 3: Configure Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project settings.

### Step 4: Deploy

Click **"Deploy"** - Vercel will:
1. Install dependencies
2. Build the React app
3. Deploy both marketing site and app

## 📁 Project Structure

```
your-domain.com/          → Marketing website (index.html)
your-domain.com/app/      → Customer portal (React app)
your-domain.com/policies.html → Policies page
```

## ✅ What's Configured

### Marketing Website
- ✅ All "Download App" buttons now link to `/app`
- ✅ Changed text to "Open Customer Portal"
- ✅ Works on desktop and mobile

### Customer Portal
- ✅ Runs at `/app` route
- ✅ Login, Dashboard, New Order, Order Detail, Admin Panel
- ✅ Supabase authentication
- ✅ Payment integration (Monnify)
- ✅ Support chat system
- ✅ Admin security with role-based access

### Vercel Configuration
- ✅ `vercel.json` configured for proper routing
- ✅ React app builds to `app/dist`
- ✅ Marketing site serves from root
- ✅ All routes properly handled

## 🔧 Build Commands

Vercel uses these automatically:

```json
{
  "buildCommand": "cd app && npm install && npm run build",
  "outputDirectory": "app/dist"
}
```

## 🌐 Custom Domain

After deployment:

1. Go to Vercel dashboard → **Settings → Domains**
2. Add your custom domain (e.g., `docjslaundry.com`)
3. Update DNS records as instructed
4. SSL certificate auto-generated

## 📱 Testing After Deployment

### Test Marketing Site
1. Visit `your-domain.com`
2. Click "Open Customer Portal" button
3. Should redirect to `/app`

### Test Customer Portal
1. Visit `your-domain.com/app`
2. Should show login page
3. Sign up / Login
4. Test order creation
5. Test admin access (if admin user)

### Test Admin Panel
1. Login with admin credentials
2. Navigate to `/app/admin`
3. Should show admin dashboard
4. Test order management

## 🔒 Security Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase RLS policies enabled
- [ ] Admin users created in database
- [ ] Monnify API keys configured
- [ ] CORS settings updated in Supabase

## 🐛 Troubleshooting

### App shows 404
- Check `vercel.json` is in root directory
- Verify build command ran successfully
- Check Vercel build logs

### Environment variables not working
- Make sure they start with `VITE_`
- Redeploy after adding variables
- Check Vercel dashboard → Settings → Environment Variables

### Admin OTP not sending (Production)
- Verify Supabase email provider configured
- Check Supabase email templates
- Consider custom email provider (SendGrid, Resend)

### Payments not working
- Verify Monnify API keys in `.env`
- Check Monnify dashboard for test/live mode
- Ensure Monnify SDK loaded in `app/index.html`

## 📊 Monitoring

After deployment, monitor:

1. **Vercel Analytics** - Page views, performance
2. **Supabase Dashboard** - Database queries, auth events
3. **Monnify Dashboard** - Payment transactions
4. **Browser Console** - Check for errors

## 🔄 Future Updates

To update your site:

```bash
# Make changes
git add .
git commit -m "Update description"
git push origin main
```

Vercel auto-deploys on every push to `main` branch.

## 🎯 Next Steps

1. **Deploy to Vercel** (follow steps above)
2. **Test everything** on production URL
3. **Add custom domain** (optional)
4. **Configure email provider** for OTP (production)
5. **Set up monitoring** and analytics
6. **Train staff** on admin panel usage

---

## 📝 Quick Deploy Checklist

- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Add environment variables
- [ ] Deploy
- [ ] Test marketing site
- [ ] Test customer portal
- [ ] Test admin panel
- [ ] Add custom domain (optional)
- [ ] Configure production email provider
- [ ] Monitor first orders

---

**Your app is production-ready!** 🎉

Marketing site at `/` → Customer portal at `/app` → Admin panel at `/app/admin`
