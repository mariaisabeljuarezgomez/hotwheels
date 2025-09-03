require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Generate nonce for CSP
const crypto = require('crypto');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add nonce to all responses
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

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

// Serve HTML files with nonce injection
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  let html = require('fs').readFileSync(filePath, 'utf8');
  html = html.replace(/nonce=""/g, `nonce="${res.locals.nonce}"`);
  res.send(html);
});

app.get('/pages/:page', (req, res) => {
  const filePath = path.join(__dirname, 'pages', req.params.page);
  if (require('fs').existsSync(filePath)) {
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = html.replace(/nonce=""/g, `nonce="${res.locals.nonce}"`);
    res.send(html);
  } else {
    res.status(404).send('Page not found');
  }
});

// Serve other static files normally
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏎️ Hot Wheels Velocity server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://0.0.0.0:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server ready to accept connections on all interfaces`);
  
  // Send ready signal to Railway
  if (process.send) {
    process.send('ready');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
