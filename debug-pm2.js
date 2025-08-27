#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PM2Debugger {
  constructor() {
    this.errors = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'fix' ? '🔧' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async checkEnvironment() {
    this.log('Checking environment setup...', 'info');

    // Check if .env exists
    if (!fs.existsSync('.env')) {
      this.log('Missing .env file', 'error');
      this.errors.push('No .env file found');
      
      if (fs.existsSync('.env.example')) {
        this.log('Creating .env from .env.example', 'fix');
        fs.copyFileSync('.env.example', '.env');
        this.fixes.push('Created .env file from template');
      }
    } else {
      this.log('Found .env file', 'success');
    }

    // Check logs directory
    if (!fs.existsSync('logs')) {
      this.log('Creating logs directory', 'fix');
      fs.mkdirSync('logs', { recursive: true });
      this.fixes.push('Created logs directory');
    }

    // Check uploads directory
    if (!fs.existsSync('uploads')) {
      this.log('Creating uploads directory', 'fix');
      fs.mkdirSync('uploads', { recursive: true });
      fs.mkdirSync('uploads/leave-attachments', { recursive: true });
      this.fixes.push('Created uploads directory');
    }
  }

  async checkDependencies() {
    this.log('Checking dependencies...', 'info');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check if node_modules exists
      if (!fs.existsSync('node_modules')) {
        this.log('Missing node_modules, installing dependencies', 'fix');
        execSync('npm install', { stdio: 'inherit' });
        this.fixes.push('Installed backend dependencies');
      }

      // Check client dependencies
      if (fs.existsSync('client') && !fs.existsSync('client/node_modules')) {
        this.log('Missing client node_modules, installing', 'fix');
        execSync('cd client && npm install', { stdio: 'inherit', shell: true });
        this.fixes.push('Installed frontend dependencies');
      }

      this.log('Dependencies check complete', 'success');
    } catch (error) {
      this.log(`Dependency check failed: ${error.message}`, 'error');
      this.errors.push(`Dependency error: ${error.message}`);
    }
  }

  async testServerStart() {
    this.log('Testing server startup...', 'info');

    try {
      // Try to start server directly
      const { spawn } = require('child_process');
      
      const serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Wait for 5 seconds to see if server starts
      await new Promise((resolve) => setTimeout(resolve, 5000));

      if (serverProcess.pid && !serverProcess.killed) {
        this.log('Server started successfully', 'success');
        serverProcess.kill();
      } else {
        this.log('Server failed to start', 'error');
        this.log(`STDOUT: ${output}`, 'error');
        this.log(`STDERR: ${errorOutput}`, 'error');
        this.errors.push('Server startup failed');
      }

    } catch (error) {
      this.log(`Server test failed: ${error.message}`, 'error');
      this.errors.push(`Server test error: ${error.message}`);
    }
  }

  async cleanupPM2() {
    this.log('Cleaning up PM2 processes...', 'info');

    try {
      // Stop all processes
      execSync('pm2 stop all', { stdio: 'pipe' });
      this.log('Stopped all PM2 processes', 'success');

      // Delete all processes
      execSync('pm2 delete all', { stdio: 'pipe' });
      this.log('Deleted all PM2 processes', 'success');

      // Clear PM2 logs
      execSync('pm2 flush', { stdio: 'pipe' });
      this.log('Cleared PM2 logs', 'success');

      this.fixes.push('Cleaned up PM2 processes');
    } catch (error) {
      this.log(`PM2 cleanup warning: ${error.message}`, 'info');
    }
  }

  async fixCommonIssues() {
    this.log('Applying common fixes...', 'info');

    // Fix 1: Ensure proper file permissions
    try {
      if (process.platform !== 'win32') {
        execSync('chmod +x server.js', { stdio: 'pipe' });
        this.fixes.push('Fixed server.js permissions');
      }
    } catch (error) {
      // Ignore permission errors on Windows
    }

    // Fix 2: Create missing directories
    const requiredDirs = ['logs', 'uploads', 'uploads/leave-attachments'];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.fixes.push(`Created directory: ${dir}`);
      }
    }

    // Fix 3: Check server.js exists
    if (!fs.existsSync('server.js')) {
      this.log('server.js not found!', 'error');
      this.errors.push('Missing server.js file');
    }
  }

  generateDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      errors: this.errors,
      fixes: this.fixes,
      recommendations: []
    };

    if (this.errors.length === 0) {
      report.recommendations.push('All checks passed. Try starting PM2 again.');
      report.recommendations.push('Use: pm2 start ecosystem.config.js --env production');
    } else {
      report.recommendations.push('Fix the errors listed above before starting PM2');
      
      if (this.errors.some(e => e.includes('env'))) {
        report.recommendations.push('Configure your .env file with proper values');
      }
      
      if (this.errors.some(e => e.includes('dependencies'))) {
        report.recommendations.push('Run npm install to fix dependency issues');
      }
      
      if (this.errors.some(e => e.includes('server'))) {
        report.recommendations.push('Check server.js for syntax errors');
        report.recommendations.push('Test with: node server.js');
      }
    }

    fs.writeFileSync('pm2-debug-report.json', JSON.stringify(report, null, 2));

    console.log('\n📊 PM2 DEBUG REPORT');
    console.log('=' .repeat(40));
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (this.fixes.length > 0) {
      console.log('\n🔧 FIXES APPLIED:');
      this.fixes.forEach(fix => console.log(`   - ${fix}`));
    }

    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   - ${rec}`));

    console.log('\n📄 Detailed report saved to: pm2-debug-report.json');
  }

  async debug() {
    console.log('🔍 PM2 DEBUGGING TOOL');
    console.log('=' .repeat(30));

    await this.cleanupPM2();
    await this.checkEnvironment();
    await this.checkDependencies();
    await this.fixCommonIssues();
    await this.testServerStart();

    this.generateDebugReport();

    if (this.errors.length === 0) {
      console.log('\n🎉 All issues resolved! Try starting PM2 now:');
      console.log('   pm2 start ecosystem.config.js --env production');
    } else {
      console.log('\n⚠️  Please fix the errors above and run this script again.');
    }
  }
}

// Run debugger if this file is executed directly
if (require.main === module) {
  const debugger = new PM2Debugger();
  debugger.debug().catch(console.error);
}

module.exports = PM2Debugger;
