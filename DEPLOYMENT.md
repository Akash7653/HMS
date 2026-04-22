# Horizon Hotels - Deployment Guide

## Overview
This guide will help you deploy the upgraded Horizon Hotels platform to production. The system has been enhanced with enterprise-level features including AI-powered recommendations, real-time analytics, multi-vendor support, and PWA capabilities.

## Prerequisites

### Infrastructure Requirements
- **Server**: Ubuntu 20.04+ or CentOS 8+ with at least 4GB RAM
- **Docker**: v20.10+ and Docker Compose v2.0+
- **Domain**: Custom domain with SSL certificate
- **Database**: MongoDB Atlas or self-hosted MongoDB
- **Cache**: Redis (Redis Cloud or self-hosted)
- **Storage**: Cloudinary for image hosting
- **Monitoring**: Optional: Prometheus + Grafana

### Environment Variables Setup

1. **Backend Environment** (`server/.env.production`):
```bash
# Copy the example file
cp server/env.production.example server/.env.production

# Fill in your actual values
nano server/.env.production
```

2. **Frontend Environment** (`client/.env.production`):
```bash
# Copy the example file
cp client/env.production.example client/.env.production

# Fill in your actual values
nano client/.env.production
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Prepare Production Environment**:
```bash
# Clone the repository
git clone <your-repo-url> horizon-hotels
cd horizon-hotels

# Create production environment files
cp server/env.production.example server/.env.production
cp client/env.production.example client/.env.production

# Edit environment files with your credentials
nano server/.env.production
nano client/.env.production
```

2. **Deploy with Docker Compose**:
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

3. **Verify Deployment**:
```bash
# Check backend health
curl https://api.yourdomain.com/api/health

# Check frontend
curl https://yourdomain.com/
```

### Option 2: GitHub Actions CI/CD

1. **Set up GitHub Secrets**:
```bash
# In your GitHub repository settings, add these secrets:
HOST=your-server-ip
USERNAME=your-server-username
SSH_KEY=your-ssh-private-key
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
SLACK_WEBHOOK=your-slack-webhook-url
```

2. **Configure Server**:
```bash
# On your server, install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deployment directory
sudo mkdir -p /opt/horizon-hotels
sudo chown $USER:$USER /opt/horizon-hotels

# Clone repository
cd /opt/horizon-hotels
git clone <your-repo-url> .
```

3. **Push and Deploy**:
```bash
# Push your changes to trigger deployment
git add .
git commit -m "Deploy Horizon Hotels v2.0 with AI and PWA features"
git push origin main
```

### Option 3: Manual Deployment

1. **Build Backend**:
```bash
cd server
npm ci --only=production
npm run build
```

2. **Build Frontend**:
```bash
cd ../client
npm ci
npm run build
```

3. **Start Services**:
```bash
# Start MongoDB and Redis
docker run -d --name mongodb -p 27017:27017 mongo:7.0
docker run -d --name redis -p 6379:6379 redis:7.2-alpine

# Start backend
cd ../server
npm start

# Start frontend (with nginx)
cd ../client
npm run preview
```

## Post-Deployment Configuration

### 1. Database Setup
```bash
# Connect to MongoDB and create indexes
mongo mongodb://username:password@localhost:27017/horizon_hotels

# Create indexes for performance
db.hotels.createIndex({ "location.city": 1, "location.state": 1, ratingAverage: -1 })
db.bookings.createIndex({ hotel: 1, roomType: 1, checkIn: 1, checkOut: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

### 2. SSL Certificate Setup
```bash
# Using Let's Encrypt (recommended)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Monitoring Setup
```bash
# Access Grafana dashboard
open http://your-server:3001

# Default credentials (change these!)
username: admin
password: your-grafana-password
```

## Verification Checklist

### Backend Verification
- [ ] API health check: `GET /api/health`
- [ ] Database connectivity
- [ ] Redis connectivity
- [ ] JWT authentication working
- [ ] OAuth endpoints accessible
- [ ] File upload working (Cloudinary)
- [ ] Email service working
- [ ] Payment gateways configured

### Frontend Verification
- [ ] PWA manifest loading
- [ ] Service worker registered
- [ ] Offline functionality working
- [ ] Push notifications enabled
- [ ] Responsive design on mobile
- [ ] All pages loading correctly
- [ ] API calls working
- [ ] Authentication flow working

### Feature Verification
- [ ] AI recommendations working
- [ ] Dynamic pricing functional
- [ ] Map system with heatmaps
- [ ] Analytics dashboard accessible
- [ ] Multi-vendor system working
- [ ] Wallet and loyalty program functional
- [ ] Real-time availability updates

## Performance Optimization

### 1. Caching Setup
```bash
# Redis configuration for production
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 2. Database Optimization
```bash
# MongoDB connection pool settings
# In your .env.production:
DB_POOL_MIN=5
DB_POOL_MAX=20
```

### 3. CDN Configuration
- Configure Cloudinary CDN for images
- Set up CDN for static assets
- Enable gzip compression on nginx

## Security Checklist

### 1. Environment Security
- [ ] All secrets are in environment variables
- [ ] No hardcoded credentials in code
- [ ] SSL certificates installed and valid
- [ ] Firewall configured properly
- [ ] Database access restricted

### 2. Application Security
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] SQL injection protection
- [ ] XSS protection enabled

### 3. Monitoring Security
- [ ] Failed login attempts logged
- [ ] Suspicious activity alerts
- [ ] Regular security updates
- [ ] Backup strategy implemented

## Troubleshooting

### Common Issues

1. **Backend won't start**:
```bash
# Check logs
docker-compose logs backend

# Common fixes:
# - Check MongoDB connection string
# - Verify Redis connection
# - Check environment variables
```

2. **Frontend not loading**:
```bash
# Check nginx configuration
docker-compose logs nginx

# Common fixes:
# - Verify API URL in frontend env
# - Check SSL certificates
# - Verify nginx configuration
```

3. **Database connection issues**:
```bash
# Test MongoDB connection
mongo mongodb://username:password@localhost:27017/horizon_hotels

# Common fixes:
# - Check IP whitelist in MongoDB Atlas
# - Verify credentials
# - Check network connectivity
```

### Performance Issues

1. **Slow API responses**:
```bash
# Check Redis cache hit rate
redis-cli INFO stats | grep keyspace

# Enable query logging in MongoDB
# Check slow queries in MongoDB logs
```

2. **Memory issues**:
```bash
# Check container resource usage
docker stats

# Optimize Node.js memory
# Add to package.json: "start": "node --max-old-space-size=2048 dist/server.js"
```

## Maintenance

### Regular Tasks
1. **Weekly**:
   - Check system logs
   - Update security patches
   - Monitor performance metrics
   - Backup database

2. **Monthly**:
   - Update dependencies
   - Review analytics data
   - Optimize database indexes
   - Check SSL certificate expiry

3. **Quarterly**:
   - Security audit
   - Performance review
   - Capacity planning
   - Disaster recovery testing

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs: `docker-compose logs -f`
3. Monitor system resources: `docker stats`
4. Check health endpoints: `/api/health`

## Rollback Plan

If deployment fails:
```bash
# Rollback to previous version
git checkout <previous-commit-tag>
docker-compose down
docker-compose up -d

# Or use Docker tags
docker-compose pull backend:previous-tag
docker-compose pull frontend:previous-tag
docker-compose up -d
```

Congratulations! Your Horizon Hotels platform is now deployed with enterprise-level features including AI-powered recommendations, real-time analytics, multi-vendor support, and PWA capabilities.
