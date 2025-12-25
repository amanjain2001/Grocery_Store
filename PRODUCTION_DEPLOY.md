# 🚀 Production Deployment Guide

## Quick Deploy Checklist

### ✅ Step 1: Prepare Code for Deployment

**JWT Secret Generated:**
```
9e1c825cf5d6600b53504cbf9b2d7f45227417fb2a13de4fd8cab3aad79ea51d9cfa660f342fdfc5a5ea5d7239efacb9db689b28a55a858814751de397d4fe51
```

**Save this JWT_SECRET!** You'll need it for Railway deployment.

### ✅ Step 2: Commit and Push to GitHub

```bash
cd "/Users/amanjain/untitled folder/Grocery_Store"

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Check if remote exists
git remote -v

# If no remote, add it:
git remote add origin https://github.com/amanjain2001/Grocery_Store.git

# Push to GitHub
git push -u origin main
```

### ✅ Step 3: Deploy Backend to Railway

1. **Go to**: https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `amanjain2001/Grocery_Store`
5. **Configure Service**:
   - Click on the deployed service
   - **Settings** → **Root Directory**: Set to `backend`
   - **Settings** → **Variables** → Add these:
     ```
     JWT_SECRET=9e1c825cf5d6600b53504cbf9b2d7f45227417fb2a13de4fd8cab3aad79ea51d9cfa660f342fdfc5a5ea5d7239efacb9db689b28a55a858814751de397d4fe51
     NODE_ENV=production
     PORT=5000
     ```
6. **Generate Domain**:
   - **Settings** → **Networking** → **Generate Domain**
   - **Copy the URL** (e.g., `https://grocery-store-production.railway.app`)
   - This is your **BACKEND_URL** ✅

### ✅ Step 4: Deploy Frontend to Vercel

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
     (Replace `YOUR-RAILWAY-URL` with your actual Railway URL from Step 3)
7. **Deploy** → Click **"Deploy"**
8. **Copy the URL** (e.g., `https://grocery-store.vercel.app`)
   - This is your **FRONTEND_URL** ✅

### ✅ Step 5: Update Backend CORS

1. **Go back to Railway** → Your backend service
2. **Settings** → **Variables**
3. **Add Variable**:
   ```
   ALLOWED_ORIGINS=https://YOUR-VERCEL-URL.vercel.app
   ```
   (Replace `YOUR-VERCEL-URL` with your actual Vercel URL from Step 4)
4. Railway will **automatically redeploy** with the new CORS settings

### ✅ Step 6: Test Your Live Application! 🎉

1. Visit your **FRONTEND_URL**
2. Test the application:
   - ✅ Register a new user
   - ✅ Browse items
   - ✅ Add to cart
   - ✅ Place order
   - ✅ Login as shopkeeper
   - ✅ View orders
   - ✅ Check delivery charges display

---

## 🔑 Important Credentials

**JWT Secret** (save this!):
```
9e1c825cf5d6600b53504cbf9b2d7f45227417fb2a13de4fd8cab3aad79ea51d9cfa660f342fdfc5a5ea5d7239efacb9db689b28a55a858814751de397d4fe51
```

---

## 📝 Environment Variables Summary

### Railway (Backend)
```
JWT_SECRET=9e1c825cf5d6600b53504cbf9b2d7f45227417fb2a13de4fd8cab3aad79ea51d9cfa660f342fdfc5a5ea5d7239efacb9db689b28a55a858814751de397d4fe51
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://YOUR-VERCEL-URL.vercel.app
```

### Vercel (Frontend)
```
REACT_APP_API_URL=https://YOUR-RAILWAY-URL.railway.app/api
```

---

## 🆘 Troubleshooting

**GitHub Push Issues:**
- Use GitHub CLI: `gh auth login`
- Or use SSH: `git remote set-url origin git@github.com:amanjain2001/Grocery_Store.git`
- Or create Personal Access Token on GitHub

**Railway Issues:**
- Make sure Root Directory is set to `backend`
- Check environment variables are set correctly
- View logs in Railway dashboard
- Make sure PORT is set (Railway auto-assigns, but we set it to 5000)

**Vercel Issues:**
- Make sure Root Directory is `frontend`
- Check `REACT_APP_API_URL` is correct (include `/api` at the end)
- Check build logs in Vercel dashboard
- Make sure no trailing slashes in URLs

**CORS Errors:**
- Make sure `ALLOWED_ORIGINS` includes your Vercel URL
- No trailing slashes in URLs
- Use HTTPS URLs only
- Wait for Railway to redeploy after adding ALLOWED_ORIGINS

**OTP Not Working:**
- In production, OTP will be logged to console (for now)
- To enable SMS, integrate Twilio (see DEPLOYMENT_GUIDE.md)

---

## 🎯 Post-Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Test user registration
- [ ] Test user login
- [ ] Test order placement
- [ ] Test shopkeeper login
- [ ] Test order management
- [ ] Verify delivery charges display
- [ ] Test on mobile device

---

**Ready to deploy? Start with Step 2!** 🚀

