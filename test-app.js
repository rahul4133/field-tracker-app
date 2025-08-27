const axios = require('axios');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'Test Employee',
  email: 'test@fieldtracker.com',
  password: 'test123456',
  phone: '+1234567890',
  role: 'employee'
};

const TEST_MANAGER = {
  name: 'Test Manager',
  email: 'manager@fieldtracker.com',
  password: 'manager123456',
  phone: '+1234567891',
  role: 'manager'
};

let authToken = '';
let managerToken = '';
let testUserId = '';
let testCustomerId = '';
let testVisitId = '';
let testAttendanceId = '';
let testLeaveId = '';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
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

// Test API Health
async function testAPIHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logTest('API Health Check', response.data.success === true);
    return response.data.success;
  } catch (error) {
    logTest('API Health Check', false, error);
    return false;
  }
}

// Test Authentication
async function testAuthentication() {
  try {
    // Test user registration
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
    logTest('User Registration', registerResponse.data.success === true);
    
    // Test manager registration
    const managerRegResponse = await axios.post(`${BASE_URL}/auth/register`, TEST_MANAGER);
    logTest('Manager Registration', managerRegResponse.data.success === true);
    
    // Test user login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      testUserId = loginResponse.data.user.id;
      logTest('User Login', true);
    } else {
      logTest('User Login', false, 'No token received');
    }
    
    // Test manager login
    const managerLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_MANAGER.email,
      password: TEST_MANAGER.password
    });
    
    if (managerLoginResponse.data.success && managerLoginResponse.data.token) {
      managerToken = managerLoginResponse.data.token;
      logTest('Manager Login', true);
    } else {
      logTest('Manager Login', false, 'No token received');
    }
    
    // Test profile fetch
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Profile Fetch', profileResponse.data.success === true);
    
  } catch (error) {
    logTest('Authentication Tests', false, error);
  }
}

