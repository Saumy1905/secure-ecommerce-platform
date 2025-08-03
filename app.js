const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimit');
require('dotenv').config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with custom CSP configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
        connectSrc: ["'self'"],
      },
    },
  })
); 

app.use(cors()); // Enables CORS with default config
app.use(express.json({ limit: '10kb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(mongoSanitize()); // Prevent MongoDB operator injection

// CSRF protection - only apply to specific routes
const csrfProtection = csrf({ cookie: true });

// Rate limiting
app.use('/api', apiLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint working',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// CSRF token route
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));

// Comment out CSRF for testing - restore later for security
// app.use('/api/cart', csrfProtection, require('./routes/cart'));
app.use('/api/cart', require('./routes/cart')); // Temporarily disable CSRF for testing

// app.use('/api/orders', csrfProtection, require('./routes/orders'));
app.use('/api/orders', require('./routes/orders')); // Temporarily disable CSRF for testing

// app.use('/api/payment', csrfProtection, require('./routes/payment'));
app.use('/api/payment', require('./routes/payment')); // Temporarily disable CSRF for testing

// Basic route
app.get('/api/status', (req, res) => {
  res.status(200).json({ message: 'Server is running securely' });
});

// Handle SPA routing (for frontend routes)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  // CSRF error handling
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token. Please refresh the page and try again.'
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    // Don't expose error details in production
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});