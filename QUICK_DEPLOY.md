# Quick Deployment Guide

## Fastest Way to Deploy (15 minutes)

### Step 1: Deploy Backend to Railway

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Set Root Directory**: `backend`
6. **Add Environment Variables**:
   ```
   JWT_SECRET=your-secure-random-string-here
   NODE_ENV=production
   ```
7. **Deploy** - Railway will auto-detect Node.js and deploy
8. **Copy the URL** (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign up** with GitHub
3. **Add New Project** → **Import Git Repository**
4. **Select your repository**
5. **Configure Project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. **Add Environment Variable**:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-app.railway.app/api` (from Step 1)
7. **Deploy**

### Step 3: Update CORS in Backend

Update `backend/server.js` to allow your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3000' // Keep for local testing
  ]
}));
```

Redeploy backend after this change.

### Step 4: Set Up SMS for OTP (Optional but Recommended)

1. **Sign up for Twilio**: https://www.twilio.com
2. **Get free trial credits**
3. **Get your credentials**:
   - Account SID
   - Auth Token
   - Phone Number
4. **Add to Railway environment variables**:
   ```
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```
5. **Update backend code** (see DEPLOYMENT_GUIDE.md for code)

### Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Try registering a new user
3. Test placing an order
4. Test shopkeeper login

**Done!** Your app is live! 🎉

---

## Alternative: Deploy Both to Same Platform

### Option A: Render (Full Stack)

1. **Backend**: New Web Service → Connect GitHub → `backend` folder
2. **Frontend**: New Static Site → Connect GitHub → `frontend` folder
3. **Set environment variables** for both
4. **Deploy**

### Option B: Heroku (Full Stack)

1. **Backend**: `heroku create your-api` → Deploy
2. **Frontend**: Use Heroku Buildpack for static sites
3. **Set environment variables**
4. **Deploy**

---

## Important Notes

- **Free tiers** have limitations (sleeping dynos, build minutes)
- **For production**, consider paid plans
- **Database**: SQLite works for small scale, migrate to PostgreSQL for growth
- **SSL**: Automatically provided by Vercel/Railway
- **Custom Domain**: Can be added later

---

## Need Help?

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

