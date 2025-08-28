# Using Neon Database with Netlify Functions

Since you have Neon integrated with Netlify, you can use Netlify Functions (serverless) with Neon PostgreSQL database.

## Setup Options

### Option 1: Netlify Functions + Neon (Recommended)

#### Step 1: Create Netlify Functions Directory
```bash
mkdir netlify/functions
```

#### Step 2: Install Dependencies
```bash
cd netlify/functions
npm init -y
npm install @neondatabase/serverless bcryptjs jsonwebtoken cors
```

#### Step 3: Create Auth Function
Create `netlify/functions/auth.js`:
```javascript
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const { path } = event;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // Register endpoint
    if (event.httpMethod === 'POST' && path.includes('/register')) {
      const { name, email, password, role, phone, employeeId, department } = body;
      
      // Check if user exists
      const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (existingUser.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'User already exists' })
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user
      const [user] = await sql`
        INSERT INTO users (name, email, password, role, phone, employee_id, department, created_at)
        VALUES (${name}, ${email}, ${hashedPassword}, ${role || 'employee'}, ${phone}, ${employeeId}, ${department}, NOW())
        RETURNING id, name, email, role, phone, employee_id, department
      `;

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'User created successfully',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employee_id
          }
        })
      };
    }

    // Login endpoint
    if (event.httpMethod === 'POST' && path.includes('/login')) {
      const { email, password } = body;
      
      // Find user
      const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (!user) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      // Update last login
      await sql`UPDATE users SET last_login = NOW(), is_online = true WHERE id = ${user.id}`;

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            employeeId: user.employee_id,
            isActive: user.is_active
          }
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
```

#### Step 4: Create Database Schema
Create `netlify/functions/setup-db.js`:
```javascript
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        phone VARCHAR(20),
        employee_id VARCHAR(50) UNIQUE,
        department VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        is_online BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create other tables as needed
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Database setup complete' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### Step 5: Update Frontend API Configuration
Update `client/src/config/api.js`:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions'  // Use Netlify Functions
  : 'http://localhost:5000';

export { API_BASE_URL };
```

#### Step 6: Environment Variables in Netlify
Set these in Netlify Dashboard → Environment Variables:
```
DATABASE_URL=your_neon_database_connection_string
JWT_SECRET=your_super_secure_jwt_secret
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret
SMSMENOW_API_KEY=your_sms_api_key
SMSMENOW_PASSWORD=your_sms_password
```

#### Step 7: Update netlify.toml
```toml
[build]
  base = "client"
  command = "CI=false npm run build"
  publish = "build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 2: Keep Existing Backend + Neon

If you prefer to keep your current Node.js backend:

#### Update Backend to Use PostgreSQL
```bash
npm install pg @neondatabase/serverless
npm uninstall mongoose
```

#### Update Database Connection
Replace MongoDB connection in `server.js`:
```javascript
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

// Test connection
sql`SELECT NOW()`.then(() => {
  console.log('Neon PostgreSQL connected successfully');
}).catch(err => {
  console.error('Database connection error:', err);
});
```

## Benefits of Neon + Netlify Functions

- ✅ **Serverless**: No server management
- ✅ **Auto-scaling**: Handles traffic spikes
- ✅ **Cost-effective**: Pay per use
- ✅ **Fast**: Edge deployment
- ✅ **PostgreSQL**: Reliable relational database

## Next Steps

1. **Choose Option 1** (Netlify Functions) for full serverless
2. **Set up database schema** with setup-db function
3. **Configure environment variables**
4. **Test authentication endpoints**
5. **Deploy and verify**

Your Field Tracker app will work seamlessly with Neon + Netlify!
