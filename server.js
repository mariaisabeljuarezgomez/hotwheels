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

// Middleware - completely disable Helmet CSP
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));



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

// Admin access route
app.get('/admin-access', (req, res) => {
  const filePath = path.join(__dirname, 'pages', 'admin-access.html');
  if (require('fs').existsSync(filePath)) {
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = html.replace(/nonce=""/g, `nonce="${res.locals.nonce}"`);
    res.send(html);
  } else {
    res.status(404).send('Admin access page not found');
  }
});

// Admin login route
app.get('/admin-login', (req, res) => {
  const nonce = res.locals.nonce;
  // Set CSP header for this specific route
  res.setHeader('Content-Security-Policy', 
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-hashes' 'sha256-Oq0+h6hP4KV0xrcTNIZ9PdNc6KCP5ai/rK/EGKVj3DU=' 'sha256-bNSr/6/jTvwFmaX/OaNsDX3Ns6333tmsFTI1G6wiWqI=' 'sha256-IFJsbVg2fRkEsPPEUdwcXdVxvBl2sEQi2E8M5HgvUso=' 'sha256-F3mpr4CUom40o+waE2MBtSuDGXtWtaodbU5CfAnR5Ks='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;`
  );
  
  const filePath = path.join(__dirname, 'pages', 'admin-login.html');
  if (require('fs').existsSync(filePath)) {
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = html.replace(/nonce=""/g, `nonce="${nonce}"`);
    res.send(html);
  } else {
    res.status(404).send('Admin login page not found');
  }
});

