# 🚀 Deployment Guide - Abdora AI

Abdora AI-ni production server-ga deploy qilish uchun to'liq guide.

## Contents
- [Render Deployment](#render-deployment)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring](#monitoring)

---

## Render Deployment

### Option 1: Auto-deployment from GitHub

**Step 1: Render-da Account Yaratish**
1. [render.com](https://render.com) ga boring
2. GitHub account orqali sign up qiling
3. Repository-ni authorize qiling

**Step 2: New Web Service Yarating**
1. Dashboard-da "New +" → "Web Service" ni bosing
2. Abdora-ai repository-ni tanlang
3. Quyidagi settings-ni configure qiling:

```
Name: abdora-backend (yoki abdora-frontend)
Environment: Node (backend uchun)
Build Command: npm install
Start Command: npm start
```

**Step 3: Environment Variables Qo'shing**

Backend (.env):
```
DATABASE_URL=postgresql://user:password@host:5432/abdora_db
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
PORT=3000
ANTHROPIC_API_KEY=your_api_key
```

Frontend (.env):
```
VITE_API_URL=https://abdora-backend.onrender.com
```

**Step 4: Deploy Qilish**
- GitHub-ga push qiling
- Render auto-deploy qiladi

---

## Docker Deployment

### Build Docker Image

```bash
# Root directory-dan
docker build -t abdora-ai:latest .

# Backend image
docker build -t abdora-backend:latest ./bialogiya_beakent

# Frontend image
docker build -t abdora-frontend:latest ./bialogiya_frontend
```

### Run Containers

```bash
# Backend container
docker run -d \
  --name abdora-backend \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your_secret \
  abdora-backend:latest

# Frontend container
docker run -d \
  --name abdora-frontend \
  -p 80:80 \
  -e VITE_API_URL=http://your_backend_url \
  abdora-frontend:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./bialogiya_beakent
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/abdora
      JWT_SECRET: your_secret
    depends_on:
      - db

  frontend:
    build: ./bialogiya_frontend
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://backend:3000

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: abdora_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

---

## Manual Deployment

### Linux Server-da Deploy Qilish

**Step 1: SSH Connection**
```bash
ssh user@your_server_ip
```

**Step 2: Repository Clone Qilish**
```bash
cd /var/www
git clone https://github.com/AbdulhodiyOmonboyev/Abdora-ai.git
cd Abdora-ai
```

**Step 3: Backend Setup**
```bash
cd bialogiya_beakent

# Dependencies install
npm install

# .env file yaratish
cp .env.example .env
# DATABASE_URL va boshqalarni to'ldiring

# Database setup
npx prisma migrate deploy

# PM2 orqali process management
npm install -g pm2
pm2 start server.js --name "abdora-backend"
pm2 save
```

**Step 4: Frontend Build**
```bash
cd ../bialogiya_frontend

# Dependencies install
npm install

# Build
npm run build

# Nginx orqali serve qilish
sudo cp -r dist /var/www/abdora-frontend
```

**Step 5: Nginx Configuration**

Backend:
```nginx
server {
    listen 80;
    server_name api.abdora.uz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Frontend:
```nginx
server {
    listen 80;
    server_name abdora.uz;

    root /var/www/abdora-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

---

## Environment Setup

### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql://prod_user:strong_password@db.host:5432/abdora_production

# Authentication
JWT_SECRET=very_long_random_secret_key_here
JWT_EXPIRY=7d

# API
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# AI
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=pdf,doc,docx,jpg,png,zip

# Frontend
VITE_API_URL=https://api.abdora.uz
VITE_APP_NAME=Abdora AI
```

---

## Database Setup

### PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database Migration

```bash
cd bialogiya_beakent

# Create database
createdb abdora_production

# Run migrations
npx prisma migrate deploy

# Seed data (optional)
npx prisma db seed
```

### Backup Strategy

```bash
# Daily backup
0 2 * * * pg_dump abdora_production > /backups/abdora_$(date +\%Y\%m\%d).sql

# Restore from backup
psql abdora_production < /backups/abdora_20240812.sql
```

---

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d abdora.uz -d api.abdora.uz

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name abdora.uz;

    ssl_certificate /etc/letsencrypt/live/abdora.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/abdora.uz/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name abdora.uz;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring

### PM2 Monitoring

```bash
# Start monitoring
pm2 monit

# Save PM2 ecosystem
pm2 ecosystem

# Auto-restart on restart
pm2 startup
pm2 save
```

### Log Management

```bash
# View logs
pm2 logs abdora-backend
pm2 logs --lines 100

# Save logs to file
pm2 logs abdora-backend > /var/log/abdora-backend.log
```

### Health Checks

```bash
# Add health check endpoint
# GET /health -> returns 200 OK

# Monitor script
curl -f http://localhost:3000/health || (pm2 restart abdora-backend)
```

### Database Monitoring

```bash
# Connection status
psql -U user -d abdora_production -c "SELECT version();"

# Active connections
psql -U user -d abdora_production -c "SELECT * FROM pg_stat_activity;"

# Database size
psql -U user -d abdora_production -c "SELECT pg_size_pretty(pg_database_size('abdora_production'));"
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U user -h localhost -d abdora_production
```

**2. Build Failure**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

**3. Memory Issues**
```bash
# Check memory usage
free -h

# Increase PM2 memory limit
pm2 start server.js --max-memory-restart 1G
```

---

## Production Checklist

- [ ] Database backed up
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Build tested locally
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Error tracking enabled
- [ ] CDN configured (optional)
- [ ] Rate limiting enabled
- [ ] Security headers set

---

**Last Updated:** August 2024

For issues: [GitHub Issues](https://github.com/AbdulhodiyOmonboyev/Abdora-ai/issues)
