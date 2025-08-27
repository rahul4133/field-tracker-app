# Field Employee Tracking & Payment Collection App

A comprehensive web application for tracking field employees, managing customer visits, collecting payments, and generating reports with real-time location tracking.

## Features

### 🔐 Authentication & User Management
- Role-based access control (Admin, Manager, Employee)
- JWT-based authentication
- User profile management

### 📍 Live Location Tracking
- Real-time GPS tracking for field employees
- Location history and route mapping
- Geofencing capabilities
- Daily route visualization

### 👥 Customer Management
- Customer database with contact information
- Customer allocation to employees
- CSV import for bulk customer upload
- Customer visit history

### 🗺️ Visit Management
- Check-in/check-out functionality with GPS coordinates
- Visit scheduling and tracking
- Photo capture during visits
- Visit route mapping
- Real-time visit status updates

### 💳 Payment Collection
- Multiple payment methods (Cash, Card, UPI, Bank Transfer)
- Cashfree integration for secure online payments
- Payment receipt generation
- Outstanding amount tracking
- Payment history and analytics

### 📱 Notifications
- WhatsApp notifications via Interakt.shop
- SMS notifications via SMSMeNow
- Payment confirmation messages
- Visit reminders
- Bulk notification system

### 📊 Reporting & Analytics
- Employee performance reports
- Payment collection reports
- Daily activity summaries
- Route efficiency analysis
- Customizable date ranges
- CSV export functionality

### 📱 Mobile-First Design
- Responsive UI optimized for mobile devices
- Progressive Web App (PWA) capabilities
- Offline functionality for critical features

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Stripe** for payment processing
- **Twilio** for SMS/WhatsApp notifications
- **Multer** for file uploads
- **CSV Parser** for data import

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Leaflet** for maps and location services
- **Chart.js** for data visualization
- **Axios** for API communication
- **Socket.io Client** for real-time updates

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Stripe account (for payments)
- Twilio account (for notifications)
- Google Maps API key (optional, for enhanced location services)

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/field-tracker

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Payment Gateway (Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Maps API (optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Settings
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd field-tracker-app
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

5. **Start MongoDB**
Make sure MongoDB is running on your system.

6. **Run the application**

For development:
```bash
# Start backend server
npm run dev

# In another terminal, start frontend
npm run client
```

For production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/location` - Update user location

### Customers
- `GET /api/customers` - Get customers list
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/import` - Import customers from CSV

### Visits
- `GET /api/visits` - Get visits list
- `POST /api/visits/checkin` - Check-in to customer location
- `PUT /api/visits/:id/checkout` - Check-out from visit
- `PUT /api/visits/:id/route` - Update visit route
- `GET /api/visits/employee/:id/route` - Get employee daily route

### Payments
- `GET /api/payments` - Get payments list
- `POST /api/payments/cash` - Record cash payment
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-card` - Confirm card payment
- `POST /api/payments/upi` - Record UPI payment
- `GET /api/payments/:id/receipt` - Get payment receipt

### Notifications
- `POST /api/notifications/sms` - Send SMS
- `POST /api/notifications/whatsapp` - Send WhatsApp message
- `POST /api/notifications/payment-confirmation` - Send payment confirmation
- `POST /api/notifications/bulk` - Send bulk notifications

### Reports
- `GET /api/reports/employee-performance` - Employee performance report
- `GET /api/reports/daily-activity` - Daily activity report
- `GET /api/reports/payment-collection` - Payment collection report
- `GET /api/reports/export/:type` - Export reports as CSV

## Usage

### For Employees
1. **Login** with employee credentials
2. **Enable location tracking** when prompted
3. **View assigned customers** in the Customers section
4. **Check-in to customer locations** using the Visits page
5. **Collect payments** using various payment methods
6. **Check-out** when visit is complete
7. **View daily reports** and payment history

### For Managers/Admins
1. **Monitor live employee locations** on the Live Tracking page
2. **Manage customer allocations** and assignments
3. **Generate comprehensive reports** on team performance
4. **Send notifications** to customers via SMS/WhatsApp
5. **Export data** for external analysis
6. **Manage employee accounts** and permissions

## Key Features Explained

### Real-Time Location Tracking
- Employees' locations are tracked in real-time when they're logged in
- Location data is used for route optimization and visit verification
- Managers can view live employee positions on an interactive map

### Payment Integration
- Supports multiple payment methods including cash, cards, and UPI
- Stripe integration for secure card payments
- Automatic receipt generation and customer notifications

### Route Mapping
- Daily routes are automatically generated based on check-ins/check-outs
- Route efficiency analysis helps optimize field operations
- Historical route data for performance analysis

### Notification System
- Automated payment confirmations via SMS/WhatsApp
- Visit reminders and scheduling notifications
- Bulk messaging capabilities for announcements

## Security Features
- JWT-based authentication with token expiration
- Role-based access control
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure payment processing with Stripe

## Mobile Optimization
- Responsive design works on all device sizes
- Touch-friendly interface for mobile users
- Optimized for field use with offline capabilities
- Fast loading and minimal data usage

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the MIT License.

## Support
For support and questions, please contact the development team or create an issue in the repository.
