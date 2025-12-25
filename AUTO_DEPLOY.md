# 🚀 Auto-Deployment Instructions

I've prepared everything for deployment. Follow these steps:

## Current Status
✅ Code committed to Git
✅ Deployment configs created
✅ JWT Secret generated

## Step 1: Push to GitHub

**Option A: Create New GitHub Repository**

1. Go to: https://github.com/new
2. Repository name: `grocery-store`
3. Description: "Grocery Delivery Application"
4. **Don't** initialize with README
5. Click "Create repository"
6. Copy the repository URL

Then run:
```bash
cd /Users/amanjain/Grocery_store
git remote add origin https://github.com/YOUR_USERNAME/grocery-store.git
git branch -M main
git push -u origin main
```

**Option B: If you already have a GitHub repo**

```bash
cd /Users/amanjain/Grocery_store
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy Backend (Railway)

**Automated Steps:**
1. Visit: https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway
5. Select `grocery-store` repository
6. Click on the deployed service
7. Go to **Settings** → **Variables**
8. Add these variables:
   ```
   JWT_SECRET=fab62f5533a5b01ee00a54617702ff6ce2f588c9974699f46c4031dcc0127aeda92ff258b77567d853b5b483335ae554b08627db9f2960c01a773e55d9e6a3ac
   NODE_ENV=production
   PORT=5000
   ```
9. Go to **Settings** → **Networking** → **Generate Domain**
10. **Copy the domain** (e.g., `grocery-store-production.railway.app`)

## Step 3: Deploy Frontend (Vercel)

1. Visit: https://vercel.com
2. Click "Add New..." → "Project"
3. Import `grocery-store` repository
4. **Configure:**
   - Framework: Create React App
   - Root Directory: `frontend` (click Edit)
   - Build Command: `npm run build`
   - Output Directory: `build`
5. **Environment Variables:**
   - Add: `REACT_APP_API_URL` = `https://YOUR-RAILWAY-URL.railway.app/api`
6. Click **Deploy**
7. **Copy the Vercel URL** (e.g., `grocery-store.vercel.app`)

## Step 4: Update CORS

1. Go back to **Railway** → Your service
2. **Settings** → **Variables**
3. Add: `ALLOWED_ORIGINS` = `https://YOUR-VERCEL-URL.vercel.app`
4. Railway will auto-redeploy

## Step 5: Test!

Visit your Vercel URL and test the application!

---

**Your JWT Secret (save this!):**
```
fab62f5533a5b01ee00a54617702ff6ce2f588c9974699f46c4031dcc0127aeda92ff258b77567d853b5b483335ae554b08627db9f2960c01a773e55d9e6a3ac
```

