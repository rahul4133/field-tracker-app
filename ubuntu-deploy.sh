#!/bin/bash

# Field Tracker App - Ubuntu 22 Server Deployment Script
# Run this script on your Ubuntu 22 server

set -e

echo "🚀 Starting Field Tracker App deployment on Ubuntu 22..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git build-essential nginx -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

print_status "Node.js version: $(node --version)"
print_status "NPM version: $(npm --version)"

# Install MongoDB 6.0
print_status "Installing MongoDB 6.0..."
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
print_status "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Create application directory
APP_DIR="/opt/field-tracker-app"
print_status "Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone repository (you'll need to update this with your actual repo URL)
print_warning "Please update the repository URL in this script before running"
# git clone https://github.com/yourusername/field-tracker-app.git $APP_DIR
# cd $APP_DIR

# For now, we'll assume the code is already in the current directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the Field Tracker app directory."
    exit 1
fi

# Copy files to application directory
print_status "Copying application files..."
sudo cp -r . $APP_DIR/
sudo chown -R $USER:$USER $APP_DIR
cd $APP_DIR

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

# Install frontend dependencies and build
print_status "Installing frontend dependencies and building..."
cd client
npm install
npm run build
cd ..

# Create required directories
print_status "Creating required directories..."
mkdir -p logs uploads uploads/leave-attachments
chmod 755 uploads uploads/leave-attachments

# Create environment file
print_status "Creating environment file..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/field-tracker-prod
JWT_SECRET=your_super_secure_jwt_secret_here_$(openssl rand -hex 32)
CLIENT_URL=http://localhost
SERVER_URL=http://localhost

# Cashfree Configuration (Update with your credentials)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_BASE_URL=https://api.cashfree.com/pg

# WhatsApp API Configuration (Update with your credentials)
INTERAKT_API_KEY=your_interakt_api_key
INTERAKT_BASE_URL=https://api.interakt.ai

# SMS API Configuration (Update with your credentials)
SMSMENOW_API_KEY=your_smsmenow_api_key
SMSMENOW_PASSWORD=your_smsmenow_password
SMSMENOW_SENDER_ID=your_sender_id
SMSMENOW_BASE_URL=http://sms.smsmenow.in

# Google Maps API (Update with your key)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EOF

print_warning "Please update the .env file with your actual API credentials"

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/field-tracker > /dev/null << EOF
server {
    listen 80;
    server_name localhost;

    # Serve static files
    location / {
        root $APP_DIR/client/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 10M;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/field-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

mkdir -p $BACKUP_DIR

# Database backup
mongodump --db field-tracker-prod --out $BACKUP_DIR/mongodb_$DATE
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz $BACKUP_DIR/mongodb_$DATE
rm -rf $BACKUP_DIR/mongodb_$DATE

# File backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Create health check script
print_status "Creating health check script..."
cat > health-check.sh << 'EOF'
#!/bin/bash
LOG_FILE="./logs/health-check.log"
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
MONGO_STATUS=$(mongosh --quiet --eval "db.runCommand('ping').ok" field-tracker-prod 2>/dev/null || echo "0")

if [ "$MONGO_STATUS" = "1" ]; then
    echo "[$DATE] MongoDB: OK" >> $LOG_FILE
else
    echo "[$DATE] MongoDB: FAILED" >> $LOG_FILE
    sudo systemctl restart mongod
fi
EOF

chmod +x health-check.sh

# Setup cron jobs
print_status "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> $APP_DIR/logs/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/health-check.sh") | crontab -

print_status "✅ Deployment completed successfully!"
print_status ""
print_status "🔧 Next steps:"
print_status "1. Update .env file with your actual API credentials"
print_status "2. Access your app at: http://$(hostname -I | awk '{print $1}')"
print_status "3. Create admin user by visiting: http://$(hostname -I | awk '{print $1}')/register"
print_status ""
print_status "📊 Useful commands:"
print_status "- Check app status: pm2 status"
print_status "- View logs: pm2 logs field-tracker-api"
print_status "- Restart app: pm2 restart field-tracker-api"
print_status "- Check MongoDB: sudo systemctl status mongod"
print_status ""
print_warning "Remember to:"
print_warning "- Update .env with real API credentials"
print_warning "- Configure domain name and SSL certificate"
print_warning "- Change default MongoDB settings for production"