// Admin route
app.get('/admin', (req, res) => {
  const filePath = path.join(__dirname, 'pages', 'admin.html');
  if (require('fs').existsSync(filePath)) {
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = html.replace(/nonce=""/g, `nonce="${res.locals.nonce}"`);
    res.send(html);
  } else {
    res.status(404).send('Admin page not found');
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
app.post('/api/products', productController.createProduct);
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

// Admin routes (mock data for now)
app.get('/api/admin/orders', (req, res) => {
  // Mock orders data
  const mockOrders = [
    {
      id: 'ORD-001',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      date: '2024-01-15',
      total: 299.99,
      status: 'delivered',
      items: [
        { product_name: '1968 Redline Custom Camaro', quantity: 1, price: 299.99 }
      ]
    },
    {
      id: 'ORD-002',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      date: '2024-01-14',
      total: 89.99,
      status: 'shipped',
      items: [
        { product_name: 'Treasure Hunt Batmobile', quantity: 1, price: 89.99 }
      ]
    },
    {
      id: 'ORD-003',
      customer_name: 'Mike Johnson',
      customer_email: 'mike@example.com',
      date: '2024-01-13',
      total: 45.99,
      status: 'processing',
      items: [
        { product_name: '1970 Plymouth Barracuda', quantity: 1, price: 45.99 }
      ]
    }
  ];
  
  res.json({
    success: true,
    data: {
      orders: mockOrders
    }
  });
});

app.get('/api/admin/users', (req, res) => {
  // Mock users data
  const mockUsers = [
    {
      id: 1,
      username: 'johndoe',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'user',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      total_orders: 3,
      total_spent: 435.97
    },
    {
      id: 2,
      username: 'admin',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      total_orders: 0,
      total_spent: 0
    },
    {
      id: 3,
      username: 'janesmith',
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'user',
      is_active: true,
      created_at: '2024-01-05T00:00:00Z',
      total_orders: 1,
      total_spent: 89.99
    }
  ];
  
  res.json({
    success: true,
    data: {
      users: mockUsers
    }
  });
});

app.get('/api/admin/analytics', (req, res) => {
  // Mock analytics data
  const mockAnalytics = {
    sales_overview: {
      total_revenue: 525.97,
      total_orders: 3,
      average_order_value: 175.32,
      conversion_rate: 2.5
    },
    top_products: [
      { name: '1968 Redline Custom Camaro', sales: 1, revenue: 299.99 },
      { name: 'Treasure Hunt Batmobile', sales: 1, revenue: 89.99 },
      { name: '1970 Plymouth Barracuda', sales: 1, revenue: 45.99 }
    ],
    recent_activity: [
      { type: 'order', message: 'New order #ORD-003 from Mike Johnson', time: '2024-01-13T10:30:00Z' },
      { type: 'user', message: 'New user registration: janesmith', time: '2024-01-05T14:20:00Z' },
      { type: 'product', message: 'Product "Super Treasure Hunt Lamborghini" added', time: '2024-01-01T09:15:00Z' }
    ]
  };
  
  res.json({
    success: true,
    data: mockAnalytics
  });
});

// Category management API endpoints
app.get('/api/categories', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const result = await query(
            'SELECT * FROM categories ORDER BY sort_order, name'
        );

        res.json({
            success: true,
            data: {
                categories: result.rows
            }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get categories',
            error: error.message
        });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { name, description, parent_id, sort_order, is_active } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        const { query } = require('./config/database');
        const result = await query(
            `INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, slug, description, parent_id || null, sort_order || 0, is_active !== false]
        );

        res.json({
            success: true,
            message: 'Category created successfully',
            data: {
                category: result.rows[0]
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent_id, sort_order, is_active } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        const { query } = require('./config/database');
        const result = await query(
            `UPDATE categories 
             SET name = $1, slug = $2, description = $3, parent_id = $4, sort_order = $5, is_active = $6
             WHERE id = $7 RETURNING *`,
            [name, slug, description, parent_id || null, sort_order || 0, is_active !== false, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: {
                category: result.rows[0]
            }
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { query } = require('./config/database');
        
        // Check if category has products
        const productCheck = await query(
            'SELECT COUNT(*) FROM product_categories WHERE category_id = $1',
            [id]
        );
        
        if (parseInt(productCheck.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category that has products. Please move or delete products first.'
            });
        }

        const result = await query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        });
    }
});

// Product details API endpoints
app.get('/api/product-details/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (process.env.USE_MOCK_DATA === 'true') {
            // Mock data for product details
            const mockProduct = {
                product_id: productId,
                title: '2023 RLC Skyline GT-R',
                subtitle: 'Ultra-Rare Collectible',
                current_price: 299.99,
                                        main_image_url: '/HOT WHEELS IMAGES/hot-wheels-1.jpeg',
                        thumbnail_1_url: '/HOT WHEELS IMAGES/hot-wheels-2.jpeg',
                        thumbnail_2_url: '/HOT WHEELS IMAGES/hot-wheels-3.jpeg',
                        thumbnail_3_url: '/HOT WHEELS IMAGES/hot-wheels-4.jpeg',
                        thumbnail_4_url: '/HOT WHEELS IMAGES/hot-wheels-5.jpeg',
                primary_tag: 'ultra-rare',
                primary_tag_text: 'ULTRA RARE',
                secondary_tag: 'rlc-exclusive',
                secondary_tag_text: 'RLC EXCLUSIVE',
                expert_authenticated: true,
                certificate_number: 'HWV-2025-0892',
                authenticated_by: 'Hot Wheels Authority',
                historical_description: 'This stunning 2023 RLC Skyline GT-R is one of the most sought-after Hot Wheels collectibles. Featuring premium die-cast construction, authentic decals, and exclusive RLC membership design.',
                expert_quote: 'The 2023 RLC Skyline GT-R represents the pinnacle of Hot Wheels collecting. This exclusive release features a premium die-cast body with authentic Nissan Skyline GT-R styling, complete with detailed interior, working suspension, and rubber tires. The car comes in an exclusive RLC packaging with a certificate of authenticity.',
                features: [
                    'Premium die-cast construction',
                    'Authentic Nissan Skyline GT-R styling',
                    'Detailed interior and exterior',
                    'Working suspension system',
                    'Rubber tires with realistic tread',
                    'Exclusive RLC packaging',
                    'Certificate of authenticity'
                ],
                specifications: {
                    scale: '1:64',
                    material: 'Die-cast metal with plastic details',
                    dimensions: '3.0" x 1.2" x 0.8"',
                    weight: '2.5 oz',
                    packaging: 'RLC Exclusive Box',
                    year: '2023',
                    series: 'RLC Exclusive'
                },
                stock_quantity: 5,
                is_featured: true,
                is_active: true
            };
            return res.json(mockProduct);
        }

        const { query } = require('./config/database');
        const result = await query('SELECT * FROM product_details WHERE product_id = $1', [productId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = result.rows[0];
        
        // Parse JSON fields
        if (product.features) {
            product.features = JSON.parse(product.features);
        }
        if (product.specifications) {
            product.specifications = JSON.parse(product.specifications);
        }
        if (product.images) {
            product.images = JSON.parse(product.images);
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Homepage listings API endpoints
app.get('/api/homepage-listings', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const result = await query('SELECT * FROM homepage_listings ORDER BY section, position');
        res.json({ success: true, data: { listings: result.rows } });
    } catch (error) {
        console.error('Get homepage listings error:', error);
        res.status(500).json({ success: false, message: 'Failed to get homepage listings', error: error.message });
    }
});

app.put('/api/homepage-listings', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const { 
            listing_id, title, description, price, image_url, tag_type, tag_text, product_link, is_active,
            subtitle, original_price, stock_quantity, detailed_description, features, specifications,
            main_image_url, thumbnail_1_url, thumbnail_2_url, thumbnail_3_url, thumbnail_4_url,
            productType, sizes,
            // Market Value & Investment Data
            market_value, price_change_percentage, investment_grade, last_price_update, week_low, week_high, avg_sale_price,
            // Expert Authentication
            expert_authenticated, certificate_number, authenticated_by,
            // Detailed Specifications
            production_year, series, casting, spectraflame_color, tampo, wheel_type, country_of_origin, condition_rating, condition_description,
            // Premium Services
            professional_grading, grading_price, custom_display_case, display_case_price, insurance_valuation, insurance_price,
            // Product Status Tags
            ultra_rare, mint_condition, investment_grade_tag, limited_edition, original_packaging, certified_authentic,
            // Historical Context & Expert Commentary
            historical_description, expert_quote, expert_name, expert_rating
        } = req.body;
        
        // Update homepage_listings table
        const result = await query(`
            UPDATE homepage_listings 
            SET title = $1, description = $2, price = $3, image_url = $4, 
                tag_type = $5, tag_text = $6, product_link = $7, is_active = $8, 
                updated_at = CURRENT_TIMESTAMP
            WHERE listing_id = $9
            RETURNING *
        `, [title, description, price, image_url, tag_type, tag_text, product_link, is_active, listing_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // Extract product ID from listing_id (e.g., 'featured-1' -> 1, 'exclusive-2' -> 2)
        const productId = parseInt(listing_id.split('-')[1]);
        
        // Update or insert product_details
        if (productId && (subtitle || original_price || stock_quantity || detailed_description || features || specifications || main_image_url || thumbnail_1_url)) {
            try {
                // Check if product details exist
                const existingProduct = await query('SELECT * FROM product_details WHERE product_id = $1', [productId]);
                
                if (existingProduct.rows.length > 0) {
                    // Update existing product details
                    console.log('🔄 Updating product_details for product_id:', productId);
                    console.log('📝 Update data:', { title, subtitle, price, description, detailed_description });
                    
                    const updateResult = await query(`
                        UPDATE product_details 
                        SET title = $1, subtitle = $2, current_price = $3, 
                            historical_description = $4, expert_quote = $5,
                            main_image_url = $6, thumbnail_1_url = $7, thumbnail_2_url = $8,
                            thumbnail_3_url = $9, thumbnail_4_url = $10,
                            -- Market Value & Investment Data
                            avg_sale_price = $11, price_change_percentage = $12, investment_grade = $13,
                            week_low = $14, week_high = $15,
                            -- Expert Authentication
                            expert_authenticated = $16, certificate_number = $17, authenticated_by = $18,
                            -- Detailed Specifications
                            production_year = $19, series = $20, casting = $21, color = $22, tampo = $23, wheels = $24, country = $25, condition_rating = $26, condition_description = $27,
                            -- Premium Services
                            professional_grading = $28, grading_price = $29, custom_display_case = $30, display_case_price = $31, insurance_valuation = $32, insurance_price = $33,
                            -- Expert Commentary
                            expert_name = $34, expert_rating = $35,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE product_id = $36
                    `, [
                        title, subtitle, price, description, 
                        detailed_description, main_image_url, thumbnail_1_url, 
                        thumbnail_2_url, thumbnail_3_url, thumbnail_4_url, 
                        // Market Value & Investment Data
                        avg_sale_price, price_change_percentage, investment_grade, week_low, week_high,
                        // Expert Authentication
                        expert_authenticated, certificate_number, authenticated_by,
                        // Detailed Specifications - using correct database column names
                        production_year, series, casting, spectraflame_color, tampo, wheel_type, country_of_origin, condition_rating, condition_description,
                        // Premium Services
                        professional_grading, grading_price, custom_display_case, display_case_price, insurance_valuation, insurance_price,
                        // Expert Commentary
                        expert_name, expert_rating,
                        productId
                    ]);
                    
                    console.log('✅ Product details update result:', updateResult.rowCount, 'rows affected');
                } else {
                    // Insert new product details
                    await query(`
                        INSERT INTO product_details (
                            product_id, title, subtitle, current_price, 
                            historical_description, expert_quote,
                            main_image_url, thumbnail_1_url, thumbnail_2_url,
                            thumbnail_3_url, thumbnail_4_url,
                            is_active
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    `, [
                        productId, title, subtitle, price, description,
                        detailed_description, main_image_url, thumbnail_1_url, 
                        thumbnail_2_url, thumbnail_3_url, thumbnail_4_url, 
                        true
                    ]);
                }
            } catch (productError) {
                console.error('Error updating product details:', productError);
                // Don't fail the entire request if product details update fails
            }
        }
        
        res.json({ success: true, message: 'Listing updated successfully', data: { listing: result.rows[0] } });
    } catch (error) {
        console.error('Update homepage listing error:', error);
        res.status(500).json({ success: false, message: 'Failed to update listing', error: error.message });
    }
});

// Analytics tracking endpoint
app.post('/api/analytics/track', async (req, res) => {
    try {
        // Log analytics event (in production, you'd save to database)
        console.log('📊 Analytics Event:', req.body);
        res.json({ success: true, message: 'Event tracked' });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        res.status(500).json({ success: false, message: 'Failed to track event' });
    }
});

// Image upload endpoint for homepage listings
app.post('/api/upload-homepage-image', async (req, res) => {
    try {
        const multer = require('multer');
        const path = require('path');
        const fs = require('fs');
        
        // Configure multer for file uploads
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = path.join(__dirname, 'HOT WHEELS IMAGES');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `homepage-${req.body.listing_id}-${uniqueSuffix}${path.extname(file.originalname)}`);
            }
        });
        
        const upload = multer({ 
            storage: storage,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('image/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only image files are allowed'), false);
                }
            }
        });
        
        upload.single('image')(req, res, (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({ success: false, message: err.message });
            }
            
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }
            
            const imageUrl = `/HOT WHEELS IMAGES/${req.file.filename}`;
            res.json({ 
                success: true, 
                message: 'Image uploaded successfully', 
                data: { imageUrl } 
            });
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload image', error: error.message });
    }
});

// Admin uploads route
app.get('/admin-uploads', (req, res) => {
  const nonce = res.locals.nonce;
  // Set CSP header for this specific route - strict but allowing event handlers
  res.setHeader('Content-Security-Policy', 
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; script-src-attr 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;`
  );
  
  const filePath = path.join(__dirname, 'pages', 'admin-uploads.html');
  if (require('fs').existsSync(filePath)) {
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = html.replace(/nonce=""/g, `nonce="${nonce}"`);
    res.send(html);
  } else {
    res.status(404).send('Admin uploads page not found');
  }
});

// Category management route
app.get('/category-management', (req, res) => {
  const nonce = res.locals.nonce;
  // Set CSP header for this specific route - strict but allowing event handlers
  res.setHeader('Content-Security-Policy', 
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; script-src-attr 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;`
  );
  
  const filePath = path.join(__dirname, 'pages', 'category-management.html');
  if (require('fs').existsSync(filePath)) {
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = html.replace(/nonce=""/g, `nonce="${nonce}"`);
    res.send(html);
  } else {
    res.status(404).send('Category management page not found');
  }
});

// Homepage listings management route
app.get('/homepage-listings', (req, res) => {
  const nonce = res.locals.nonce;
  // Set CSP header for this specific route - strict but allowing event handlers
  res.setHeader('Content-Security-Policy', 
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; script-src-attr 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;`
  );
  
  const filePath = path.join(__dirname, 'pages', 'homepage-listings.html');
  if (require('fs').existsSync(filePath)) {
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = html.replace(/nonce=""/g, `nonce="${nonce}"`);
    res.send(html);
  } else {
    res.status(404).send('Homepage listings page not found');
  }
});



// Admin products endpoint
app.get('/api/admin/products', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const result = await query(
            `SELECT p.*, pi.image_url as primary_image 
             FROM products p 
             LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true 
             ORDER BY p.created_at DESC`
        );

        res.json({
            success: true,
            data: {
                products: result.rows
            }
        });
    } catch (error) {
        console.error('Get admin products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get products',
            error: error.message
        });
    }
});

