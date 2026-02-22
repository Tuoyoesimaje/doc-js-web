# Add Customer Portal to Existing Vercel Site

## Current Setup
- ✅ Marketing website live at: **www.docjslaundry.com**
- ✅ Hosted on Vercel
- 🎯 Goal: Add customer portal at **www.docjslaundry.com/app**

## Step 1: Update Your Repository

Your current repo probably only has the marketing files. We need to add the `app/` folder.

### Option A: If this is the same repo
Just push the changes:

```bash
git add .
git commit -m "Add customer portal app"
git push origin main
```

Vercel will auto-deploy.

### Option B: If this is a different repo
You need to merge the app folder into your existing repo:

1. Copy the entire `app/` folder to your existing repo
2. Copy `vercel.json` to your existing repo root
3. Push to GitHub

## Step 2: Update Vercel Build Settings

Go to your Vercel project dashboard:

1. **Settings → General → Build & Development Settings**
2. Update these settings:

```
Build Command: cd app && npm install && npm run build
Output Directory: app/dist
Install Command: npm install (leave default)
```

3. Click **Save**

## Step 3: Add Environment Variables

In Vercel dashboard:

1. **Settings → Environment Variables**
2. Add these variables:

```
VITE_SUPABASE_URL = your_supabase_project_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
```

Get these from: Supabase Dashboard → Settings → API

3. Click **Save**

## Step 4: Update vercel.json

Make sure your `vercel.json` looks like this:

```json
{
  "buildCommand": "cd app && npm install && npm run build",
  "outputDirectory": "app/dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/app/:path*",
      "destination": "/app/:path*"
    },
    {
      "source": "/app",
      "destination": "/app/index.html"
    }
  ],
  "headers": [
    {
      "source": "/app/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

## Step 5: Redeploy

After pushing changes:

1. Vercel will auto-deploy
2. Or manually trigger: **Deployments → Redeploy**

## Step 6: Test

After deployment:

1. **Marketing site:** https://www.docjslaundry.com ✅ (should still work)
2. **Customer portal:** https://www.docjslaundry.com/app ✅ (new!)
3. **Policies:** https://www.docjslaundry.com/policies.html ✅ (should still work)

## Folder Structure on Vercel

```
www.docjslaundry.com/
├── index.html              → Marketing homepage
├── policies.html           → Policies page
├── styles.css              → Marketing styles
├── script.js               → Marketing scripts
├── logo.jpg                → Logo
└── app/                    → Customer portal (React app)
    ├── index.html
    ├── assets/
    └── ...
```

## Troubleshooting

### App shows 404
- Check `vercel.json` is in root directory
- Verify build command in Vercel settings
- Check build logs for errors

### Marketing site broken
- Make sure `vercel.json` doesn't override root files
- Check that `index.html`, `styles.css`, `script.js` are in root
- Redeploy if needed

### Environment variables not working
- Make sure they start with `VITE_`
- Redeploy after adding variables
- Check they're set for "Production" environment

### Build fails
- Check `app/package.json` exists
- Verify Node version (should be 18+)
- Check build logs in Vercel dashboard

## Quick Checklist

- [ ] Copy `app/` folder to your repo
- [ ] Copy `vercel.json` to repo root
- [ ] Update marketing site links to `/app`
- [ ] Push to GitHub
- [ ] Add environment variables in Vercel
- [ ] Update build settings in Vercel
- [ ] Redeploy
- [ ] Test www.docjslaundry.com (marketing)
- [ ] Test www.docjslaundry.com/app (portal)
- [ ] Test www.docjslaundry.com/policies.html

## Important Notes

1. **Don't delete existing files** - Keep `index.html`, `styles.css`, `script.js` in root
2. **App is in subfolder** - The React app lives in `app/` folder
3. **Vercel handles routing** - `vercel.json` routes `/app` to React app
4. **Marketing site unchanged** - Your existing site continues to work

## After Deployment

Update the marketing website buttons to link to `/app`:
- Already done in `index.html` ✅
- "Download App" → "Open Customer Portal"
- Links to `/app` instead of `#`

---

**Your setup:**
- Marketing: www.docjslaundry.com
- Customer Portal: www.docjslaundry.com/app
- Admin Panel: www.docjslaundry.com/app/admin

All on the same domain! 🎉
