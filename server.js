require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// API Routes (placeholder for future backend)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cart API endpoints (placeholders)
app.get('/api/cart', (req, res) => {
  res.json({ message: 'Cart API ready', items: [] });
});

app.post('/api/cart', (req, res) => {
  res.json({ message: 'Item added to cart', success: true });
});

// User API endpoints (placeholders)
app.get('/api/user', (req, res) => {
  res.json({ message: 'User API ready' });
});

// Products API endpoints (placeholders)
app.get('/api/products', (req, res) => {
  res.json({ message: 'Products API ready', products: [] });
});

app.get('/api/products/:id', (req, res) => {
  res.json({
    message: 'Product API ready',
    productId: req.params.id
  });
});

// Serve React app for all other routes (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏎️ Hot Wheels Velocity server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
