# Install Docker Desktop for Windows

## Option 1: Docker Desktop (Recommended)

1. **Download Docker Desktop**:
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows
   - Run the installer
   - Restart your computer

2. **Verify Installation**:
   ```powershell
   docker --version
   docker-compose --version
   ```

3. **Deploy Horizon Hotels**:
   ```bash
   cd C:\Users\akash\OneDrive\Desktop\HMS
   docker-compose -f docker-compose.production.yml up -d
   ```

## Option 2: Use WSL2 with Docker

1. **Enable WSL2**:
   ```powershell
   wsl --install
   ```

2. **Install Docker in WSL2**:
   ```bash
   # In WSL2 terminal
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

## Option 3: Manual Node.js Deployment

If Docker installation fails, deploy with Node.js directly:

### Backend Setup:
```bash
cd C:\Users\akash\OneDrive\Desktop\HMS\server
npm install
npm run build
npm start
```

### Frontend Setup:
```bash
cd C:\Users\akash\OneDrive\Desktop\HMS\client
npm install
npm run build
npm run preview
```

## Option 4: Cloud Deployment

### Deploy to Vercel (Frontend):
1. Push to GitHub
2. Connect Vercel to your GitHub repo
3. Deploy automatically

### Deploy to Render (Backend):
1. Push to GitHub
2. Connect Render to your GitHub repo
3. Configure environment variables
4. Deploy automatically

## Quick Start

Choose one option above and follow the steps. For most users, **Option 1 (Docker Desktop)** is the easiest and most reliable.
