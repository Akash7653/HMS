# Redis Setup for Horizon Hotels

## Option 1: Upstash Redis (Easiest - Free)

### Step 1: Create Upstash Redis Account
1. Go to: https://upstash.com
2. Click "Sign Up" (use GitHub or Google)
3. Click "Create Database"
4. Choose region closest to your Render app location
5. Click "Create"

### Step 2: Get Redis Connection URL
1. After creation, click on your database
2. Click "Connect" button
3. Copy the "REST URL" (looks like: `https://your-db-name.upstash.io`)
4. Copy the "REST Token" (looks like: `AY...`)

### Step 3: Add to Render Environment Variables
Go to your Render dashboard:
1. Select your backend service
2. Click "Environment" tab
3. Add these variables:

```
REDIS_URL=https://your-db-name.upstash.io
REDIS_PASSWORD=your-rest-token
```

### Step 4: Restart Your Backend
1. In Render dashboard, click "Manual Deploy"
2. Click "Deploy Latest Commit"

## Option 2: Redis Cloud (More Features - Free Tier)

### Step 1: Create Redis Cloud Account
1. Go to: https://redis.com/try-free
2. Sign up for free account
3. Click "Create Database"
4. Choose "Fixed" plan (free tier)
5. Select region
6. Set name: `horizon-hotels-redis`

### Step 2: Get Connection Details
1. After creation, click "Connect"
2. Choose "Node.js" as language
3. Copy the connection string (looks like: `redis://default:password@host:port`)

### Step 3: Add to Render Environment
```
REDIS_URL=redis://default:password@host:port
```

## Option 3: Render Add-on (Simplest)

### Step 1: Add Redis to Render
1. Go to your Render dashboard
2. Click "New +" -> "Redis"
3. Name: `horizon-hotels-redis`
4. Choose free plan
5. Click "Create Redis"

### Step 2: Get Connection URL
1. After creation, click on your Redis instance
2. Copy the "Connection String"

### Step 3: Add to Backend Environment
1. Go to your backend service
2. Add environment variable:
```
REDIS_URL=your-redis-connection-string
```

## Option 4: Railway Redis (If using Railway)

1. In Railway dashboard, click "New +" -> "Redis"
2. Name: `horizon-hotels-redis`
3. Choose free plan
4. Add to environment variables automatically

## Testing Redis Connection

### Test in Render Logs
1. Go to your backend service logs
2. Look for Redis connection messages
3. Should see: "Redis connected successfully"

### Test API Endpoint
```bash
curl https://your-backend-url.onrender.com/api/health
```
Should return healthy status with Redis info.

## What Redis Enables

Once Redis is set up, you'll have:
- **90% faster search results** with caching
- **Real-time availability** updates
- **Session management** for users
- **Rate limiting** for API protection
- **Analytics data** caching
- **Recommendation engine** performance

## Troubleshooting

### Common Issues:
1. **Connection refused**: Check Redis URL format
2. **Authentication failed**: Verify password/token
3. **Timeout**: Check region proximity

### Fix Connection Issues:
```bash
# Test Redis connection locally
npm install redis
node -e "
const redis = require('redis');
const client = redis.createClient({ url: 'your-redis-url' });
client.connect().then(() => console.log('Connected!')).catch(console.error);
"
```

## Recommended: Upstash Redis

**Why Upstash is best for you:**
- Completely free for your usage level
- HTTP-based (no port issues)
- Easy REST API
- Works perfectly with Render
- No complex setup

## Next Steps After Redis Setup

1. **Update Render environment** with Redis URL
2. **Restart backend** service
3. **Test caching features** by searching hotels
4. **Monitor performance** improvements

Your Horizon Hotels platform will be blazing fast with Redis caching!