// Test Customer Management
async function testCustomerManagement() {
  try {
    const testCustomer = {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+1234567892',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    };
    
    // Create customer
    const createResponse = await axios.post(`${BASE_URL}/customers`, testCustomer, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (createResponse.data.success) {
      testCustomerId = createResponse.data.customer._id;
      logTest('Customer Creation', true);
    } else {
      logTest('Customer Creation', false, 'Failed to create customer');
    }
    
    // Get customers
    const getResponse = await axios.get(`${BASE_URL}/customers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Customer Fetch', getResponse.data.success === true);
    
    // Update customer
    const updateResponse = await axios.put(`${BASE_URL}/customers/${testCustomerId}`, {
      ...testCustomer,
      name: 'Updated Test Customer'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Customer Update', updateResponse.data.success === true);
    
  } catch (error) {
    logTest('Customer Management Tests', false, error);
  }
}

// Test Visit Management
async function testVisitManagement() {
  try {
    const testVisit = {
      customer: testCustomerId,
      purpose: 'Test Visit',
      scheduledDate: new Date().toISOString(),
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Test Location'
      }
    };
    
    // Create visit
    const createResponse = await axios.post(`${BASE_URL}/visits`, testVisit, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (createResponse.data.success) {
      testVisitId = createResponse.data.visit._id;
      logTest('Visit Creation', true);
    } else {
      logTest('Visit Creation', false, 'Failed to create visit');
    }
    
    // Get visits
    const getResponse = await axios.get(`${BASE_URL}/visits`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Visit Fetch', getResponse.data.success === true);
    
    // Check-in to visit
    const checkinResponse = await axios.post(`${BASE_URL}/visits/${testVisitId}/checkin`, {
      location: testVisit.location,
      notes: 'Test check-in'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Visit Check-in', checkinResponse.data.success === true);
    
  } catch (error) {
    logTest('Visit Management Tests', false, error);
  }
}

// Test Payment Processing
async function testPaymentProcessing() {
  try {
    // Create payment order
    const orderResponse = await axios.post(`${BASE_URL}/payments/create-order`, {
      customerId: testCustomerId,
      visitId: testVisitId,
      amount: 1000,
      description: 'Test payment'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Payment Order Creation', orderResponse.data.success === true);
    
    // Get payment history
    const historyResponse = await axios.get(`${BASE_URL}/payments/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Payment History Fetch', historyResponse.data.success === true);
    
  } catch (error) {
    logTest('Payment Processing Tests', false, error);
  }
}

// Test Attendance Management
async function testAttendanceManagement() {
  try {
    const testLocation = {
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Test Office Location'
    };
    
    // Check-in
    const checkinResponse = await axios.post(`${BASE_URL}/attendance/checkin`, {
      location: testLocation,
      notes: 'Test check-in'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Attendance Check-in', checkinResponse.data.success === true);
    
    // Get today's attendance
    const todayResponse = await axios.get(`${BASE_URL}/attendance/today`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Today Attendance Fetch', todayResponse.data.success === true);
    
    // Start break
    const breakStartResponse = await axios.post(`${BASE_URL}/attendance/break/start`, {
      location: testLocation,
      reason: 'Lunch break'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Break Start', breakStartResponse.data.success === true);
    
    // End break
    const breakEndResponse = await axios.post(`${BASE_URL}/attendance/break/end`, {
      location: testLocation
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Break End', breakEndResponse.data.success === true);
    
    // Check-out
    const checkoutResponse = await axios.post(`${BASE_URL}/attendance/checkout`, {
      location: testLocation,
      notes: 'Test check-out'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Attendance Check-out', checkoutResponse.data.success === true);
    
    // Get attendance history
    const historyResponse = await axios.get(`${BASE_URL}/attendance/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Attendance History Fetch', historyResponse.data.success === true);
    
  } catch (error) {
    logTest('Attendance Management Tests', false, error);
  }
}

// Test Leave Management
async function testLeaveManagement() {
  try {
    const testLeave = {
      leaveType: 'casual',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      reason: 'Test leave application',
      isHalfDay: false,
      isUrgent: false
    };
    
    // Apply for leave
    const applyResponse = await axios.post(`${BASE_URL}/leave/apply`, testLeave, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (applyResponse.data.success) {
      testLeaveId = applyResponse.data.leave._id;
      logTest('Leave Application', true);
    } else {
      logTest('Leave Application', false, 'Failed to apply for leave');
    }
    
    // Get my leaves
    const myLeavesResponse = await axios.get(`${BASE_URL}/leave/my-leaves`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('My Leaves Fetch', myLeavesResponse.data.success === true);
    
    // Get leave balance
    const balanceResponse = await axios.get(`${BASE_URL}/leave/balance`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Leave Balance Fetch', balanceResponse.data.success === true);
    
    // Test manager approval (if leave exists)
    if (testLeaveId) {
      try {
        const approvalResponse = await axios.put(`${BASE_URL}/leave/${testLeaveId}/action`, {
          action: 'approve',
          comments: 'Test approval'
        }, {
          headers: { Authorization: `Bearer ${managerToken}` }
        });
        logTest('Leave Approval', approvalResponse.data.success === true);
      } catch (approvalError) {
        logTest('Leave Approval', false, 'Manager may not be in approval hierarchy');
      }
    }
    
  } catch (error) {
    logTest('Leave Management Tests', false, error);
  }
}

// Test Notifications
async function testNotifications() {
  try {
    // Test SMS notification
    const smsResponse = await axios.post(`${BASE_URL}/notifications/sms`, {
      phone: TEST_USER.phone,
      message: 'Test SMS notification'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('SMS Notification', smsResponse.data.success === true);
    
    // Test WhatsApp notification
    const whatsappResponse = await axios.post(`${BASE_URL}/notifications/whatsapp`, {
      phone: TEST_USER.phone,
      message: 'Test WhatsApp notification'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('WhatsApp Notification', whatsappResponse.data.success === true);
    
  } catch (error) {
    logTest('Notification Tests', false, error);
  }
}

// Test Reports
async function testReports() {
  try {
    // Test attendance report
    const attendanceReportResponse = await axios.get(`${BASE_URL}/reports/attendance`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    logTest('Attendance Report', attendanceReportResponse.data.success === true);
    
    // Test visit report
    const visitReportResponse = await axios.get(`${BASE_URL}/reports/visits`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    logTest('Visit Report', visitReportResponse.data.success === true);
    
    // Test payment report
    const paymentReportResponse = await axios.get(`${BASE_URL}/reports/payments`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    logTest('Payment Report', paymentReportResponse.data.success === true);
    
  } catch (error) {
    logTest('Reports Tests', false, error);
  }
}

// Test Employee Management
async function testEmployeeManagement() {
  try {
    // Get employees list
    const employeesResponse = await axios.get(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    logTest('Employees List Fetch', employeesResponse.data.success === true);
    
    // Update employee status
    if (testUserId) {
      const updateResponse = await axios.put(`${BASE_URL}/employees/${testUserId}`, {
        isActive: true,
        department: 'Test Department'
      }, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      logTest('Employee Update', updateResponse.data.success === true);
    }
    
  } catch (error) {
    logTest('Employee Management Tests', false, error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Field Tracker App Comprehensive Testing...\n');
  
  // Test each module
  await testAPIHealth();
  await testAuthentication();
  await testCustomerManagement();
  await testVisitManagement();
  await testPaymentProcessing();
  await testAttendanceManagement();
  await testLeaveManagement();
  await testNotifications();
  await testReports();
  await testEmployeeManagement();
  
  // Generate test report
  console.log('\n📊 Test Results Summary:');
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
  
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed test report saved to test-report.json');
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Your Field Tracker App is ready for production deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues before deployment.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
