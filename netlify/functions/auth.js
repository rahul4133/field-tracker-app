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

  const path = event.path;
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
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (users.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const user = users[0];

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

    // Health check endpoint
    if (event.httpMethod === 'GET' && path.includes('/health')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() })
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
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};
