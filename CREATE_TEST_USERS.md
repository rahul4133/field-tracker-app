# Field Tracker App - Login Credentials

## Default Test Users

Since your app uses **production authentication** (no demo mode), you need to create user accounts first.

## How to Create Login Credentials

### Option 1: Register via API (Recommended)

**Create Admin User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@fieldtracker.com",
    "password": "admin123",
    "role": "admin",
    "phone": "+919999999999",
    "employeeId": "EMP001",
    "department": "Management"
  }'
```

**Create Manager User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager User",
    "email": "manager@fieldtracker.com",
    "password": "manager123",
    "role": "manager",
    "phone": "+919999999998",
    "employeeId": "EMP002",
    "department": "Operations"
  }'
```

**Create Employee User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Field Employee",
    "email": "employee@fieldtracker.com",
    "password": "employee123",
    "role": "employee",
    "phone": "+919999999997",
    "employeeId": "EMP003",
    "department": "Field Operations"
  }'
```

### Option 2: Register via Frontend

1. Visit: `http://localhost:5000`
2. Click "Register" or "Sign Up"
3. Fill in the registration form
4. Use these details for testing

## Test Login Credentials (After Registration)

| Role | Email | Password | Employee ID |
|------|-------|----------|-------------|
| **Admin** | admin@fieldtracker.com | admin123 | EMP001 |
| **Manager** | manager@fieldtracker.com | manager123 | EMP002 |
| **Employee** | employee@fieldtracker.com | employee123 | EMP003 |

## User Roles & Permissions

### **Admin**
- Full system access
- User management
- All reports and analytics
- System configuration

### **Manager**
- Team management
- Approve/reject leave requests
- View team reports
- Customer management

### **Employee**
- Clock in/out attendance
- Submit leave requests
- View own data
- Customer visits

## Quick Setup Script

```bash
#!/bin/bash
# Create test users for Field Tracker App

echo "Creating test users..."

# Start server first
echo "Make sure server is running: node server.js"

# Create Admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@fieldtracker.com","password":"admin123","role":"admin","phone":"+919999999999","employeeId":"EMP001","department":"Management"}'

sleep 1

# Create Manager  
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Manager User","email":"manager@fieldtracker.com","password":"manager123","role":"manager","phone":"+919999999998","employeeId":"EMP002","department":"Operations"}'

sleep 1

# Create Employee
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Field Employee","email":"employee@fieldtracker.com","password":"employee123","role":"employee","phone":"+919999999997","employeeId":"EMP003","department":"Field Operations"}'

echo "Test users created successfully!"
echo "You can now login with the credentials above."
```

## Login Process

1. **Start your server**: `node server.js`
2. **Visit**: `http://localhost:5000`
3. **Login with any of the test credentials above**
4. **Explore the app features based on your role**

## Security Notes

- These are **test credentials** for development only
- Change passwords in production
- Use strong passwords for real deployments
- Enable 2FA for production admin accounts
