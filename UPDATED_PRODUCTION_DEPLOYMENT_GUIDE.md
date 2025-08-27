# Field Tracker App - Updated Production Deployment Guide

## 🚀 Production-Ready Features

Your Field Tracker App now includes:
- **Cashfree Payment Gateway** - Secure payment processing with Indian payment methods
- **Interakt.shop WhatsApp API** - Professional WhatsApp messaging
- **SMSMeNow SMS Service** - Reliable SMS delivery service
- **Production Authentication** - No demo mode, secure JWT tokens
- **MongoDB Database** - Production-ready data persistence
- **Complete Attendance & Leave Management** - Hierarchical approval workflows
- **Real-time GPS Tracking** - Live employee location monitoring

## 📋 Environment Variables Configuration

### Production Environment Variables (.env)
```env
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
```

## 🔧 Service Provider Setup

### 1. Cashfree Payment Gateway Setup

#### Step 1: Create Cashfree Account
1. Visit [https://merchant.cashfree.com](https://merchant.cashfree.com)
2. Sign up for a merchant account
3. Complete KYC verification
4. Get your production credentials:
   - App ID
   - Secret Key

#### Step 2: Configure Webhooks
```bash
# Add webhook URL in Cashfree dashboard:
# Webhook URL: https://yourdomain.com/api/payments/webhook
# Events: payment.success, payment.failed
```

#### Step 3: Test Integration
```bash
# Test payment flow
curl -X POST https://yourdomain.com/api/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100,
    "customerId": "customer_id",
    "visitId": "visit_id"
  }'
```

### 2. SMSMeNow SMS Service Setup

#### Step 1: Create SMSMeNow Account
1. Visit [http://sms.smsmenow.in](http://sms.smsmenow.in)
2. Sign up for an account
3. Purchase SMS credits
4. Get your credentials:
   - API Key (Username)
   - Password
   - Sender ID

#### Step 2: Configure Sender ID
```bash
# Register your sender ID with SMSMeNow
# Sender ID format: 6 characters (e.g., FLDTRK)
# Wait for approval (usually 24-48 hours)
```

#### Step 3: Test SMS Integration
```bash
# Test SMS sending
curl -X POST https://yourdomain.com/api/notifications/sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+919999999999",
    "message": "Test message",
    "customerName": "Test Customer"
  }'
```

### 3. Interakt.shop WhatsApp Setup

#### Step 1: Create Interakt Account
1. Visit [https://app.interakt.ai](https://app.interakt.ai)
2. Sign up and verify your business
3. Connect your WhatsApp Business Account
4. Get your API key

#### Step 2: Configure Templates
```bash
# Create message templates in Interakt dashboard
# Templates needed:
# - payment_confirmation
# - visit_reminder
# - leave_approval
```

#### Step 3: Test WhatsApp Integration
```bash
# Test WhatsApp message
curl -X POST https://yourdomain.com/api/notifications/whatsapp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+919999999999",
    "message": "Test WhatsApp message",
    "customerName": "Test Customer"
  }'
```

## 🚀 Quick Deployment Script

Create an automated deployment script:

```bash
#!/bin/bash
# Field Tracker App - Quick Deployment Script

echo "🚀 Starting Field Tracker App Deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/field-tracker-app.git
cd field-tracker-app

# Install dependencies
npm install
cd client && npm install && npm run build && cd ..

# Setup environment
cp .env.example .env
echo "⚠️  Please edit .env file with your production credentials"

# Create directories
mkdir -p logs uploads uploads/leave-attachments

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Start application with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Deployment completed!"
echo "📝 Next steps:"
echo "1. Edit .env file with your production credentials"
echo "2. Configure Nginx with your domain"
echo "3. Setup SSL certificate with Let's Encrypt"
echo "4. Test all integrations"
```

## 🔒 Security Checklist

### Before Going Live:
- [ ] Change all default passwords and secrets
- [ ] Use production API keys (not test/sandbox keys)
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Create database backups
- [ ] Test Cashfree payment flows with real transactions
- [ ] Verify SMSMeNow SMS delivery in production
- [ ] Test Interakt.shop WhatsApp delivery
- [ ] Configure Cashfree webhooks for payment notifications
- [ ] Setup firewall rules
- [ ] Enable fail2ban for SSH protection

## 📊 Monitoring & Maintenance

### Health Check Endpoints:
- `GET /api/health` - Overall API health
- `GET /api/attendance/health` - Attendance module health

### PM2 Monitoring:
```bash
pm2 monit                    # Real-time monitoring
pm2 logs field-tracker-api   # View logs
pm2 restart field-tracker-api # Restart app
pm2 reload field-tracker-api  # Zero-downtime restart
```

### Log Monitoring:
```bash
# Application logs
tail -f logs/combined.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## 🔄 Backup Strategy

### Database Backup:
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db field-tracker-prod --out /backups/mongodb_$DATE
tar -czf /backups/mongodb_$DATE.tar.gz /backups/mongodb_$DATE
rm -rf /backups/mongodb_$DATE

# Keep only last 7 days
find /backups -name "mongodb_*.tar.gz" -mtime +7 -delete
```

### File Backup:
```bash
#!/bin/bash
# Backup uploaded files
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/uploads_$DATE.tar.gz uploads/
find /backups -name "uploads_*.tar.gz" -mtime +30 -delete
```

## 🚨 Troubleshooting

### Common Issues:

#### Payment Gateway Issues:
```bash
# Check Cashfree API connectivity
curl -X GET https://api.cashfree.com/pg/orders \
  -H "x-client-id: YOUR_APP_ID" \
  -H "x-client-secret: YOUR_SECRET_KEY" \
  -H "x-api-version: 2023-08-01"
```

#### SMS Delivery Issues:
```bash
# Check SMSMeNow balance and status
curl -X GET "http://sms.smsmenow.in/api/balance" \
  -d "username=YOUR_API_KEY&password=YOUR_PASSWORD"
```

#### WhatsApp Issues:
```bash
# Check Interakt.shop account status
curl -X GET https://api.interakt.ai/v1/public/account/ \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)"
```

### Emergency Contacts:
- **Database issues**: Check MongoDB logs at `/var/log/mongodb/mongod.log`
- **Payment issues**: Cashfree dashboard at [https://merchant.cashfree.com](https://merchant.cashfree.com)
- **SMS issues**: SMSMeNow dashboard at [http://sms.smsmenow.in](http://sms.smsmenow.in)
- **WhatsApp issues**: Interakt.shop dashboard at [https://app.interakt.ai](https://app.interakt.ai)
- **Server issues**: PM2 logs with `pm2 logs` and system monitoring

## 🎉 Production Features Summary

Your Field Tracker App is now production-ready with:
- ✅ **Complete Attendance & Leave Management** - Hierarchical approval workflows
- ✅ **Real-time GPS Tracking** - Live employee location monitoring
- ✅ **Payment Processing** - Secure Cashfree integration
- ✅ **SMS Notifications** - Reliable SMSMeNow service
- ✅ **WhatsApp Notifications** - Professional Interakt.shop integration
- ✅ **Customer Management** - CSV import and visit tracking
- ✅ **Comprehensive Reporting** - Analytics and data export
- ✅ **Mobile-responsive Design** - Optimized for field use
- ✅ **Enterprise Security** - JWT authentication and role-based access
- ✅ **Production Monitoring** - Health checks and logging

**Your Field Tracker App is ready for enterprise deployment!** 🚀
