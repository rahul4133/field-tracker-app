# Field Tracker App - Production Deployment Guide

## 🚀 Production-Ready Features

Your Field Tracker App now includes:
- **Cashfree Payment Gateway** - Secure payment processing with Indian payment methods
- **Interakt.shop WhatsApp API** - Professional WhatsApp messaging
- **SMSMeNow SMS Service** - Reliable SMS delivery service
- **Production Authentication** - No demo mode, secure JWT tokens
- **MongoDB Database** - Production-ready data persistence
- **Complete Attendance & Leave Management** - Hierarchical approval workflows
- **Real-time GPS Tracking** - Live employee location monitoring

## 📋 Prerequisites - Complete Beginner's Guide

### 1. Choosing the Best Server OS

**Recommended: Ubuntu 22.04 LTS Server** (Best for beginners)
- **Why Ubuntu?** Most beginner-friendly, excellent documentation, large community support
- **Why LTS?** Long Term Support (5 years of updates)
- **Alternative:** Ubuntu 20.04 LTS (if you need older compatibility)

### 2. Server Hardware Requirements

#### Minimum Requirements (Small Business)
- **CPU**: 2 cores, 2.4GHz
- **RAM**: 4GB DDR4
- **Storage**: 40GB SSD
- **Network**: 100 Mbps connection
- **Cost**: ~$20-30/month (DigitalOcean, Linode, Vultr)

#### Recommended Requirements (Growing Business)
- **CPU**: 4 cores, 2.8GHz
- **RAM**: 8GB DDR4
- **Storage**: 80GB SSD
- **Network**: 1 Gbps connection
- **Cost**: ~$40-60/month

#### Enterprise Requirements (High Traffic)
- **CPU**: 8+ cores, 3.2GHz
- **RAM**: 16GB+ DDR4
- **Storage**: 160GB+ NVMe SSD
- **Network**: 10 Gbps connection
- **Cost**: ~$100+/month

### 3. Server Provider Recommendations

#### Best for Beginners
1. **DigitalOcean** - Simple interface, great tutorials
2. **Linode** - Excellent documentation, competitive pricing
3. **Vultr** - Good performance, multiple locations

#### Enterprise Options
1. **AWS EC2** - Most features, complex pricing
2. **Google Cloud Platform** - Good for scaling
3. **Microsoft Azure** - Great Windows integration

### 4. Complete Ubuntu Server Setup (Step-by-Step)

#### Step 4.1: Create Your Server Instance

**For DigitalOcean (Most Beginner-Friendly):**

1. **Sign up** at https://digitalocean.com
2. **Create Droplet** → Choose an image
3. **Select**: Ubuntu 22.04 (LTS) x64
4. **Choose Plan**: 
   - Basic plan
   - Regular Intel with SSD
   - $24/month (4GB RAM, 2 CPUs, 80GB SSD) - Recommended
5. **Choose Region**: Closest to your users (e.g., Bangalore for India)
6. **Authentication**: 
   - Select "SSH Keys" (more secure)
   - Or "Password" (easier for beginners)
7. **Hostname**: `field-tracker-server`
8. **Click**: Create Droplet

#### Step 4.2: Connect to Your Server

**Method 1: Using SSH (Recommended)**
```bash
# On Windows: Use PuTTY or Windows Terminal
# On Mac/Linux: Use Terminal

# Replace YOUR_SERVER_IP with actual IP
ssh root@YOUR_SERVER_IP

# Example:
ssh root@142.93.195.123
```

**Method 2: Using DigitalOcean Console**
1. Go to your Droplet dashboard
2. Click "Console" → "Launch Droplet Console"
3. Login with root and your password

#### Step 4.3: Initial Server Security Setup

**Update the System:**
```bash
# Update package list
apt update

# Upgrade all packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

**Create a Non-Root User:**
```bash
# Create new user (replace 'fieldtracker' with your preferred username)
adduser fieldtracker

# Add user to sudo group
usermod -aG sudo fieldtracker

# Switch to new user
su - fieldtracker
```

**Setup SSH Key Authentication (Highly Recommended):**
```bash
# Create .ssh directory
mkdir -p ~/.ssh

# Set proper permissions
chmod 700 ~/.ssh

# Create authorized_keys file
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Add your public key (replace with your actual public key)
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC..." >> ~/.ssh/authorized_keys
```

**Configure SSH Security:**
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Make these changes:
# Port 2222                    # Change default port
# PermitRootLogin no          # Disable root login
# PasswordAuthentication no   # Disable password login (only if SSH keys work)
# PubkeyAuthentication yes    # Enable SSH key login

# Restart SSH service
sudo systemctl restart ssh
```

**Setup Firewall:**
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH on custom port (if you changed it)
sudo ufw allow 2222/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

### 5. Install Required Software (Step-by-Step)

#### Step 5.1: Install Node.js 18 LTS
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version    # Should show v18.x.x
npm --version     # Should show 9.x.x or higher

# Install build tools (needed for some npm packages)
sudo apt-get install -y build-essential
```

#### Step 5.2: Install MongoDB 6.0
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Test MongoDB connection
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

#### Step 5.3: Install Nginx Web Server
```bash
# Install Nginx
sudo apt-get install -y nginx

# Start Nginx service
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx

# Test Nginx (should show Nginx welcome page)
curl http://localhost
```

#### Step 5.4: Install PM2 Process Manager
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version

# Setup PM2 startup script
pm2 startup

# Follow the instructions shown (copy and run the command it provides)
```

#### Step 5.5: Install SSL Certificate Tools
```bash
# Install Certbot for Let's Encrypt SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Verify Certbot installation
certbot --version
```

### 6. Domain Setup (Before Deployment)

#### Step 6.1: Purchase a Domain
**Recommended Domain Registrars:**
- **Namecheap** - Good prices, easy management
- **GoDaddy** - Popular, good support
- **Google Domains** - Simple, integrated with Google services

#### Step 6.2: Configure DNS Records
**In your domain registrar's control panel:**

1. **A Record**: Point your domain to server IP
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   TTL: 3600
   ```

2. **CNAME Record**: Point www to your domain
   ```
   Type: CNAME
   Name: www
   Value: yourdomain.com
   TTL: 3600
   ```

3. **Wait for DNS Propagation** (can take 24-48 hours)
   ```bash
   # Check if DNS is working
   nslookup yourdomain.com
   ping yourdomain.com
   ```

### 7. Security Hardening for Beginners

#### Step 7.1: Install Fail2Ban (Prevents Brute Force Attacks)
```bash
# Install Fail2Ban
sudo apt-get install -y fail2ban

# Create custom configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Find and modify these settings:
# [DEFAULT]
# bantime = 3600        # Ban for 1 hour
# findtime = 600        # Check last 10 minutes
# maxretry = 3          # Allow 3 attempts

# [sshd]
# enabled = true
# port = 2222           # Your SSH port

# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check banned IPs
sudo fail2ban-client status sshd
```

#### Step 7.2: Setup Automatic Security Updates
```bash
# Install unattended-upgrades
sudo apt-get install -y unattended-upgrades

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Edit configuration (select "Yes" when prompted)
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Ensure these lines are uncommented:
# "${distro_id}:${distro_codename}-security";
# "${distro_id}ESMApps:${distro_codename}-apps-security";
```

#### Step 7.3: Configure System Monitoring
```bash
# Install system monitoring tools
sudo apt-get install -y htop iotop nethogs

# Install log monitoring
sudo apt-get install -y logwatch

# Configure logwatch to send daily reports
sudo nano /etc/cron.daily/00logwatch

# Add this content:
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto your-email@domain.com --detail high
```

### 8. Pre-Deployment Checklist

Before proceeding with application deployment, ensure:

- [ ] Server is accessible via SSH
- [ ] Non-root user created with sudo privileges
- [ ] Firewall configured and enabled
- [ ] Node.js 18+ installed and working
- [ ] MongoDB 6.0+ installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed globally
- [ ] Domain purchased and DNS configured
- [ ] SSL certificate tools installed
- [ ] Security hardening completed
- [ ] System monitoring configured

### 9. Common Beginner Mistakes to Avoid

1. **Using Root User**: Always use a non-root user for daily operations
2. **Weak Passwords**: Use strong passwords or SSH keys
3. **Default Ports**: Change default SSH port from 22
4. **No Backups**: Set up automated backups from day one
5. **No Monitoring**: Install monitoring tools before issues occur
6. **Skipping Updates**: Keep system and software updated
7. **No SSL**: Always use HTTPS in production
8. **Weak Firewall**: Configure firewall properly
9. **No Documentation**: Document your setup and passwords
10. **Single Point of Failure**: Consider redundancy for critical systems

### 10. Emergency Contacts and Resources

**If You Get Stuck:**
- **DigitalOcean Community**: https://www.digitalocean.com/community
- **Ubuntu Forums**: https://ubuntuforums.org/
- **Stack Overflow**: https://stackoverflow.com/
- **MongoDB Community**: https://www.mongodb.com/community/forums

**Emergency Commands:**
```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h

# Check running services
sudo systemctl list-units --type=service --state=running

# Restart all services if needed
sudo systemctl restart mongod nginx
pm2 restart all
```

### 3. API Keys Required

#### Razorpay (Payment Gateway)
1. Sign up at https://razorpay.com/
2. Get Test/Live API keys from Dashboard
3. Required: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

#### Interakt.shop (WhatsApp)
1. Sign up at https://www.interakt.shop/
2. Get API key from dashboard
3. Required: `INTERAKT_API_KEY`

#### BLNL DLT (SMS)
1. Sign up at https://www.blnl.in/
2. Complete DLT registration
3. Required: `BLNL_API_KEY` and `BLNL_SENDER_ID`

#### Google Maps (Optional)
1. Get API key from Google Cloud Console
2. Enable Maps JavaScript API and Geocoding API
3. Required: `GOOGLE_MAPS_API_KEY`

## 🛠️ Complete Application Deployment Guide

### Step 1: Prepare Your Code Repository

#### Step 1.1: Create GitHub Repository (If Not Done)
```bash
# On your local machine, initialize git (if not already done)
cd /path/to/your/field-tracker-app
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial production-ready commit"

# Create repository on GitHub.com and add remote
git remote add origin https://github.com/yourusername/field-tracker-app.git

