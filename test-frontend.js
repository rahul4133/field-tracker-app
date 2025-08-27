const puppeteer = require('puppeteer');
const fs = require('fs');

// Frontend test configuration
const FRONTEND_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'test@fieldtracker.com',
  password: 'test123456'
};

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, error = null) {
  testResults.tests.push({
    name: testName,
    passed,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${error?.message || error}`);
  }
}

async function testFrontendComponents() {
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless testing
      defaultViewport: { width: 1280, height: 720 }
    });
    page = await browser.newPage();
    
    // Test 1: Load login page
    try {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      const title = await page.title();
      logTest('Login Page Load', title.includes('Field Tracker') || title.includes('React'));
    } catch (error) {
      logTest('Login Page Load', false, error);
    }
    
    // Test 2: Login functionality
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', TEST_CREDENTIALS.email);
      await page.type('input[type="password"]', TEST_CREDENTIALS.password);
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      
      const currentUrl = page.url();
      logTest('Login Functionality', currentUrl.includes('/dashboard'));
    } catch (error) {
      logTest('Login Functionality', false, error);
    }
    
    // Test 3: Dashboard load
    try {
      await page.waitForSelector('h1', { timeout: 5000 });
      const dashboardHeading = await page.$eval('h1', el => el.textContent);
      logTest('Dashboard Load', dashboardHeading.includes('Dashboard') || dashboardHeading.includes('Welcome'));
    } catch (error) {
      logTest('Dashboard Load', false, error);
    }
    
    // Test 4: Navigation menu
    try {
      const navItems = await page.$$eval('nav a', links => links.map(link => link.textContent));
      const expectedNavItems = ['Dashboard', 'Customers', 'Visits', 'Payments', 'Attendance', 'Leave'];
      const hasRequiredNavItems = expectedNavItems.every(item => 
        navItems.some(navItem => navItem.includes(item))
      );
      logTest('Navigation Menu', hasRequiredNavItems);
    } catch (error) {
      logTest('Navigation Menu', false, error);
    }
    
    // Test 5: Customers page
    try {
      await page.click('a[href="/customers"]');
      await page.waitForSelector('h1', { timeout: 5000 });
      const pageHeading = await page.$eval('h1', el => el.textContent);
      logTest('Customers Page Navigation', pageHeading.includes('Customer'));
    } catch (error) {
      logTest('Customers Page Navigation', false, error);
    }
    
    // Test 6: Visits page
    try {
      await page.click('a[href="/visits"]');
      await page.waitForSelector('h1', { timeout: 5000 });
      const pageHeading = await page.$eval('h1', el => el.textContent);
      logTest('Visits Page Navigation', pageHeading.includes('Visit'));
    } catch (error) {
      logTest('Visits Page Navigation', false, error);
    }
    
    // Test 7: Payments page
    try {
      await page.click('a[href="/payments"]');
      await page.waitForSelector('h1', { timeout: 5000 });
      const pageHeading = await page.$eval('h1', el => el.textContent);
      logTest('Payments Page Navigation', pageHeading.includes('Payment'));
    } catch (error) {
      logTest('Payments Page Navigation', false, error);
    }
    
    // Test 8: Attendance page
    try {
      await page.click('a[href="/attendance"]');
      await page.waitForSelector('h1', { timeout: 5000 });
      const pageHeading = await page.$eval('h1', el => el.textContent);
      logTest('Attendance Page Navigation', pageHeading.includes('Attendance'));
    } catch (error) {
      logTest('Attendance Page Navigation', false, error);
    }
    
    // Test 9: Leave page
    try {
      await page.click('a[href="/leave"]');
      await page.waitForSelector('h1', { timeout: 5000 });
      const pageHeading = await page.$eval('h1', el => el.textContent);
      logTest('Leave Page Navigation', pageHeading.includes('Leave'));
    } catch (error) {
      logTest('Leave Page Navigation', false, error);
    }
    
    // Test 10: Profile page
    try {
      await page.click('a[href="/profile"]');
      await page.waitForSelector('h1', { timeout: 5000 });
      const pageHeading = await page.$eval('h1', el => el.textContent);
      logTest('Profile Page Navigation', pageHeading.includes('Profile'));
    } catch (error) {
      logTest('Profile Page Navigation', false, error);
    }
    
    // Test 11: Responsive design
    try {
      await page.setViewport({ width: 375, height: 667 }); // Mobile viewport
      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
      
      // Check if mobile menu button exists
      const mobileMenuButton = await page.$('button[aria-label="Menu"], button svg');
      logTest('Mobile Responsive Design', !!mobileMenuButton);
    } catch (error) {
      logTest('Mobile Responsive Design', false, error);
    }
    
    // Test 12: Form validation
    try {
      await page.setViewport({ width: 1280, height: 720 }); // Reset viewport
      await page.goto(`${FRONTEND_URL}/customers`, { waitUntil: 'networkidle2' });
      
      // Try to find and test a form
      const addButton = await page.$('button:contains("Add"), button:contains("Create"), button:contains("+")');
      if (addButton) {
        await addButton.click();
        await page.waitForSelector('form', { timeout: 3000 });
        
        // Try to submit empty form
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          // Check for validation messages
          const validationMessage = await page.$('.error, .invalid, [role="alert"]');
          logTest('Form Validation', !!validationMessage);
        } else {
          logTest('Form Validation', false, 'No submit button found');
        }
      } else {
        logTest('Form Validation', false, 'No add button found');
      }
    } catch (error) {
      logTest('Form Validation', false, error);
    }
    
  } catch (error) {
    console.error('Frontend testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function runFrontendTests() {
  console.log('🎨 Starting Frontend Component Testing...\n');
  
  await testFrontendComponents();
  
  // Generate test report
  console.log('\n📊 Frontend Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  // Save detailed test report
  const report = {
    summary: {
      totalTests: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) + '%',
      timestamp: new Date().toISOString()
    },
    tests: testResults.tests
  };
  
  fs.writeFileSync('frontend-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Frontend test report saved to frontend-test-report.json');
}

if (require.main === module) {
  runFrontendTests().catch(console.error);
}

module.exports = { runFrontendTests };
