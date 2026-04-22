# Cloud Deployment Guide - Horizon Hotels

## Option 1: Vercel + Render (Recommended - Free)

### Step 1: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click "New Project"
4. Select your GitHub repository: `Akash7653/HMS`
5. Set Root Directory: `client`
6. Set Build Command: `npm run build`
7. Set Output Directory: `dist`
8. Add Environment Variables:
   ```
   VITE_API_BASE_URL=https://your-render-app-url.onrender.com/api
   ```
9. Click "Deploy"

### Step 2: Deploy Backend to Render
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Click "New +" -> "Web Service"
4. Select your GitHub repository: `Akash7653/HMS`
5. Set Root Directory: `server`
6. Set Build Command: `npm install && npm run build`
7. Set Start Command: `npm start`
8. Set Runtime: Node
9. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/horizon_hotels
   JWT_SECRET=your_secure_jwt_secret_key_at_least_32_characters
   REDIS_URL=redis://default:password@your-redis-host:6379
   FRONTEND_URL=https://your-vercel-app-url.vercel.app
   BACKEND_URL=https://your-render-app-url.onrender.com
   ```
10. Click "Create Web Service"

### Step 3: Set Up External Services

#### MongoDB Atlas (Free):
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud)
2. Create free cluster
3. Get connection string
4. Add to Render environment variables

#### Redis (Free):
1. Go to [Upstash Redis](https://upstash.com)
2. Create free Redis database
3. Get connection string
4. Add to Render environment variables

#### Cloudinary (Free):
1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for free account
3. Get credentials from dashboard
4. Add to Render environment variables

### Step 4: Update Frontend Environment
1. Go to your Vercel project dashboard
2. Click "Settings" -> "Environment Variables"
3. Update: `VITE_API_BASE_URL` to your Render URL
4. Redeploy Vercel app

## Option 2: Railway (All-in-One Solution)

### Single Platform Deployment:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select `Akash7653/HMS`
5. Railway will detect both frontend and backend
6. Add environment variables for both services
7. Click "Deploy"

## Option 3: Netlify + Heroku

### Frontend on Netlify:
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop `client/dist` folder
3. Or connect GitHub repo

### Backend on Heroku:
1. Go to [heroku.com](https://heroku.com)
2. Create new app
3. Connect GitHub repo
4. Set build and start commands
5. Add environment variables

## Option 4: DigitalOcean App Platform

### Full Stack Deployment:
1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create account
3. Use App Platform
4. Connect GitHub repo
5. Configure both frontend and backend
6. Deploy

## Quick Deploy Commands

### After Setting Up Cloud Services:

```bash
# Update environment files
cd C:\Users\akash\OneDrive\Desktop\HMS

# Create production environment files
echo "VITE_API_BASE_URL=https://your-app-url.onrender.com/api" > client/.env.production
echo "NODE_ENV=production" > server/.env.production
echo "PORT=5000" >> server/.env.production

# Commit and push changes
git add .
git commit -m "Add cloud deployment configuration"
git push origin main
```

## Environment Variables Template

### Backend (Render/Heroku/Railway):
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/horizon_hotels
JWT_SECRET=your_secure_jwt_secret_key_at_least_32_characters
REDIS_URL=redis://default:password@your-redis-host:6379
FRONTEND_URL=https://your-frontend-url.vercel.app
BACKEND_URL=https://your-backend-url.onrender.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (Vercel/Netlify):
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_APP_NAME=Horizon Hotels
VITE_ENABLE_PWA=true
```

## Verification

After deployment:

1. **Frontend**: Visit your Vercel/Netlify URL
2. **Backend**: Visit `https://your-backend-url.onrender.com/api/health`
3. **PWA**: Install app on mobile
4. **Features**: Test all new features

## Troubleshooting

### Common Issues:
1. **CORS errors**: Update `FRONTEND_URL` and `BACKEND_URL`
2. **Database connection**: Check MongoDB Atlas IP whitelist
3. **Redis connection**: Verify Redis URL format
4. **Build failures**: Check Node.js version compatibility

### Support:
- Vercel: Support via dashboard
- Render: Support via dashboard
- Railway: Community support
- DigitalOcean: 24/7 support

## Cost

All options have free tiers:
- **Vercel**: Free for personal projects
- **Render**: Free tier with limited resources
- **Railway**: $5/month after free credits
- **DigitalOcean**: $5/month minimum

## Recommendation

For quick deployment, use **Vercel + Render**:
- Vercel for frontend (excellent performance, free)
- Render for backend (easy Node.js deployment, free tier)
- Both integrate seamlessly with GitHub

This will get your Horizon Hotels platform live in minutes!
