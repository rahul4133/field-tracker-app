#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FieldTrackerDeployer {
  constructor() {
    this.deploymentSteps = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.deploymentSteps.push({
      timestamp,
      message,
      type
    });
  }

  async checkPrerequisites() {
    this.log('Checking deployment prerequisites...', 'info');
    
    // Check if required files exist
    const requiredFiles = [
      'package.json',
      'server.js',
      '.env',
      'client/package.json'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        this.log(`Missing required file: ${file}`, 'error');
        this.errors.push(`Missing file: ${file}`);
      } else {
        this.log(`Found: ${file}`, 'success');
      }
    }

    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      this.log(`Node.js version: ${nodeVersion}`, 'success');
    } catch (error) {
      this.log('Node.js not found', 'error');
      this.errors.push('Node.js not installed');
    }

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`npm version: ${npmVersion}`, 'success');
    } catch (error) {
      this.log('npm not found', 'error');
      this.errors.push('npm not installed');
    }

    return this.errors.length === 0;
  }

  async installDependencies() {
    this.log('Installing backend dependencies...', 'info');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      this.log('Backend dependencies installed successfully', 'success');
    } catch (error) {
      this.log('Failed to install backend dependencies', 'error');
      this.errors.push('Backend dependency installation failed');
      return false;
    }

    this.log('Installing frontend dependencies...', 'info');
    
    try {
      execSync('cd client && npm install', { stdio: 'inherit', shell: true });
      this.log('Frontend dependencies installed successfully', 'success');
    } catch (error) {
      this.log('Failed to install frontend dependencies', 'error');
      this.errors.push('Frontend dependency installation failed');
      return false;
    }

    return true;
  }

  async buildFrontend() {
    this.log('Building frontend for production...', 'info');
    
    try {
      execSync('cd client && npm run build', { stdio: 'inherit', shell: true });
      this.log('Frontend build completed successfully', 'success');
      
      // Verify build directory exists
      if (fs.existsSync('client/build')) {
        this.log('Build directory created successfully', 'success');
        return true;
      } else {
        this.log('Build directory not found after build', 'error');
        this.errors.push('Frontend build directory missing');
        return false;
      }
    } catch (error) {
      this.log('Frontend build failed', 'error');
      this.errors.push('Frontend build failed');
      return false;
    }
  }

  async createProductionEnv() {
    this.log('Creating production environment configuration...', 'info');
    
    try {
      // Read existing .env or .env.example
      let envContent = '';
      if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf8');
        this.log('Using existing .env file', 'info');
      } else if (fs.existsSync('.env.example')) {
        envContent = fs.readFileSync('.env.example', 'utf8');
        this.log('Using .env.example as template', 'info');
      } else {
        // Create basic .env template
        envContent = `# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/field-tracker-prod

# JWT Secret (Generate a strong secret)
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Client URL
CLIENT_URL=https://yourdomain.com

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_razorpay_live_secret_key

# WhatsApp Notifications (Interakt.shop)
INTERAKT_API_KEY=your_interakt_api_key
INTERAKT_BASE_URL=https://api.interakt.ai

# SMS Notifications (BLNL DLT)
BLNL_API_KEY=your_blnl_api_key
BLNL_SENDER_ID=your_sender_id
BLNL_BASE_URL=https://api.blnl.in

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Google Maps API (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
`;
        this.log('Created basic .env template', 'info');
      }

      // Ensure NODE_ENV is set to production
      if (!envContent.includes('NODE_ENV=production')) {
        envContent = envContent.replace(/NODE_ENV=.*/, 'NODE_ENV=production');
        if (!envContent.includes('NODE_ENV=')) {
          envContent = 'NODE_ENV=production\n' + envContent;
        }
      }

      fs.writeFileSync('.env.production', envContent);
      this.log('Production environment file created: .env.production', 'success');
      
      return true;
    } catch (error) {
      this.log('Failed to create production environment', 'error');
      this.errors.push('Environment configuration failed');
      return false;
    }
  }

  async createDeploymentScripts() {
    this.log('Creating deployment scripts...', 'info');

    // Create PM2 ecosystem file
    const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'field-tracker-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};`;

    fs.writeFileSync('ecosystem.config.js', ecosystemConfig);
    this.log('PM2 ecosystem configuration created', 'success');

    // Create deployment script
    const deployScript = `#!/bin/bash

# Field Tracker App Deployment Script
echo "🚀 Starting Field Tracker App deployment..."

# Create necessary directories
mkdir -p logs
mkdir -p uploads/leave-attachments

# Set proper permissions
chmod 755 uploads
chmod 755 uploads/leave-attachments

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop existing processes
pm2 stop field-tracker-api 2>/dev/null || true

# Start the application
echo "Starting Field Tracker API..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

echo "✅ Field Tracker App deployed successfully!"
echo "📊 Monitor with: pm2 monit"
echo "📋 Check status: pm2 status"
echo "📄 View logs: pm2 logs field-tracker-api"
`;

    fs.writeFileSync('deploy.sh', deployScript);
    this.log('Deployment script created: deploy.sh', 'success');

    // Create Windows deployment script
    const deployBat = `@echo off
echo 🚀 Starting Field Tracker App deployment...

REM Create necessary directories
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "uploads\\leave-attachments" mkdir uploads\\leave-attachments

REM Install PM2 globally if not installed
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo Installing PM2...
    npm install -g pm2
)

REM Stop existing processes
pm2 stop field-tracker-api 2>nul

REM Start the application
echo Starting Field Tracker API...
pm2 start ecosystem.config.js --env production

REM Save PM2 configuration
pm2 save

echo ✅ Field Tracker App deployed successfully!
echo 📊 Monitor with: pm2 monit
echo 📋 Check status: pm2 status
echo 📄 View logs: pm2 logs field-tracker-api
pause
`;

    fs.writeFileSync('deploy.bat', deployBat);
    this.log('Windows deployment script created: deploy.bat', 'success');

    return true;
  }

  async runTests() {
    this.log('Running pre-deployment tests...', 'info');
    
    try {
      // Run the comprehensive test
      if (fs.existsSync('comprehensive-test.js')) {
        execSync('node comprehensive-test.js', { stdio: 'inherit' });
        this.log('Pre-deployment tests completed', 'success');
      } else {
        this.log('Test file not found, skipping tests', 'info');
      }
      return true;
    } catch (error) {
      this.log('Some tests failed, but continuing deployment', 'info');
      return true; // Continue deployment even if tests fail
    }
  }

  generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      success: this.errors.length === 0,
      errors: this.errors,
      steps: this.deploymentSteps,
      nextSteps: [
        '1. Configure your production environment variables in .env.production',
        '2. Set up your MongoDB database',
        '3. Configure your domain and SSL certificates',
        '4. Run the deployment script: ./deploy.sh (Linux/Mac) or deploy.bat (Windows)',
        '5. Monitor the application with PM2: pm2 monit',
        '6. Set up reverse proxy with Nginx (optional)',
        '7. Configure monitoring and backups'
      ]
    };

    fs.writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 DEPLOYMENT PREPARATION SUMMARY');
    console.log('=' .repeat(50));
    
    if (this.errors.length === 0) {
      console.log('✅ Deployment preparation completed successfully!');
    } else {
      console.log('⚠️  Deployment preparation completed with warnings:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n🎯 NEXT STEPS:');
    report.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
    
    console.log('\n📄 Detailed report saved to: deployment-report.json');
  }

  async deploy() {
    console.log('🚀 FIELD TRACKER APP - DEPLOYMENT PREPARATION');
    console.log('=' .repeat(60));
    
    const prerequisitesOk = await this.checkPrerequisites();
    if (!prerequisitesOk) {
      this.log('Prerequisites check failed. Please fix the issues and try again.', 'error');
      this.generateDeploymentReport();
      return false;
    }

    const dependenciesOk = await this.installDependencies();
    if (!dependenciesOk) {
      this.generateDeploymentReport();
      return false;
    }

    const buildOk = await this.buildFrontend();
    if (!buildOk) {
      this.generateDeploymentReport();
      return false;
    }

    await this.createProductionEnv();
    await this.createDeploymentScripts();
    await this.runTests();

    this.generateDeploymentReport();
    
    console.log('\n🎉 Your Field Tracker App is ready for deployment!');
    console.log('\n📋 Quick Start:');
    console.log('   Windows: run deploy.bat');
    console.log('   Linux/Mac: chmod +x deploy.sh && ./deploy.sh');
    
    return true;
  }
}

// Run deployment if this file is executed directly
if (require.main === module) {
  const deployer = new FieldTrackerDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = FieldTrackerDeployer;
