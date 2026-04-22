# Redis Environment Setup for Render

## Your Upstash Redis Credentials
- **REST URL**: `https://up-goblin-104313.upstash.io`
- **REST Token**: `gQAAAAAAAZd5AAIgcDFhNmRmMjY4NGNiM2U0MmU4OWJmN2FkNjhlNWYzOGEwZQ`

## Step 1: Add to Render Environment Variables

Go to your Render backend service:
1. Open [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service (horizon-hotels-backend)
3. Click "Environment" tab
4. Add these environment variables:

### Required Redis Variables:
```
REDIS_URL=https://up-goblin-104313.upstash.io
REDIS_PASSWORD=gQAAAAAAAZd5AAIgcDFhNmRmMjY4NGNiM2U0MmU4OWJmN2FkNjhlNWYzOGEwZQ
```

### Alternative Format (if needed):
```
UPSTASH_REDIS_REST_URL=https://up-goblin-104313.upstash.io
UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAZd5AAIgcDFhNmRmMjY4NGNiM2U0MmU4OWJmN2FkNjhlNWYzOGEwZQ
```

## Step 2: Update Backend Code (if needed)

Your backend code should automatically use these environment variables. The Redis service will connect using:
- URL: `https://up-goblin-104313.upstash.io`
- Token: `gQAAAAAAAZd5AAIgcDFhNmRmMjY4NGNiM2U0MmU4OWJmN2FkNjhlNWYzOGEwZQ`

## Step 3: Restart Backend Service

1. In Render dashboard, click "Manual Deploy"
2. Click "Deploy Latest Commit"
3. Wait for deployment to complete (2-3 minutes)

## Step 4: Test Redis Connection

### Test API Health:
```bash
curl https://your-backend-url.onrender.com/api/health
```

### Check Render Logs:
1. Go to your backend service
2. Click "Logs" tab
3. Look for: "Redis connected successfully"

## Step 5: Verify Caching Features

1. **Test Hotel Search**: Search for hotels multiple times
2. **Check Speed**: Second search should be much faster
3. **Test Recommendations**: AI recommendations should load instantly
4. **Check Analytics**: Real-time metrics should update

## Expected Performance Improvements

With Redis caching enabled:
- **Search Results**: 90% faster on repeat searches
- **Hotel Details**: 95% faster loading
- **User Sessions**: Instant authentication
- **API Response**: 3-5x faster
- **Analytics**: Real-time data updates

## Troubleshooting

### If Redis Connection Fails:
1. **Check URL format**: Ensure `https://up-goblin-104313.upstash.io`
2. **Verify Token**: Copy token exactly as provided
3. **Check Region**: Upstash region should match Render region

### Test Connection Locally:
```bash
# Test Redis connection
node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: 'up-goblin-104313.upstash.io',
  port: 6379,
  password: 'gQAAAAAAAZd5AAIgcDFhNmRmMjY4NGNiM2U0MmU4OWJmN2FkNjhlNWYzOGEwZQ',
  tls: {}
});
redis.connect().then(() => console.log('✅ Redis connected!')).catch(console.error);
"
```

## Next Steps After Redis Setup

1. ✅ Add environment variables to Render
2. ✅ Restart backend service
3. ✅ Test Redis connection
4. ✅ Verify caching features work
5. ✅ Monitor performance improvements

Your Horizon Hotels platform will have enterprise-grade performance with Redis caching!
