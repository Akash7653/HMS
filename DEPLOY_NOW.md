# DEPLOY HORIZON HOTELS NOW! 

## Step 1: Deploy Frontend to Vercel (2 Minutes)

1. **Go to Vercel**: https://vercel.com
2. **Click "Sign Up"** and use your GitHub account
3. **Click "New Project"**
4. **Select your repository**: `Akash7653/HMS`
5. **Configure Settings**:
   - Root Directory: `client`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Add Environment Variable**:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://horizon-hotels-backend.onrender.com/api` (temporary, will update later)
7. **Click "Deploy"**

## Step 2: Deploy Backend to Render (3 Minutes)

1. **Go to Render**: https://render.com
2. **Click "Sign Up"** and use your GitHub account
3. **Click "New +"** then **"Web Service"**
4. **Select repository**: `Akash7653/HMS`
5. **Configure Settings**:
   - Name: `horizon-hotels-backend`
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://test:test@cluster.mongodb.net/test
   JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long
   REDIS_URL=redis://default:password@your-redis-host:6379
   FRONTEND_URL=https://your-vercel-app-url.vercel.app
   BACKEND_URL=https://horizon-hotels-backend.onrender.com
   ```
7. **Click "Create Web Service"**

## Step 3: Set Up Free Services (5 Minutes)

### MongoDB Atlas (Free):
1. Go to: https://www.mongodb.com/cloud
2. Click "Try Free"
3. Create cluster (free tier)
4. Create database user
5. Get connection string
6. Add to Render environment variables

### Redis (Free):
1. Go to: https://upstash.com
2. Click "Start Free"
3. Create Redis database
4. Get connection string
5. Add to Render environment variables

### Cloudinary (Free):
1. Go to: https://cloudinary.com
2. Sign up for free account
3. Get dashboard credentials
4. Add to Render environment variables

## Step 4: Update Frontend URL (1 Minute)

1. Go to your Vercel dashboard
2. Click your project
3. Go to "Settings" -> "Environment Variables"
4. Update `VITE_API_BASE_URL` to your actual Render URL
5. Click "Redeploy"

## Step 5: Test Deployment (2 Minutes)

### Test URLs:
- Frontend: `https://your-vercel-app-url.vercel.app`
- Backend Health: `https://your-backend-url.onrender.com/api/health`

### Test Features:
1. Open frontend URL
2. Try hotel search
3. Test authentication
4. Check PWA features (install on mobile)

## ALTERNATIVE: One-Click Railway Deployment

If you want everything in one place:

1. Go to: https://railway.app
2. Click "Deploy from GitHub repo"
3. Select `Akash7653/HMS`
4. Railway will detect both services
5. Add environment variables
6. Click "Deploy"

## QUICK START COMMANDS

If you want to push deployment configuration first:

```bash
cd C:\Users\akash\OneDrive\Desktop\HMS

# Add deployment files
git add .
git commit -m "Add cloud deployment configuration"
git push origin main

# Now deploy using the steps above
```

## ENVIRONMENT VARIABLES TEMPLATE

### For Render Backend:
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/horizon_hotels
JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long
REDIS_URL=redis://default:password@redis-host:6379
FRONTEND_URL=https://your-app-name.vercel.app
BACKEND_URL=https://your-app-name.onrender.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### For Vercel Frontend:
```
VITE_API_BASE_URL=https://your-app-name.onrender.com/api
VITE_APP_NAME=Horizon Hotels
VITE_ENABLE_PWA=true
```

## COST

All services have free tiers:
- Vercel: Free (personal projects)
- Render: Free (limited resources)
- MongoDB Atlas: Free (512MB)
- Redis (Upstash): Free (10,000 commands/month)
- Cloudinary: Free (25GB bandwidth)

## TOTAL TIME: ~15 Minutes

Your Horizon Hotels platform will be live with all enterprise features:
- AI recommendations
- PWA mobile app experience
- Real-time analytics
- Multi-vendor system
- Dynamic pricing
- Loyalty program
- And much more!

## SUPPORT

If you need help:
- Vercel has excellent documentation
- Render has great support
- Both platforms have community forums

## NEXT STEPS

After deployment:
1. Test all features
2. Set up custom domain
3. Configure SSL (automatic)
4. Add monitoring
5. Scale as needed

Your enterprise-grade hotel booking platform will be live!
