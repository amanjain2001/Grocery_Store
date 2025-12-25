# Deployment Guide - Grocery Store Application

This guide covers deploying the grocery delivery application to production so end users can access it.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [SMS Service Integration](#sms-service-integration)
8. [Domain & SSL](#domain--ssl)
9. [Production Checklist](#production-checklist)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git
- A hosting service (see options below)
- Domain name (optional but recommended)
- SMS service API key (for OTP)

## Deployment Options

### Option 1: Cloud Platforms (Recommended)
- **Backend**: Heroku, Railway, Render, AWS, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: Keep SQLite (for small scale) or migrate to PostgreSQL

### Option 2: VPS (Virtual Private Server)
- **Provider**: DigitalOcean, Linode, AWS EC2, Google Cloud
- **Full Stack**: Deploy both backend and frontend on same server

### Option 3: Containerized Deployment
- **Docker**: Containerize both apps
- **Platform**: AWS ECS, Google Cloud Run, Azure Container Instances

---

## Backend Deployment

### Step 1: Prepare Backend for Production

1. **Update package.json scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

2. **Create production environment file (.env):**
```env
PORT=5000
JWT_SECRET=your-very-secure-random-secret-key-change-this
NODE_ENV=production
```

3. **Update CORS settings** in `server.js`:
```javascript
// Replace this:
app.use(cors());

// With this (for production):
const allowedOrigins = [
  'https://your-frontend-domain.com',
  'https://www.your-frontend-domain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Step 2: Deploy to Heroku (Example)

```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create a new app
cd backend
heroku create your-grocery-store-api

# Set environment variables
heroku config:set JWT_SECRET=your-secure-secret-key
heroku config:set NODE_ENV=production

# Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main

# Your API will be at: https://your-grocery-store-api.herokuapp.com
```

### Step 3: Deploy to Railway/Render

**Railway:**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Connect your repository
4. Select `backend` folder
5. Add environment variables
6. Deploy

**Render:**
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables
7. Deploy

---

## Frontend Deployment

### Step 1: Build React App

```bash
cd frontend

# Install dependencies
npm install

# Create production .env file
echo "REACT_APP_API_URL=https://your-backend-api-url.com/api" > .env.production

# Build for production
npm run build
```

This creates an optimized `build` folder.

### Step 2: Deploy to Vercel (Recommended for React)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which directory? ./
# - Override settings? No
```

**Or use Vercel Dashboard:**
1. Go to https://vercel.com
2. Import Git Repository
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `build`
6. Add Environment Variable: `REACT_APP_API_URL`
7. Deploy

### Step 3: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
cd frontend
npm run build
netlify deploy --prod --dir=build
```

**Or use Netlify Dashboard:**
1. Go to https://netlify.com
2. Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `build`
5. Add environment variable: `REACT_APP_API_URL`
6. Deploy

### Step 4: Deploy to AWS S3 + CloudFront

```bash
# Install AWS CLI
# Configure AWS credentials

# Build the app
cd frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Create CloudFront distribution
# (Use AWS Console or CLI)
```

---

## Database Setup

### Option 1: Keep SQLite (Small Scale)
- SQLite file will be created automatically
- Works for < 1000 users
- **Backup regularly!**

### Option 2: Migrate to PostgreSQL (Recommended for Production)

1. **Install PostgreSQL dependencies:**
```bash
cd backend
npm install pg
```

2. **Update server.js to use PostgreSQL:**
```javascript
// Replace sqlite3 with pg
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

3. **Create database schema** (run SQL migrations)

4. **Add DATABASE_URL to environment variables:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**PostgreSQL Hosting Options:**
- Heroku Postgres (free tier available)
- Railway PostgreSQL
- AWS RDS
- Supabase (free tier)
- Neon (free tier)

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
JWT_SECRET=generate-a-very-secure-random-string-here
NODE_ENV=production
DATABASE_URL=your-database-connection-string
SMS_API_KEY=your-sms-service-api-key
SMS_API_SECRET=your-sms-service-secret
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-api-url.com/api
```

**Generate secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## SMS Service Integration

### Option 1: Twilio (Recommended)

1. **Sign up**: https://www.twilio.com
2. **Get credentials**: Account SID, Auth Token, Phone Number
3. **Install Twilio SDK:**
```bash
cd backend
npm install twilio
```

4. **Update send-otp endpoint in server.js:**
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In send-otp endpoint, replace console.log with:
client.messages
  .create({
    body: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone_number
  })
  .then(() => {
    // Remove OTP from response in production!
    res.json({ 
      message: 'OTP sent successfully',
      // Don't include otp in production response
    });
  })
  .catch(err => {
    console.error('SMS error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  });
```

5. **Add to .env:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Option 2: Indian SMS Providers

**MSG91:**
- Sign up: https://msg91.com
- Get API key
- Use their REST API

**TextLocal:**
- Sign up: https://www.textlocal.in
- Get API key
- Use their REST API

---

## Domain & SSL

### Option 1: Use Platform Domains
- Vercel: `your-app.vercel.app` (free SSL)
- Netlify: `your-app.netlify.app` (free SSL)
- Heroku: `your-app.herokuapp.com` (free SSL)

### Option 2: Custom Domain

1. **Buy a domain** (Namecheap, GoDaddy, Google Domains)
2. **Configure DNS:**
   - For Vercel/Netlify: Add CNAME record
   - For Heroku: Add CNAME or A record
3. **SSL Certificate:**
   - Vercel/Netlify: Automatic (free)
   - Heroku: Automatic with paid dyno
   - CloudFlare: Free SSL

---

## Production Checklist

### Security
- [ ] Change JWT_SECRET to a secure random string
- [ ] Remove OTP from API response (SMS only)
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS everywhere
- [ ] Set secure cookie flags (if using cookies)
- [ ] Enable rate limiting (prevent brute force)
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets

### Performance
- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Use CDN for static assets
- [ ] Enable caching headers
- [ ] Database connection pooling

### Monitoring
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Monitor API response times
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Database backup strategy

### Code Updates
- [ ] Remove console.logs in production
- [ ] Remove debug code
- [ ] Test all features before deploying
- [ ] Update README with production URLs

---

## Quick Start: Deploy to Vercel + Railway

### Backend (Railway)
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository → `backend` folder
4. Add environment variables
5. Deploy

### Frontend (Vercel)
1. Go to https://vercel.com
2. Import Git Repository
3. Root: `frontend`
4. Build: `npm run build`
5. Output: `build`
6. Add `REACT_APP_API_URL` = Railway backend URL
7. Deploy

---

## Post-Deployment

1. **Test the application:**
   - Register a new user
   - Place a test order
   - Test shopkeeper login
   - Verify OTP works

2. **Share the URL:**
   - Frontend URL: `https://your-app.vercel.app`
   - Backend API: `https://your-api.railway.app/api`

3. **Monitor:**
   - Check error logs
   - Monitor API usage
   - Watch for performance issues

---

## Troubleshooting

### CORS Errors
- Ensure frontend URL is in backend CORS allowed origins
- Check environment variables are set correctly

### OTP Not Sending
- Verify SMS service credentials
- Check SMS service account balance
- Review SMS service logs

### Database Issues
- Ensure database connection string is correct
- Check database is accessible from hosting platform
- Verify migrations ran successfully

### Build Failures
- Check Node.js version matches
- Verify all dependencies are in package.json
- Review build logs for errors

---

## Support

For issues during deployment:
1. Check platform-specific documentation
2. Review error logs
3. Test locally first
4. Verify environment variables

Good luck with your deployment! 🚀