# Push to GitHub
git push -u origin main
```

#### Step 1.2: Verify Production Files
**Ensure these files exist in your repository:**
- `server.js` (main backend file)
- `package.json` (backend dependencies)
- `client/package.json` (frontend dependencies)
- `client/src/` (React source files)
- `.env.example` (environment template)
- `PRODUCTION_DEPLOYMENT_GUIDE.md` (this guide)
- `ecosystem.config.js` (will create during deployment)

### Step 2: Server Initial Setup (Detailed)

#### Step 2.1: Connect to Your Server
```bash
# Connect via SSH (replace with your server IP)
ssh fieldtracker@YOUR_SERVER_IP -p 2222

# If using password authentication initially
ssh fieldtracker@YOUR_SERVER_IP

# First time connection will ask to verify fingerprint - type 'yes'
```

#### Step 2.2: Update System and Install Git
```bash
# Update package lists
sudo apt update

# Upgrade all packages (this may take 5-10 minutes)
sudo apt upgrade -y

# Install Git and essential tools
sudo apt install -y git curl wget unzip build-essential

# Verify Git installation
git --version
```

#### Step 2.3: Create Application Directory Structure
```bash
# Create main application directory
mkdir -p /home/fieldtracker/apps

# Create logs directory
mkdir -p /home/fieldtracker/logs

# Create backups directory
mkdir -p /home/fieldtracker/backups

# Create SSL certificates directory
sudo mkdir -p /etc/ssl/certs/fieldtracker

# Set proper permissions
chmod 755 /home/fieldtracker/apps
chmod 755 /home/fieldtracker/logs
chmod 755 /home/fieldtracker/backups
```

### Step 3: Clone and Setup Application (Detailed)

#### Step 3.1: Clone Repository
```bash
# Navigate to apps directory
cd /home/fieldtracker/apps

# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/field-tracker-app.git

# Navigate to application directory
cd field-tracker-app

# Verify files are present
ls -la

# Check current branch
git branch

# If not on main branch, switch to it
git checkout main
```

#### Step 3.2: Install Backend Dependencies
```bash
# Install Node.js dependencies for backend
npm install

# Verify installation
npm list --depth=0

# Check for vulnerabilities and fix if any
npm audit
npm audit fix

# Install additional production dependencies if needed
npm install --production
```

#### Step 3.3: Setup Frontend Build
```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Check for vulnerabilities
npm audit
npm audit fix

# Create production build (this may take 5-10 minutes)
npm run build

# Verify build was created
ls -la build/

# Navigate back to root directory
cd ..
```

### Step 4: Environment Configuration (Detailed)

#### Step 4.1: Create Production Environment File
```bash
# Copy example environment file
cp .env.example .env

# Edit environment file
nano .env
```

#### Step 4.2: Complete Production Environment Configuration
**Replace ALL placeholder values with actual production values:**

```env
# Database Configuration
MONGODB_URI=mongodb://fieldtracker:YOUR_SECURE_DB_PASSWORD@localhost:27017/field-tracker-prod?authSource=field-tracker-prod

# JWT Secret (Generate a strong secret)
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters_long

# Payment Gateway - Razorpay
RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_RAZORPAY_SECRET_KEY

# WhatsApp Integration - Interakt.shop
INTERAKT_API_KEY=YOUR_ACTUAL_INTERAKT_API_KEY
INTERAKT_BASE_URL=https://api.interakt.ai

# SMS Integration - BLNL DLT
BLNL_API_KEY=YOUR_ACTUAL_BLNL_API_KEY
BLNL_SENDER_ID=YOUR_APPROVED_SENDER_ID
BLNL_BASE_URL=https://api.blnl.in

# Google Maps API (Optional)
GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_GOOGLE_MAPS_API_KEY

# Application Settings
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-app-email@gmail.com
SMTP_PASS=your-app-password
```

#### Step 4.3: Secure Environment File
```bash
# Set proper permissions (only owner can read/write)
chmod 600 .env

# Verify permissions
ls -la .env

# Should show: -rw------- 1 fieldtracker fieldtracker
```

### Step 5: Database Setup (Detailed)

#### Step 5.1: Secure MongoDB Installation
```bash
# Start MongoDB if not running
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Check MongoDB status
sudo systemctl status mongod

