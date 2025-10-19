// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const dateRoutes = require('./routes/dateRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const mlRoutes = require('./routes/mlRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

app.use(express.json());
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));



// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dates', dateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Retail Analytics API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
// Correct 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});


// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});