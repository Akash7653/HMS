# Quick Deployment Guide - Horizon Hotels v2.0

## Prerequisites
- Docker and Docker Compose installed
- Git installed
- Domain name (optional but recommended)

## Step 1: Environment Setup

### Backend Environment Variables
Edit `server/.env.production`:

```bash
# Database (Required)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/horizon_hotels
REDIS_URL=redis://username:password@redis-host:6379

# JWT Security (Required - generate your own)
JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE_DAYS=30

# Application URLs (Required)
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# OAuth (Optional - for social login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Cloudinary (Required - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment (Optional - for real payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend Environment Variables
Edit `client/.env.production`:

```bash
# API Configuration (Required)
VITE_API_BASE_URL=https://api.yourdomain.com/api

# OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id

# Maps (Optional)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

## Step 2: Quick Deploy with Docker Compose

### Option A: Local Development
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Option B: Production Server
```bash
# On your server:
git clone https://github.com/Akash7653/HMS.git
cd HMS

# Set up environment files (see above)
cp server/env.production.example server/.env.production
cp client/env.production.example client/.env.production

# Edit the files with your values
nano server/.env.production
nano client/.env.production

# Deploy
docker-compose -f docker-compose.production.yml up -d
```

## Step 3: Verify Deployment

### Health Checks
```bash
# Check backend health
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost/

# For production with domain:
curl https://api.yourdomain.com/api/health
curl https://yourdomain.com/
```

### Test Key Features
1. **Backend API**: Visit `https://api.yourdomain.com/api/health`
2. **Frontend**: Visit `https://yourdomain.com`
3. **PWA**: Install app on mobile device
4. **Authentication**: Try login/signup
5. **Hotel Search**: Search for hotels
6. **Maps**: Check map functionality
7. **Analytics**: Visit admin dashboard

## Step 4: Required Services Setup

### 1. MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud)
2. Create free cluster
3. Get connection string
4. Add to `.env.production`

### 2. Redis (Free Options)
- **Redis Cloud**: [redis.com](https://redis.com) - Free tier available
- **Upstash Redis**: [upstash.com](https://upstash.com) - Free tier
- **Self-hosted**: `docker run -d -p 6379:6379 redis:7.2-alpine`

### 3. Cloudinary (Free Tier)
1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for free account
3. Get credentials from dashboard
4. Add to `.env.production`

## Step 5: SSL Setup (Production)

### Using Let's Encrypt (Free SSL)
```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 6: Troubleshooting

### Common Issues

1. **Backend won't start**:
```bash
# Check logs
docker-compose logs backend

# Common fixes:
# - Check MONGO_URI format
# - Verify REDIS_URL
# - Check JWT_SECRET is set
```

2. **Frontend not loading**:
```bash
# Check nginx logs
docker-compose logs nginx

# Common fixes:
# - Verify VITE_API_BASE_URL
# - Check SSL certificates
# - Verify nginx configuration
```

3. **Database connection**:
```bash
# Test MongoDB connection
mongo "mongodb+srv://username:password@cluster.mongodb.net/horizon_hotels"

# Common fixes:
# - Check IP whitelist in MongoDB Atlas
# - Verify credentials
# - Check network connectivity
```

### Reset Deployment
```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Remove volumes (WARNING: This deletes data)
docker-compose -f docker-compose.production.yml down -v

# Restart
docker-compose -f docker-compose.production.yml up -d
```

## Step 7: Monitor Deployment

### Check Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

### Resource Usage
```bash
# Check container stats
docker stats

# Check disk usage
docker system df
```

## Step 8: Production Optimizations

### Enable Redis Persistence
Add to `docker-compose.production.yml`:
```yaml
redis:
  image: redis:7.2-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
  volumes:
    - redis_data:/data
```

### Enable MongoDB Backups
```bash
# Create backup script
cat > backup-mongo.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="MONGODB_URI" --out=/backups/mongo_$DATE
EOF

# Add to crontab for daily backups
0 2 * * * /path/to/backup-mongo.sh
```

## Minimum Viable Setup

If you want to deploy quickly with minimal setup:

1. **Required only**:
   - MongoDB Atlas (free)
   - Redis (free tier or self-hosted)
   - JWT_SECRET (generate any 32+ character string)

2. **Optional for full features**:
   - Cloudinary (image uploads)
   - OAuth apps (social login)
   - Payment gateways
   - Email service

3. **Deploy command**:
```bash
docker-compose -f docker-compose.production.yml up -d
```

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs: `docker-compose logs -f`
3. Verify environment variables are correctly set
4. Check external service status (MongoDB, Redis, Cloudinary)

Your Horizon Hotels platform will be live at your domain with all enterprise features!
