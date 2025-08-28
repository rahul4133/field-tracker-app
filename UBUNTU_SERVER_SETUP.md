# Field Tracker App - Ubuntu 22 Server Setup with MongoDB

## Complete Production Deployment Guide

### Prerequisites
- Ubuntu 22.04 LTS server
- Root or sudo access
- Domain name (optional but recommended)

## Step 1: Server Preparation

### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git build-essential -y
```

### Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v18.x.x
npm --version
```

### Install MongoDB 6.0
```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list and install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Install Nginx (Web Server)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 2: Application Deployment

### Clone Repository
```bash
cd /opt
sudo git clone https://github.com/yourusername/field-tracker-app.git
sudo chown -R $USER:$USER /opt/field-tracker-app
cd /opt/field-tracker-app
```

### Install Dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client
npm install
npm run build
cd ..
```

### Create Production Environment File
```bash
sudo nano .env
```

Add the following content:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/field-tracker-prod
JWT_SECRET=your_super_secure_jwt_secret_here_256_bits_minimum
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://yourdomain.com

# Cashfree Configuration
CASHFREE_APP_ID=your_production_cashfree_app_id
CASHFREE_SECRET_KEY=your_production_cashfree_secret_key
CASHFREE_BASE_URL=https://api.cashfree.com/pg

# WhatsApp API Configuration
INTERAKT_API_KEY=your_interakt_api_key
INTERAKT_BASE_URL=https://api.interakt.ai

# SMS API Configuration
SMSMENOW_API_KEY=your_smsmenow_api_key
SMSMENOW_PASSWORD=your_smsmenow_password
SMSMENOW_SENDER_ID=your_approved_sender_id
SMSMENOW_BASE_URL=http://sms.smsmenow.in

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Create Required Directories
```bash
mkdir -p logs uploads uploads/leave-attachments
chmod 755 uploads uploads/leave-attachments
```

## Step 3: PM2 Configuration

### Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

Update with production settings:
```javascript
module.exports = {
  apps: [{
    name: 'field-tracker-api',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### Start Application with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
# Follow the instructions to enable PM2 on boot
```

## Step 4: Nginx Configuration

### Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/field-tracker
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve static files
    location / {
        root /opt/field-tracker-app/client/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File upload size
    client_max_body_size 10M;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/field-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 6: Database Setup

### Create MongoDB Database and User
```bash
mongosh
```

In MongoDB shell:
```javascript
use field-tracker-prod

// Create admin user
db.createUser({
  user: "fieldtracker",
  pwd: "secure_password_here",
  roles: [
    { role: "readWrite", db: "field-tracker-prod" }
  ]
})

// Exit MongoDB shell
exit
```

### Update Environment with Database Credentials
```bash
nano .env
```

Update MongoDB URI:
```env
MONGODB_URI=mongodb://fieldtracker:secure_password_here@localhost:27017/field-tracker-prod
```

### Restart Application
```bash
pm2 restart field-tracker-api
```

## Step 7: Firewall Configuration

### Configure UFW Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

## Step 8: Monitoring and Logging

### Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/field-tracker
```

Add:
```
/opt/field-tracker-app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### MongoDB Monitoring
```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# MongoDB shell access
mongosh field-tracker-prod
```

## Step 9: Backup Strategy

### Create Backup Script
```bash
sudo nano /opt/field-tracker-app/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mongodump --db field-tracker-prod --out $BACKUP_DIR/mongodb_$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz $BACKUP_DIR/mongodb_$DATE
rm -rf $BACKUP_DIR/mongodb_$DATE

# File backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/field-tracker-app/uploads/

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Make Executable and Schedule
```bash
chmod +x /opt/field-tracker-app/backup.sh

# Add to crontab for daily backup at 2 AM
crontab -e
```

Add line:
```
0 2 * * * /opt/field-tracker-app/backup.sh >> /opt/field-tracker-app/logs/backup.log 2>&1
```

## Step 10: Health Monitoring

### Create Health Check Script
```bash
nano /opt/field-tracker-app/health-check.sh
```

```bash
#!/bin/bash
LOG_FILE="/opt/field-tracker-app/logs/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)

if [ $API_STATUS -eq 200 ]; then
    echo "[$DATE] API: OK" >> $LOG_FILE
else
    echo "[$DATE] API: FAILED (Status: $API_STATUS)" >> $LOG_FILE
    pm2 restart field-tracker-api
fi

# Check MongoDB
MONGO_STATUS=$(mongosh --quiet --eval "db.runCommand('ping').ok" field-tracker-prod)

if [ "$MONGO_STATUS" = "1" ]; then
    echo "[$DATE] MongoDB: OK" >> $LOG_FILE
else
    echo "[$DATE] MongoDB: FAILED" >> $LOG_FILE
    sudo systemctl restart mongod
fi
```

### Schedule Health Check
```bash
chmod +x /opt/field-tracker-app/health-check.sh

# Add to crontab for every 5 minutes
crontab -e
```

Add line:
```
*/5 * * * * /opt/field-tracker-app/health-check.sh
```

## Step 11: Security Hardening

### Install Fail2Ban
```bash
sudo apt install fail2ban -y

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### Start Fail2Ban
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

## Step 12: Final Verification

### Test All Components
```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MongoDB status
sudo systemctl status mongod

# Test API endpoints
curl http://localhost:5000/api/health
curl https://yourdomain.com/api/health

# Check logs
pm2 logs field-tracker-api --lines 20
```

## Access Your Application

- **Frontend**: https://yourdomain.com
- **API**: https://yourdomain.com/api
- **Health Check**: https://yourdomain.com/api/health

## Maintenance Commands

```bash
# View application logs
pm2 logs field-tracker-api

# Restart application
pm2 restart field-tracker-api

# Update application
cd /opt/field-tracker-app
git pull origin main
npm install
cd client && npm run build && cd ..
pm2 restart field-tracker-api

# Monitor system resources
htop
df -h
free -h

# Check MongoDB performance
mongosh field-tracker-prod --eval "db.stats()"
```

Your Field Tracker App is now fully deployed on Ubuntu 22 with MongoDB! 🚀
