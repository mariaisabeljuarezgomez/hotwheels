require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

// Import database and models
const { initializeDatabase } = require('./config/database');

// Import controllers
const authController = require('./controllers/authController');
const productController = require('./controllers/productController');
const cartController = require('./controllers/cartController');

// Import validation middleware
const validation = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Generate nonce for CSP
const crypto = require('crypto');

// Add nonce to all responses FIRST
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false  // We'll set CSP manually
}));

// Set CSP header manually with nonce
app.use((req, res, next) => {
  const nonce = res.locals.nonce;
  res.setHeader('Content-Security-Policy', 
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-hashes' 'sha256-Oq0+h6hP4KV0xrcTNIZ9PdNc6KCP5ai/rK/EGKVj3DU=' 'sha256-bNSr/6/jTvwFmaX/OaNsDX3Ns6333tmsFTI1G6wiWqI='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;`
  );
  next();
});

app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'hot-wheels-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve HTML files with nonce injection FIRST
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  let html = require('fs').readFileSync(filePath, 'utf8');
  html = html.replace(/nonce=""/g, `nonce="${res.locals.nonce}"`);
  console.log(`Nonce injected: ${res.locals.nonce}`);
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

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No content for favicon
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication routes
app.post('/api/auth/register', validation.validateRegister, authController.register);
app.post('/api/auth/login', validation.validateLogin, authController.login);
app.get('/api/auth/profile', authController.verifyToken, authController.getProfile);
app.put('/api/auth/profile', authController.verifyToken, validation.validateProfileUpdate, authController.updateProfile);
app.put('/api/auth/change-password', authController.verifyToken, validation.validateChangePassword, authController.changePassword);
app.post('/api/auth/logout', authController.verifyToken, authController.logout);

// Product routes
app.get('/api/products', validation.validatePagination, validation.validateProductFilters, productController.getProducts);
app.get('/api/products/featured', validation.validatePagination, productController.getFeaturedProducts);
app.get('/api/products/search', validation.validateSearch, validation.validatePagination, productController.searchProducts);
app.get('/api/products/filters', productController.getProductFilters);
app.get('/api/products/category/:categorySlug', validation.validateCategorySlug, validation.validatePagination, productController.getProductsByCategory);
app.get('/api/products/:id', validation.validateProductId, productController.getProduct);
app.get('/api/products/slug/:slug', validation.validateProductSlug, productController.getProductBySlug);
app.get('/api/products/:id/reviews', validation.validateProductId, validation.validatePagination, productController.getProductReviews);
app.get('/api/categories', productController.getCategories);

// Cart routes (with optional authentication)
app.get('/api/cart', authController.optionalAuth, cartController.getCart);
app.post('/api/cart', authController.optionalAuth, validation.validateAddToCart, cartController.addToCart);
app.put('/api/cart/:productId', authController.optionalAuth, validation.validateUpdateCartItem, cartController.updateCartItem);
app.delete('/api/cart/:productId', authController.optionalAuth, validation.validateProductId, cartController.removeFromCart);
app.delete('/api/cart', authController.optionalAuth, cartController.clearCart);
app.get('/api/cart/count', authController.optionalAuth, cartController.getCartCount);
app.get('/api/cart/validate', authController.optionalAuth, cartController.validateCart);
app.post('/api/cart/merge', authController.verifyToken, cartController.mergeCart);

// Serve static files (CSS, JS, images, etc.) - but NOT HTML
app.use(express.static(path.join(__dirname), {
  extensions: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      return false; // Don't serve HTML files through static middleware
    }
  }
}));

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

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏎️ Hot Wheels Velocity server running on port ${PORT}`);
      console.log(`🌐 Frontend: http://0.0.0.0:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 Server ready to accept connections on all interfaces`);
      console.log(`📊 Database connected and ready`);
      
      // Send ready signal to Railway
      if (process.send) {
        process.send('ready');
      }
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

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
