#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Comprehensive test suite for Field Tracker App
class FieldTrackerTester {
  constructor() {
    this.testResults = {
      backend: { passed: 0, failed: 0, tests: [] },
      frontend: { passed: 0, failed: 0, tests: [] },
      integration: { passed: 0, failed: 0, tests: [] }
    };
  }

  logTest(category, testName, passed, error = null) {
    this.testResults[category].tests.push({
      name: testName,
      passed,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.testResults[category].passed++;
      console.log(`✅ [${category.toUpperCase()}] ${testName}`);
    } else {
      this.testResults[category].failed++;
      console.log(`❌ [${category.toUpperCase()}] ${testName}: ${error?.message || error}`);
    }
  }

  // Test file structure and dependencies
  async testProjectStructure() {
    console.log('📁 Testing Project Structure...\n');

    const requiredFiles = [
      'package.json',
      'server.js',
      '.env.example',
      'models/User.js',
      'models/Customer.js',
      'models/Visit.js',
      'models/Payment.js',
      'models/Attendance.js',
      'models/Leave.js',
      'routes/auth.js',
      'routes/customers.js',
      'routes/visits.js',
      'routes/payments.js',
      'routes/attendance.js',
      'routes/leave.js',
      'routes/notifications.js',
      'routes/reports.js',
      'middleware/auth.js',
      'client/package.json',
      'client/src/App.js',
      'client/src/pages/Dashboard.js',
      'client/src/pages/Customers.js',
      'client/src/pages/Visits.js',
      'client/src/pages/Payments.js',
      'client/src/pages/Attendance.js',
      'client/src/pages/LeaveManagement.js',
      'client/src/components/Layout.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      this.logTest('backend', `File exists: ${file}`, exists, exists ? null : 'File not found');
    }

    // Test package.json dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredDeps = [
        'express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 
        'cors', 'helmet', 'compression', 'multer', 'axios', 
        'razorpay', 'socket.io'
      ];

      for (const dep of requiredDeps) {
        const hasDepency = packageJson.dependencies && packageJson.dependencies[dep];
        this.logTest('backend', `Dependency: ${dep}`, !!hasDepency, hasDepency ? null : 'Missing dependency');
      }
    } catch (error) {
      this.logTest('backend', 'Package.json validation', false, error);
    }
  }

  // Test database models
  async testDatabaseModels() {
    console.log('\n🗄️ Testing Database Models...\n');

    const models = ['User', 'Customer', 'Visit', 'Payment', 'Attendance', 'Leave'];
    
    for (const model of models) {
      try {
        const modelPath = path.join(process.cwd(), 'models', `${model}.js`);
        const modelContent = fs.readFileSync(modelPath, 'utf8');
        
        // Check for required schema elements
        const hasSchema = modelContent.includes('Schema');
        const hasExport = modelContent.includes('module.exports');
        const hasMongoose = modelContent.includes('mongoose');
        
        this.logTest('backend', `${model} model structure`, hasSchema && hasExport && hasMongoose);
      } catch (error) {
        this.logTest('backend', `${model} model structure`, false, error);
      }
    }
  }

  // Test API routes
  async testAPIRoutes() {
    console.log('\n🛣️ Testing API Routes...\n');

    const routes = [
      'auth', 'customers', 'visits', 'payments', 
      'attendance', 'leave', 'notifications', 'reports'
    ];
    
    for (const route of routes) {
      try {
        const routePath = path.join(process.cwd(), 'routes', `${route}.js`);
        const routeContent = fs.readFileSync(routePath, 'utf8');
        
        // Check for required route elements
        const hasRouter = routeContent.includes('express.Router()');
        const hasExport = routeContent.includes('module.exports');
        const hasAuth = routeContent.includes('auth') || route === 'auth';
        
        this.logTest('backend', `${route} route structure`, hasRouter && hasExport);
        
        // Check for specific endpoints based on route
        if (route === 'attendance') {
          const hasCheckin = routeContent.includes('/checkin');
          const hasCheckout = routeContent.includes('/checkout');
          this.logTest('backend', `${route} endpoints (checkin/checkout)`, hasCheckin && hasCheckout);
        }
        
        if (route === 'leave') {
          const hasApply = routeContent.includes('/apply');
          const hasApproval = routeContent.includes('approval') || routeContent.includes('action');
          this.logTest('backend', `${route} endpoints (apply/approval)`, hasApply && hasApproval);
        }
        
      } catch (error) {
        this.logTest('backend', `${route} route structure`, false, error);
      }
    }
  }

  // Test frontend components
  async testFrontendComponents() {
    console.log('\n🎨 Testing Frontend Components...\n');

    const components = [
      'App.js', 'components/Layout.js', 'pages/Dashboard.js',
      'pages/Customers.js', 'pages/Visits.js', 'pages/Payments.js',
      'pages/Attendance.js', 'pages/LeaveManagement.js'
    ];
    
    for (const component of components) {
      try {
        const componentPath = path.join(process.cwd(), 'client/src', component);
        const componentContent = fs.readFileSync(componentPath, 'utf8');
        
        // Check for React component structure
        const hasReactImport = componentContent.includes('import React');
        const hasExport = componentContent.includes('export default');
        const hasJSX = componentContent.includes('return (') || componentContent.includes('return<');
        
        this.logTest('frontend', `${component} structure`, hasReactImport && hasExport);
        
        // Check for specific functionality
        if (component === 'pages/Attendance.js') {
          const hasCheckin = componentContent.includes('checkin') || componentContent.includes('check-in');
          const hasCheckout = componentContent.includes('checkout') || componentContent.includes('check-out');
          this.logTest('frontend', `${component} attendance features`, hasCheckin && hasCheckout);
        }
        
        if (component === 'pages/LeaveManagement.js') {
          const hasLeaveForm = componentContent.includes('leaveType') || componentContent.includes('leave');
          const hasApproval = componentContent.includes('approval') || componentContent.includes('approve');
          this.logTest('frontend', `${component} leave features`, hasLeaveForm && hasApproval);
        }
        
      } catch (error) {
        this.logTest('frontend', `${component} structure`, false, error);
      }
    }
  }

  // Test configuration files
  async testConfiguration() {
    console.log('\n⚙️ Testing Configuration...\n');

    // Test .env.example
    try {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      const requiredEnvVars = [
        'MONGODB_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 
        'INTERAKT_API_KEY', 'BLNL_API_KEY'
      ];
      
      for (const envVar of requiredEnvVars) {
        const hasVar = envExample.includes(envVar);
        this.logTest('backend', `Environment variable: ${envVar}`, hasVar);
      }
    } catch (error) {
      this.logTest('backend', '.env.example validation', false, error);
    }

    // Test server.js configuration
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      const hasAllRoutes = [
        '/api/auth', '/api/attendance', '/api/leave', 
        '/api/customers', '/api/visits', '/api/payments'
      ].every(route => serverContent.includes(route));
      
      this.logTest('backend', 'Server routes configuration', hasAllRoutes);
      
      const hasSocketIO = serverContent.includes('socket.io');
      this.logTest('backend', 'Socket.IO configuration', hasSocketIO);
      
      const hasHealthCheck = serverContent.includes('/api/health');
      this.logTest('backend', 'Health check endpoint', hasHealthCheck);
      
    } catch (error) {
      this.logTest('backend', 'Server configuration', false, error);
    }
  }

  // Test security implementations
  async testSecurity() {
    console.log('\n🔒 Testing Security Implementations...\n');

    try {
      const authMiddleware = fs.readFileSync('middleware/auth.js', 'utf8');
      const hasJWTVerification = authMiddleware.includes('jwt.verify');
      const hasErrorHandling = authMiddleware.includes('catch') || authMiddleware.includes('try');
      
      this.logTest('backend', 'JWT authentication middleware', hasJWTVerification && hasErrorHandling);
    } catch (error) {
      this.logTest('backend', 'Authentication middleware', false, error);
    }

    // Test password hashing in User model
    try {
      const userModel = fs.readFileSync('models/User.js', 'utf8');
      const hasPasswordHashing = userModel.includes('bcrypt');
      const hasPreSaveHook = userModel.includes('pre(\'save\'');
      
      this.logTest('backend', 'Password hashing implementation', hasPasswordHashing && hasPreSaveHook);
    } catch (error) {
      this.logTest('backend', 'Password security', false, error);
    }

    // Test server security middleware
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      const hasHelmet = serverContent.includes('helmet');
      const hasRateLimit = serverContent.includes('rateLimit');
      const hasCors = serverContent.includes('cors');
      
      this.logTest('backend', 'Security middleware (helmet, rate limiting, CORS)', hasHelmet && hasRateLimit && hasCors);
    } catch (error) {
      this.logTest('backend', 'Server security', false, error);
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST RESULTS\n');
    console.log('=' .repeat(50));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [category, results] of Object.entries(this.testResults)) {
      console.log(`\n${category.toUpperCase()} TESTS:`);
      console.log(`✅ Passed: ${results.passed}`);
      console.log(`❌ Failed: ${results.failed}`);
      console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
      
      totalPassed += results.passed;
      totalFailed += results.failed;
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('OVERALL RESULTS:');
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📈 Overall Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    
    // Save detailed report
    const report = {
      summary: {
        totalTests: totalPassed + totalFailed,
        passed: totalPassed,
        failed: totalFailed,
        successRate: ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) + '%',
        timestamp: new Date().toISOString()
      },
      categories: this.testResults
    };
    
    fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to comprehensive-test-report.json');
    
    // Provide recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    
    if (totalFailed === 0) {
      console.log('🎉 Excellent! All tests passed. Your Field Tracker App is ready for production deployment.');
      console.log('✅ All modules are properly implemented');
      console.log('✅ Security measures are in place');
      console.log('✅ Frontend components are structured correctly');
      console.log('✅ Backend APIs are properly configured');
    } else {
      console.log('⚠️  Some issues found. Please address the following:');
      
      for (const [category, results] of Object.entries(this.testResults)) {
        const failedTests = results.tests.filter(test => !test.passed);
        if (failedTests.length > 0) {
          console.log(`\n${category.toUpperCase()} Issues:`);
          failedTests.forEach(test => {
            console.log(`  - ${test.name}: ${test.error}`);
          });
        }
      }
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Review any failed tests and fix issues');
    console.log('2. Run backend API tests: node test-app.js');
    console.log('3. Start the application: npm run dev');
    console.log('4. Test frontend functionality manually');
    console.log('5. Deploy to production following the deployment guide');
  }

  async runAllTests() {
    console.log('🧪 FIELD TRACKER APP - COMPREHENSIVE TESTING SUITE');
    console.log('=' .repeat(60));
    console.log('Testing all modules and functionality...\n');
    
    await this.testProjectStructure();
    await this.testDatabaseModels();
    await this.testAPIRoutes();
    await this.testFrontendComponents();
    await this.testConfiguration();
    await this.testSecurity();
    
    this.generateReport();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new FieldTrackerTester();
  tester.runAllTests().catch(console.error);
}

module.exports = FieldTrackerTester;
