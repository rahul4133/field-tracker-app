# Fix Login/Registration Failed Error - Netlify Deployment

## Problem
Your Netlify frontend can't connect to the backend API, causing login and registration failures.

## Root Cause
- Frontend is deployed on Netlify (static hosting)
- Backend needs to be deployed separately
- API calls are failing because there's no backend URL configured

## Solution Steps

### Step 1: Deploy Your Backend First

Choose one of these platforms for your backend:

#### Option A: Heroku (Recommended)
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create your-field-tracker-api

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secure_jwt_secret_here
heroku config:set CASHFREE_APP_ID=your_cashfree_app_id
heroku config:set CASHFREE_SECRET_KEY=your_cashfree_secret
heroku config:set SMSMENOW_API_KEY=your_sms_api_key
heroku config:set SMSMENOW_PASSWORD=your_sms_password
heroku config:set INTERAKT_API_KEY=your_whatsapp_api_key

# Deploy
git push heroku main
```

#### Option B: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Option C: Render
1. Go to render.com
2. Connect your GitHub repository
3. Create new Web Service
4. Set build command: `npm install`
5. Set start command: `node server.js`

### Step 2: Update Frontend API Configuration

#### Create Environment Variable
Create `client/.env` file:
```env
REACT_APP_API_URL=https://your-backend-url.herokuapp.com
```

#### Update Netlify Environment Variables
1. Go to Netlify Dashboard
2. Site Settings → Environment Variables
3. Add: `REACT_APP_API_URL` = `https://your-backend-url.herokuapp.com`

### Step 3: Update Backend CORS

Update your `server.js` to allow Netlify domain:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-netlify-app.netlify.app'
  ],
  credentials: true
}));
```

### Step 4: Test API Connection

```bash
# Test if backend is accessible
curl https://your-backend-url.herokuapp.com/api/health

# Should return: {"status": "OK"}
```

## Quick Fix for Testing

If you want to test immediately with a local backend:

1. **Start your local server:**
   ```bash
   node server.js
   ```

2. **Use ngrok to expose it:**
   ```bash
   npm install -g ngrok
   ngrok http 5000
   ```

3. **Update Netlify environment variable:**
   ```
   REACT_APP_API_URL=https://abc123.ngrok.io
   ```

## Expected Backend URLs by Platform

- **Heroku**: `https://your-app-name.herokuapp.com`
- **Railway**: `https://your-app-name.railway.app`
- **Render**: `https://your-app-name.onrender.com`
- **DigitalOcean**: `https://your-domain.com`

## Verification Steps

1. Backend deployed and accessible
2. Frontend environment variable set
3. CORS configured for Netlify domain
4. Registration/login working

## Common Issues

### Issue: "Network Error"
- Backend not deployed or not accessible
- Wrong API URL in environment variable

### Issue: "CORS Error"
- Backend CORS not configured for Netlify domain
- Missing credentials: true in CORS config

### Issue: "404 Not Found"
- API routes not properly configured
- Wrong base URL in frontend

Your login/registration will work once the backend is deployed and properly configured!