// Admin product upload endpoint
app.post('/api/admin/products/upload', (req, res) => {
  try {
    const productData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'sku', 'category_id', 'price', 'stock_quantity'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }

    // Generate a mock product ID
    const productId = Date.now();
    
    // Create the product object
    const newProduct = {
      id: productId,
      name: productData.name,
      sku: productData.sku,
      category_id: productData.category_id,
      series: productData.series || null,
      description: productData.description || '',
      price: parseFloat(productData.price),
      original_price: productData.original_price ? parseFloat(productData.original_price) : null,
      sale_percentage: productData.sale_percentage ? parseInt(productData.sale_percentage) : 0,
      rarity_level: productData.rarity_level || 'Common',
      car_model: productData.car_model || null,
      manufacturer: productData.manufacturer || null,
      year_released: productData.year_released ? parseInt(productData.year_released) : null,
      scale: productData.scale || '1:64',
      color_variations: productData.color_variations || [],
      special_features: productData.special_features || [],
      stock_quantity: parseInt(productData.stock_quantity),
      low_stock_threshold: productData.low_stock_threshold ? parseInt(productData.low_stock_threshold) : 5,
      track_inventory: productData.track_inventory !== false,
      is_featured: productData.is_featured === true,
      is_active: productData.is_active !== false,
      features: productData.features || [],
      tags: productData.tags || [],
      images: productData.images || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In a real implementation, this would save to the database
    console.log('New product created:', newProduct);
    
    res.json({
      success: true,
      message: 'Product uploaded successfully',
      data: { product: newProduct }
    });
    
  } catch (error) {
    console.error('Product upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin product delete endpoint
app.delete('/api/admin/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    // In a real implementation, this would delete from the database
    console.log('Product deleted:', productId);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

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
let serverInstance = null;

startServer().then(server => {
  serverInstance = server;
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