# Should show "active (running)"
```

#### Step 5.2: Create Database and User
```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user (replace with strong password)
db.createUser({
  user: "admin",
  pwd: "YOUR_SUPER_SECURE_ADMIN_PASSWORD",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Switch to your application database
use field-tracker-prod

# Create application user (replace with strong password)
db.createUser({
  user: "fieldtracker",
  pwd: "YOUR_SECURE_DB_PASSWORD",
  roles: ["readWrite", "dbAdmin"]
})

# Exit MongoDB shell
exit
```

#### Step 5.3: Enable MongoDB Authentication
```bash
# Edit MongoDB configuration
sudo nano /etc/mongod.conf

# Find the security section and uncomment/add:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Test connection with authentication
mongosh -u fieldtracker -p YOUR_SECURE_DB_PASSWORD --authenticationDatabase field-tracker-prod field-tracker-prod

# Should connect successfully
exit
```

### Step 6: Application Process Management (Detailed)

#### Step 6.1: Create PM2 Ecosystem Configuration
```bash
# Create PM2 configuration file
nano ecosystem.config.js
```

**Add this configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'field-tracker-api',
    script: 'server.js',
    instances: 2, // Use 2 instances for load balancing
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/home/fieldtracker/logs/err.log',
    out_file: '/home/fieldtracker/logs/out.log',
    log_file: '/home/fieldtracker/logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

#### Step 6.2: Start Application with PM2
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Check application status
pm2 status

# View logs
pm2 logs field-tracker-api

# Monitor application
pm2 monit

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup

# Copy and run the command it provides (it will look like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u fieldtracker --hp /home/fieldtracker
```

#### Step 6.3: Test Application
```bash
# Test if API is responding
curl http://localhost:5000/api/health

# If no health endpoint, test any endpoint
curl http://localhost:5000/api/auth/profile

# Check if application is binding to correct port
netstat -tlnp | grep :5000

# Should show something like: tcp6 0 0 :::5000 :::* LISTEN 12345/node
```

### Step 7: Web Server Configuration (Detailed)

#### Step 7.1: Create Nginx Configuration
```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/field-tracker
```

**Add this comprehensive configuration:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream backend servers
upstream field_tracker_backend {
    least_conn;
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Root directory for React build
    root /home/fieldtracker/apps/field-tracker-app/client/build;
    index index.html index.htm;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API endpoints with rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://field_tracker_backend;
        include /etc/nginx/proxy_params;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://field_tracker_backend;
        include /etc/nginx/proxy_params;
        
        # Additional headers for API
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.io for real-time features
    location /socket.io/ {
        proxy_pass http://field_tracker_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Socket.io specific timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # React app - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security headers for HTML
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|log|conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

#### Step 7.2: Create Proxy Parameters
```bash
# Create proxy parameters file
sudo nano /etc/nginx/proxy_params
```

**Add this content:**
```nginx
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_buffering off;
```

#### Step 7.3: Enable Site and Test Configuration
```bash
# Test Nginx configuration
sudo nginx -t

# Should show: syntax is ok, test is successful

# Enable the site
sudo ln -s /etc/nginx/sites-available/field-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# Test web server
curl -I http://yourdomain.com
```

### Step 8: SSL Certificate Setup (Detailed)

#### Step 8.1: Obtain SSL Certificate
```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms of service
# - Choose whether to share email with EFF

# Start Nginx again
sudo systemctl start nginx
```

#### Step 8.2: Configure SSL in Nginx
```bash
# Edit Nginx configuration to add SSL
sudo nano /etc/nginx/sites-available/field-tracker
```

**Add SSL server block:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Rest of configuration same as HTTP block above...
    # (Copy all the location blocks and other settings)
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Step 8.3: Test SSL Configuration
```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Test SSL certificate
curl -I https://yourdomain.com

# Test SSL rating (optional)
# Go to: https://www.ssllabs.com/ssltest/
```

#### Step 8.4: Setup SSL Auto-Renewal
```bash
# Test renewal process
sudo certbot renew --dry-run

# Should show: Congratulations, all renewals succeeded

# Add to crontab for automatic renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

### Step 9: Final Testing and Verification

#### Step 9.1: Test All Endpoints
```bash
# Test API health
curl https://yourdomain.com/api/health

# Test frontend loading
curl -I https://yourdomain.com

# Test WebSocket connection (if applicable)
curl -I https://yourdomain.com/socket.io/

# Check all services are running
sudo systemctl status nginx mongod
pm2 status
```

#### Step 9.2: Performance Testing
```bash
# Install Apache Bench for testing
sudo apt install -y apache2-utils

# Test API performance (100 requests, 10 concurrent)
ab -n 100 -c 10 https://yourdomain.com/api/health

# Test frontend performance
ab -n 100 -c 10 https://yourdomain.com/
```

#### Step 9.3: Security Testing
```bash
# Check open ports
sudo netstat -tlnp

# Should only show: 22 (SSH), 80 (HTTP), 443 (HTTPS), 27017 (MongoDB - local only)

# Test firewall
sudo ufw status

# Check for security updates
sudo apt list --upgradable
```

## 🔧 Production Monitoring and Maintenance

### Step 10: Setup Monitoring and Logging

#### Step 10.1: Install System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs ncdu

# Install log analysis tools
sudo apt install -y logwatch fail2ban-client

# Install process monitoring
sudo apt install -y supervisor

# Create monitoring script
nano /home/fieldtracker/monitor.sh
```

**Add monitoring script:**
```bash
#!/bin/bash
echo "=== System Status Report $(date) ==="
echo
echo "=== CPU and Memory ==="
free -h
echo
echo "=== Disk Usage ==="
df -h
echo
echo "=== Network Connections ==="
netstat -tlnp | grep -E ':80|:443|:5000|:27017'
echo
echo "=== PM2 Status ==="
pm2 status
echo
echo "=== MongoDB Status ==="
sudo systemctl status mongod --no-pager -l
echo
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l
echo
echo "=== Recent Errors ==="
tail -20 /home/fieldtracker/logs/err.log
```

```bash
# Make script executable
chmod +x /home/fieldtracker/monitor.sh

# Test monitoring script
./monitor.sh
```

#### Step 10.2: Setup Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/field-tracker
```

**Add this configuration:**
```
/home/fieldtracker/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 fieldtracker fieldtracker
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Step 10.3: Setup Health Checks
```bash
# Create health check script
nano /home/fieldtracker/health-check.sh
```

**Add health check script:**
```bash
#!/bin/bash
LOG_FILE="/home/fieldtracker/logs/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log messages
log_message() {
    echo "[$DATE] $1" >> $LOG_FILE
}

# Check API health
if curl -f -s https://yourdomain.com/api/health > /dev/null; then
    log_message "API: OK"
else
    log_message "API: FAILED - Restarting PM2"
    pm2 restart field-tracker-api
    sleep 10
    if curl -f -s https://yourdomain.com/api/health > /dev/null; then
        log_message "API: RECOVERED after restart"
    else
        log_message "API: STILL FAILED after restart - Manual intervention needed"
        # Send alert email (configure SMTP first)
        # echo "API health check failed on $(hostname)" | mail -s "Field Tracker Alert" admin@yourdomain.com
    fi
fi

# Check MongoDB
if mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log_message "MongoDB: OK"
else
    log_message "MongoDB: FAILED - Restarting service"
    sudo systemctl restart mongod
    sleep 15
    if mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log_message "MongoDB: RECOVERED after restart"
    else
        log_message "MongoDB: STILL FAILED - Manual intervention needed"
    fi
fi

# Check Nginx
if curl -f -s -I https://yourdomain.com > /dev/null; then
    log_message "Nginx: OK"
else
    log_message "Nginx: FAILED - Restarting service"
    sudo systemctl restart nginx
    sleep 5
    if curl -f -s -I https://yourdomain.com > /dev/null; then
        log_message "Nginx: RECOVERED after restart"
    else
        log_message "Nginx: STILL FAILED - Manual intervention needed"
    fi
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log_message "DISK: WARNING - Usage at ${DISK_USAGE}%"
    if [ $DISK_USAGE -gt 90 ]; then
        log_message "DISK: CRITICAL - Usage at ${DISK_USAGE}% - Cleaning logs"
        find /home/fieldtracker/logs -name "*.log" -mtime +7 -delete
        pm2 flush
    fi
else
    log_message "DISK: OK - Usage at ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 85 ]; then
    log_message "MEMORY: WARNING - Usage at ${MEMORY_USAGE}%"
    if [ $MEMORY_USAGE -gt 95 ]; then
        log_message "MEMORY: CRITICAL - Usage at ${MEMORY_USAGE}% - Restarting PM2"
        pm2 restart all
    fi
else
    log_message "MEMORY: OK - Usage at ${MEMORY_USAGE}%"
fi
```

```bash
# Make health check executable
chmod +x /home/fieldtracker/health-check.sh

# Test health check
./health-check.sh

# View health check log
tail -20 /home/fieldtracker/logs/health-check.log
```

#### Step 10.4: Setup Automated Tasks
```bash
# Edit crontab for automated tasks
crontab -e

# Add these cron jobs:
# Health check every 5 minutes
*/5 * * * * /home/fieldtracker/health-check.sh

# System monitoring report every hour
0 * * * * /home/fieldtracker/monitor.sh >> /home/fieldtracker/logs/system-monitor.log

# Daily backup at 2 AM
0 2 * * * /home/fieldtracker/backup.sh

# Weekly system update check (Sundays at 3 AM)
0 3 * * 0 apt list --upgradable >> /home/fieldtracker/logs/updates-available.log

# Monthly log cleanup (1st of month at 1 AM)
0 1 1 * * find /home/fieldtracker/logs -name "*.log" -mtime +30 -delete
```

### Step 11: Backup and Recovery Setup

#### Step 11.1: Create Comprehensive Backup Script
```bash
# Create backup script
nano /home/fieldtracker/backup.sh
```

**Add backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/fieldtracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/home/fieldtracker/logs/backup.log"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log_message "Starting backup process..."

# Create backup directories
mkdir -p $BACKUP_DIR/mongodb
mkdir -p $BACKUP_DIR/application
mkdir -p $BACKUP_DIR/nginx
mkdir -p $BACKUP_DIR/ssl

# Backup MongoDB
log_message "Backing up MongoDB..."
mongodump --db field-tracker-prod --out $BACKUP_DIR/mongodb/mongo_$DATE
if [ $? -eq 0 ]; then
    log_message "MongoDB backup completed successfully"
    # Compress MongoDB backup
    tar -czf $BACKUP_DIR/mongodb/mongo_$DATE.tar.gz -C $BACKUP_DIR/mongodb mongo_$DATE
    rm -rf $BACKUP_DIR/mongodb/mongo_$DATE
else
    log_message "MongoDB backup failed!"
fi

# Backup application files
log_message "Backing up application files..."
tar -czf $BACKUP_DIR/application/app_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='client/node_modules' \
    --exclude='client/build' \
    --exclude='.git' \
    /home/fieldtracker/apps/field-tracker-app
if [ $? -eq 0 ]; then
    log_message "Application backup completed successfully"
else
    log_message "Application backup failed!"
fi

# Backup Nginx configuration
log_message "Backing up Nginx configuration..."
sudo tar -czf $BACKUP_DIR/nginx/nginx_$DATE.tar.gz \
    /etc/nginx/sites-available/field-tracker \
    /etc/nginx/proxy_params
if [ $? -eq 0 ]; then
    log_message "Nginx backup completed successfully"
else
    log_message "Nginx backup failed!"
fi

# Backup SSL certificates
log_message "Backing up SSL certificates..."
sudo tar -czf $BACKUP_DIR/ssl/ssl_$DATE.tar.gz \
    /etc/letsencrypt/live/yourdomain.com/ \
    /etc/letsencrypt/renewal/yourdomain.com.conf
if [ $? -eq 0 ]; then
    log_message "SSL backup completed successfully"
else
    log_message "SSL backup failed!"
fi

# Backup environment file
log_message "Backing up environment configuration..."
cp /home/fieldtracker/apps/field-tracker-app/.env $BACKUP_DIR/application/env_$DATE.backup

# Clean old backups (keep last 7 days)
log_message "Cleaning old backups..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

# Calculate backup sizes
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
log_message "Backup process completed. Total backup size: $TOTAL_SIZE"

# Optional: Upload to cloud storage (uncomment and configure)
# log_message "Uploading to cloud storage..."
# aws s3 sync $BACKUP_DIR s3://your-backup-bucket/field-tracker-backups/
```

```bash
# Make backup script executable
chmod +x /home/fieldtracker/backup.sh

# Test backup script
./backup.sh

# Check backup was created
ls -la /home/fieldtracker/backups/
```

#### Step 11.2: Create Recovery Script
```bash
# Create recovery script
nano /home/fieldtracker/recovery.sh
```

**Add recovery script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/fieldtracker/backups"
LOG_FILE="/home/fieldtracker/logs/recovery.log"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_date>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/mongodb/mongo_*.tar.gz | awk '{print $9}' | sed 's/.*mongo_\(.*\)\.tar\.gz/\1/'
    exit 1
fi

BACKUP_DATE=$1
log_message "Starting recovery process for backup date: $BACKUP_DATE"

# Stop services
log_message "Stopping services..."
pm2 stop all
sudo systemctl stop nginx

# Restore MongoDB
if [ -f "$BACKUP_DIR/mongodb/mongo_$BACKUP_DATE.tar.gz" ]; then
    log_message "Restoring MongoDB..."
    cd $BACKUP_DIR/mongodb
    tar -xzf mongo_$BACKUP_DATE.tar.gz
    mongorestore --db field-tracker-prod --drop mongo_$BACKUP_DATE/field-tracker-prod/
    rm -rf mongo_$BACKUP_DATE
    log_message "MongoDB restore completed"
else
    log_message "MongoDB backup not found for date: $BACKUP_DATE"
fi

# Restore application
if [ -f "$BACKUP_DIR/application/app_$BACKUP_DATE.tar.gz" ]; then
    log_message "Restoring application..."
    cd /home/fieldtracker/apps
    mv field-tracker-app field-tracker-app.old
    tar -xzf $BACKUP_DIR/application/app_$BACKUP_DATE.tar.gz
    log_message "Application restore completed"
else
    log_message "Application backup not found for date: $BACKUP_DATE"
fi

# Restore environment file
if [ -f "$BACKUP_DIR/application/env_$BACKUP_DATE.backup" ]; then
    log_message "Restoring environment configuration..."
    cp $BACKUP_DIR/application/env_$BACKUP_DATE.backup /home/fieldtracker/apps/field-tracker-app/.env
    log_message "Environment restore completed"
fi

# Start services
log_message "Starting services..."
sudo systemctl start nginx
pm2 start all

log_message "Recovery process completed"
```

```bash
# Make recovery script executable
chmod +x /home/fieldtracker/recovery.sh
```

### Step 12: Performance Optimization

#### Step 12.1: Optimize Node.js Application
```bash
# Update PM2 configuration for better performance
nano ecosystem.config.js
```

**Update with performance optimizations:**
```javascript
module.exports = {
  apps: [{
    name: 'field-tracker-api',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size',
      '--gc-interval=100'
    ],
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      UV_THREADPOOL_SIZE: 16
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      UV_THREADPOOL_SIZE: 16
    },
    error_file: '/home/fieldtracker/logs/err.log',
    out_file: '/home/fieldtracker/logs/out.log',
    log_file: '/home/fieldtracker/logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Performance monitoring
    pmx: true,
    
    // Advanced PM2 features
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

#### Step 12.2: Optimize MongoDB
```bash
# Edit MongoDB configuration for production
sudo nano /etc/mongod.conf
```

**Add performance optimizations:**
```yaml
# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1
  maxIncomingConnections: 1000

# Storage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2
      journalCompressor: snappy
      directoryForIndexes: false
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

# Operation Profiling
operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp

# Replication (for high availability)
# replication:
#   replSetName: "rs0"

# Security
security:
  authorization: enabled

# Process Management
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
  timeZoneInfo: /usr/share/zoneinfo

# Logging
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: reopen
```

```bash
# Restart MongoDB with new configuration
sudo systemctl restart mongod

# Verify MongoDB is running with new settings
sudo systemctl status mongod
```

#### Step 12.3: Optimize Nginx
```bash
# Edit main Nginx configuration
sudo nano /etc/nginx/nginx.conf
```

**Add performance optimizations:**
```nginx
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 20M;
    
    # Buffer Settings
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Timeout Settings
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # File Cache
    open_file_cache max=200000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=global:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Step 13: Security Hardening

#### Step 13.1: Setup Advanced Firewall Rules
```bash
# Reset UFW to defaults
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (custom port)
sudo ufw allow 2222/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Rate limit SSH connections
sudo ufw limit 2222/tcp

# Allow specific IP ranges (adjust for your needs)
# sudo ufw allow from 192.168.1.0/24 to any port 22

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

#### Step 13.2: Harden SSH Configuration
```bash
# Create backup of SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

**Add these security settings:**
```
# Network
Port 2222
AddressFamily inet
ListenAddress 0.0.0.0

# Authentication
PermitRootLogin no
MaxAuthTries 3
MaxSessions 2
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Timeout
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60

# Restrictions
AllowUsers fieldtracker
DenyUsers root
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitTunnel no

# Logging
SyslogFacility AUTH
LogLevel VERBOSE
```

```bash
# Test SSH configuration
sudo sshd -t

# Restart SSH service
sudo systemctl restart ssh
```

#### Step 13.3: Setup Intrusion Detection
```bash
# Configure Fail2Ban for comprehensive protection
sudo nano /etc/fail2ban/jail.local
```

**Add comprehensive Fail2Ban configuration:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd
usedns = warn
logencoding = auto
enabled = false
mode = normal
filter = %(__name__)s[mode=%(mode)s]

[sshd]
enabled = true
port = 2222
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 2

[nginx-noscript]
enabled = true
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-nohome]
enabled = true
filter = nginx-nohome
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban

# Check Fail2Ban status
sudo fail2ban-client status
```

### Step 14: Go-Live Checklist and Final Steps

#### Step 14.1: Pre-Launch Verification
```bash
# Create final verification script
nano /home/fieldtracker/pre-launch-check.sh
```

**Add verification script:**
```bash
#!/bin/bash
echo "=== Field Tracker App - Pre-Launch Verification ==="
echo

# Check all services
echo "1. Checking Services Status..."
services=("nginx" "mongod" "ssh" "fail2ban")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "   ✓ $service is running"
    else
        echo "   ✗ $service is NOT running"
    fi
done

# Check PM2 processes
echo
echo "2. Checking PM2 Processes..."
pm2 status

# Check ports
echo
echo "3. Checking Open Ports..."
netstat -tlnp | grep -E ':80|:443|:2222|:5000'

# Check SSL certificate
echo
echo "4. Checking SSL Certificate..."
if openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates; then
    echo "   ✓ SSL certificate is valid"
else
    echo "   ✗ SSL certificate issue"
fi

# Check API endpoints
echo
echo "5. Testing API Endpoints..."
if curl -f -s https://yourdomain.com/api/health > /dev/null; then
    echo "   ✓ API health endpoint responding"
else
    echo "   ✗ API health endpoint not responding"
fi

# Check frontend
echo
echo "6. Testing Frontend..."
if curl -f -s -I https://yourdomain.com | grep -q "200 OK"; then
    echo "   ✓ Frontend loading successfully"
else
    echo "   ✗ Frontend not loading"
fi

# Check database connection
echo
echo "7. Testing Database Connection..."
if mongosh --quiet --eval "db.adminCommand('ping')" field-tracker-prod > /dev/null 2>&1; then
    echo "   ✓ Database connection successful"
else
    echo "   ✗ Database connection failed"
fi

# Check disk space
echo
echo "8. Checking System Resources..."
df -h | grep -E '^/dev/'
echo
free -h

# Check security
echo
echo "9. Security Check..."
sudo ufw status | head -10

echo
echo "=== Pre-Launch Check Complete ==="
```

```bash
# Make script executable and run
chmod +x /home/fieldtracker/pre-launch-check.sh
./pre-launch-check.sh
```

#### Step 14.2: Final Configuration Updates
```bash
# Update environment to production
nano /home/fieldtracker/apps/field-tracker-app/.env

# Ensure these settings:
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# Restart application with production settings
pm2 restart all --env production

# Update Nginx configuration with your actual domain
sudo nano /etc/nginx/sites-available/field-tracker
# Replace 'yourdomain.com' with your actual domain

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 14.3: Performance Baseline
```bash
# Run performance tests
echo "Running performance baseline tests..."

# API performance
ab -n 1000 -c 10 https://yourdomain.com/api/health > /home/fieldtracker/logs/api-performance.log

# Frontend performance  
ab -n 1000 -c 10 https://yourdomain.com/ > /home/fieldtracker/logs/frontend-performance.log

echo "Performance baseline completed. Check logs for results."
```

## 🎯 Final Production Checklist

### Essential Verifications:
- [ ] Server provisioned and secured
- [ ] Domain DNS configured and propagating
- [ ] SSL certificate installed and auto-renewing
- [ ] All services running (Nginx, MongoDB, PM2)
- [ ] Firewall configured and active
- [ ] Monitoring and health checks operational
- [ ] Backup system tested and scheduled
- [ ] API keys configured and tested
- [ ] Performance benchmarks established
- [ ] Security hardening completed
- [ ] Log rotation configured
- [ ] Recovery procedures documented

### Post-Launch Monitoring:
- Monitor `/home/fieldtracker/logs/health-check.log` for issues
- Check system resources with `htop` and `df -h`
- Review Nginx access logs for traffic patterns
- Monitor PM2 processes with `pm2 monit`
- Verify SSL certificate renewal works
- Test backup and recovery procedures monthly

Your Field Tracker App is now production-ready with enterprise-grade monitoring, security, and maintenance procedures! 🚀
```env
# Environment Variables Setup
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/field-tracker-prod
JWT_SECRET=your_super_secure_jwt_secret_here_256_bits_minimum
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://yourdomain.com

# Cashfree Configuration (Get from https://merchant.cashfree.com)
CASHFREE_APP_ID=your_production_cashfree_app_id
CASHFREE_SECRET_KEY=your_production_cashfree_secret_key
CASHFREE_BASE_URL=https://api.cashfree.com/pg

# WhatsApp API Configuration (Get from https://app.interakt.ai)
INTERAKT_API_KEY=your_interakt_api_key
INTERAKT_BASE_URL=https://api.interakt.ai

# SMS API Configuration (Get from http://sms.smsmenow.in)
SMSMENOW_API_KEY=your_smsmenow_api_key
SMSMENOW_PASSWORD=your_smsmenow_password
SMSMENOW_SENDER_ID=your_approved_sender_id
SMSMENOW_BASE_URL=http://sms.smsmenow.in

# Google Maps API (Get from Google Cloud Console)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EOF
```

### Step 4: Database Setup
```bash
# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user (optional but recommended)
mongo
use field-tracker-prod
db.createUser({
  user: "fieldtracker",
  pwd: "secure_password_here",
  roles: ["readWrite"]
})
exit

# Update MONGODB_URI in .env if using authentication
# MONGODB_URI=mongodb://fieldtracker:secure_password_here@localhost:27017/field-tracker-prod
```

### Step 5: PM2 Process Management
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'field-tracker-api',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 6: Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/field-tracker
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React build files
    location / {
        root /home/fieldtracker/apps/field-tracker-app/client/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
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
    }

    # Socket.io proxy
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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/field-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)
```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 8: Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Step 9: Monitoring and Logs
```bash
# Install monitoring tools
sudo npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Set up log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Monitor application
pm2 monit
pm2 logs
```

## 🔧 Production Optimizations

### 1. Database Optimization
```bash
# MongoDB configuration
sudo nano /etc/mongod.conf
```

```yaml
# Add these optimizations
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
    collectionConfig:
      blockCompressor: snappy

net:
  maxIncomingConnections: 1000

operationProfiling:
  slowOpThresholdMs: 100
```

### 2. Node.js Optimizations
```bash
# Update ecosystem.config.js
module.exports = {
  apps: [{
    name: 'field-tracker-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

### 3. Security Hardening
```bash
# Install fail2ban
sudo apt install fail2ban

# Configure fail2ban for Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Create health check script
cat > health-check.sh << EOF
#!/bin/bash
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "API is healthy"
else
    echo "API is down, restarting..."
    pm2 restart field-tracker-api
fi
EOF

chmod +x health-check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /home/fieldtracker/apps/field-tracker-app/health-check.sh
```

### Backup Strategy
```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db field-tracker-prod --out /home/fieldtracker/backups/mongo_$DATE
tar -czf /home/fieldtracker/backups/app_$DATE.tar.gz /home/fieldtracker/apps/field-tracker-app
# Keep only last 7 days of backups
find /home/fieldtracker/backups -name "*.tar.gz" -mtime +7 -delete
find /home/fieldtracker/backups -name "mongo_*" -mtime +7 -exec rm -rf {} \;
EOF

chmod +x backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/fieldtracker/apps/field-tracker-app/backup.sh
```

## 🔄 Deployment Updates

### Zero-Downtime Deployment
```bash
# Create deployment script
cat > deploy.sh << EOF
#!/bin/bash
echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build frontend
cd client
npm install
npm run build
cd ..

# Restart API with zero downtime
pm2 reload field-tracker-api

echo "Deployment completed!"
EOF

chmod +x deploy.sh
```

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

2. **PM2 Process Crashed**
   ```bash
   pm2 logs field-tracker-api
   pm2 restart field-tracker-api
   ```

3. **Nginx 502 Bad Gateway**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   pm2 status
   ```

4. **SSL Certificate Issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

## 📞 Support and Maintenance

### Log Locations
- **Application Logs**: `/home/fieldtracker/apps/field-tracker-app/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **MongoDB Logs**: `/var/log/mongodb/`
- **System Logs**: `/var/log/syslog`

### Performance Monitoring
```bash
# Install htop for system monitoring
sudo apt install htop

# Monitor system resources
htop

# Monitor MongoDB performance
mongostat

# Monitor PM2 processes
pm2 monit
```

## 🎯 Go-Live Checklist

- [ ] Server provisioned with required specifications
- [ ] All dependencies installed and configured
- [ ] API keys obtained and configured
- [ ] Database setup and secured
- [ ] Application deployed and tested
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Health checks configured
- [ ] Domain DNS configured
- [ ] Load testing completed
- [ ] Security audit completed

## 📈 Scaling Considerations

For high-traffic scenarios:
1. **Load Balancer**: Use multiple server instances behind a load balancer
2. **Database Clustering**: MongoDB replica sets for high availability
3. **CDN**: Use CloudFlare or AWS CloudFront for static assets
4. **Caching**: Implement Redis for session and data caching
5. **Monitoring**: Use tools like New Relic or DataDog

Your Field Tracker App is now production-ready! 🚀
