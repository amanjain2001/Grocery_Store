# 🚀 DEPLOY NOW - Step by Step Guide

Your code is ready! Follow these steps to deploy:

## ✅ Step 1: Push to GitHub

You have a GitHub repo: `https://github.com/amanjain2001/Grocery_Store`

**Push your code:**

```bash
cd /Users/amanjain/Grocery_store

# If you need to authenticate with GitHub:
# Option 1: Use GitHub CLI
gh auth login

# Option 2: Use SSH (if you have SSH keys set up)
git remote set-url Grocery_Store git@github.com:amanjain2001/Grocery_Store.git

# Option 3: Use Personal Access Token
# Go to GitHub Settings → Developer settings → Personal access tokens
# Create token with 'repo' permissions
# Then: git push https://YOUR_TOKEN@github.com/amanjain2001/Grocery_Store.git main

# Push the code
git push -u Grocery_Store main
```

## ✅ Step 2: Deploy Backend to Railway

1. **Go to**: https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `amanjain2001/Grocery_Store`
5. **Configure**:
   - Click on the service
   - **Settings** → **Root Directory**: Set to `backend`
   - **Settings** → **Variables** → Add:
     ```
     JWT_SECRET=fab62f5533a5b01ee00a54617702ff6ce2f588c9974699f46c4031dcc0127aeda92ff258b77567d853b5b483335ae554b08627db9f2960c01a773e55d9e6a3ac
     NODE_ENV=production
     PORT=5000
     ```
6. **Generate Domain**:
   - **Settings** → **Networking** → **Generate Domain**
   - **Copy the URL** (e.g., `https://grocery-store-production.railway.app`)
   - This is your **BACKEND_URL** ✅

## ✅ Step 3: Deploy Frontend to Vercel

1. **Go to**: https://vercel.com
2. **Sign up/Login** with GitHub
3. **Add New Project** → **Import Git Repository**
4. **Select**: `amanjain2001/Grocery_Store`
5. **Configure Project**:
   - **Framework Preset**: Create React App
   - **Root Directory**: Click "Edit" → Change to `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. **Environment Variables**:
   - Click **"Environment Variables"**
   - Add:
     ```
     REACT_APP_API_URL=https://YOUR-RAILWAY-URL.railway.app/api
     ```
     (Replace with your BACKEND_URL from Step 2)
7. **Deploy** → Click **"Deploy"**
8. **Copy the URL** (e.g., `https://grocery-store.vercel.app`)
   - This is your **FRONTEND_URL** ✅

## ✅ Step 4: Update Backend CORS

1. **Go back to Railway** → Your backend service
2. **Settings** → **Variables**
3. **Add Variable**:
   ```
   ALLOWED_ORIGINS=https://YOUR-VERCEL-URL.vercel.app
   ```
   (Replace with your FRONTEND_URL from Step 3)
4. Railway will **automatically redeploy**

## ✅ Step 5: Test Your Live Application! 🎉

1. Visit your **FRONTEND_URL**
2. Test the application:
   - Register a new user
   - Browse items
   - Add to cart
   - Place order
   - Login as shopkeeper
   - View orders

---

## 🔑 Important Credentials

**JWT Secret** (save this!):
```
fab62f5533a5b01ee00a54617702ff6ce2f588c9974699f46c4031dcc0127aeda92ff258b77567d853b5b483335ae554b08627db9f2960c01a773e55d9e6a3ac
```

---

## 📝 Quick Commands Reference

```bash
# Push to GitHub
git push -u Grocery_Store main

# Check deployment status
# Railway: Check dashboard
# Vercel: Check dashboard
```

---

## 🆘 Troubleshooting

**GitHub Push Issues:**
- Use GitHub CLI: `gh auth login`
- Or use SSH: `git remote set-url Grocery_Store git@github.com:amanjain2001/Grocery_Store.git`
- Or create Personal Access Token on GitHub

**Railway Issues:**
- Make sure Root Directory is set to `backend`
- Check environment variables are set
- View logs in Railway dashboard

**Vercel Issues:**
- Make sure Root Directory is `frontend`
- Check `REACT_APP_API_URL` is correct
- Check build logs in Vercel dashboard

**CORS Errors:**
- Make sure `ALLOWED_ORIGINS` includes your Vercel URL
- No trailing slashes
- Use HTTPS URLs

---

**Ready? Start with Step 1!** 🚀
