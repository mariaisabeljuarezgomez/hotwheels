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
app.get('/api/product-details/all', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const result = await query('SELECT * FROM product_details ORDER BY product_id');
        res.json({ success: true, data: { products: result.rows } });
    } catch (error) {
        console.error('Error fetching all product details:', error);
        res.status(500).json({ success: false, message: 'Failed to get product details', error: error.message });
    }
});

app.put('/api/product-details/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { query } = require('./config/database');

        console.log('PUT /api/product-details/:id received for product:', productId);
        console.log('Request body:', req.body);

        // Build dynamic update query for product_details table
        const updateFields = [];
        const queryParams = [];

        // Always update these core fields
        updateFields.push('title = $' + (queryParams.length + 1));
        queryParams.push(req.body.title);

        updateFields.push('current_price = $' + (queryParams.length + 1));
        queryParams.push(req.body.current_price);

        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        // Add other fields if provided
        const fieldMappings = {
            subtitle: 'subtitle',
            main_image_url: 'main_image_url',
            thumbnail_1_url: 'thumbnail_1_url',
            thumbnail_2_url: 'thumbnail_2_url',
            thumbnail_3_url: 'thumbnail_3_url',
            thumbnail_4_url: 'thumbnail_4_url',
            primary_tag: 'primary_tag',
            primary_tag_text: 'primary_tag_text',
            secondary_tag: 'secondary_tag',
            secondary_tag_text: 'secondary_tag_text',
            expert_authenticated: 'expert_authenticated',
            certificate_number: 'certificate_number',
            authenticated_by: 'authenticated_by',
            production_year: 'production_year',
            series: 'series',
            casting: 'casting',
            color: 'color',
            tampo: 'tampo',
            wheels: 'wheels',
            country: 'country',
            condition_rating: 'condition_rating',
            condition_description: 'condition_description',
            professional_grading: 'professional_grading',
            grading_price: 'grading_price',
            custom_display_case: 'custom_display_case',
            display_case_price: 'display_case_price',
            insurance_valuation: 'insurance_valuation',
            insurance_price: 'insurance_price',
            production_run: 'production_run',
            mint_survivors: 'mint_survivors',
            designer: 'designer',
            historical_description: 'historical_description',
            expert_quote: 'expert_quote',
            expert_name: 'expert_name',
            expert_rating: 'expert_rating',
            five_year_growth: 'five_year_growth',
            liquidity: 'liquidity',
            market_demand: 'market_demand',
            risk_level: 'risk_level',
            review_1_author: 'review_1_author',
            review_1_rating: 'review_1_rating',
            review_1_text: 'review_1_text',
            review_1_verified: 'review_1_verified',
            review_1_date: 'review_1_date',
            review_2_author: 'review_2_author',
            review_2_rating: 'review_2_rating',
            review_2_text: 'review_2_text',
            review_2_verified: 'review_2_verified',
            review_2_date: 'review_2_date',
            review_3_author: 'review_3_author',
            review_3_rating: 'review_3_rating',
            review_3_text: 'review_3_text',
            review_3_verified: 'review_3_verified',
            review_3_date: 'review_3_date',
            product_type: 'product_type',
            available_sizes: 'available_sizes',
            size_chart_url: 'size_chart_url',
            toggle_settings: 'toggle_settings',
            is_active: 'is_active'
        };

        Object.entries(fieldMappings).forEach(([requestField, dbField]) => {
            if (req.body[requestField] !== undefined) {
                updateFields.push(`${dbField} = $${queryParams.length + 1}`);
                queryParams.push(req.body[requestField]);
            }
        });

        const updateQuery = `
            UPDATE product_details SET
                ${updateFields.join(', ')}
            WHERE product_id = $${queryParams.length + 1}
        `;
        queryParams.push(productId);

        console.log('Product details update query:', updateQuery);
        console.log('Query params:', queryParams);

        const result = await query(updateQuery, queryParams);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product details updated successfully', data: { updated: result.rowCount } });
    } catch (error) {
        console.error('Error updating product details:', error);
        res.status(500).json({ success: false, message: 'Failed to update product details', error: error.message });
    }
});

app.get('/api/product-details/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (process.env.USE_MOCK_DATA === 'true') {
            let mockProduct;
            if (productId === 1) {
                // Specific mock data for the T-shirt (product_id: 1)
                mockProduct = {
                    product_id: 1,
                    title: "Hot Wheels x Kenny Scharf Black T-Shirt",
                    subtitle: "BLACK T SHIRT",
                    current_price: "70.00",
                    description: "T-shirt description with sizing info",
                    main_image_url: "/HOT WHEELS IMAGES/MC_PDP_KennyScharf-Tshirt-1.jpg",
                    thumbnail_1_url: "/HOT WHEELS IMAGES/MC_PDP_KennyScharf-Tshirt-2.jpg",
                    thumbnail_2_url: "/HOT WHEELS IMAGES/MC_PDP_KennyScharf-Tshirt-3.jpg",
                    thumbnail_3_url: "/HOT WHEELS IMAGES/MC_PDP_KennyScharf-Tshirt-4.jpg",
                    thumbnail_4_url: "/HOT WHEELS IMAGES/MC_PDP_KennyScharf-Tshirt-5.jpg",
                    productType: "t-shirt",
                    colors: ["Black", "White"],
                    sizes: ["S", "M", "L", "XL", "2XL"],
                    specifications: {
                        "Product Type": "T-Shirt",
                        "Material": "100% Cotton",
                        "Care Instructions": "Machine wash cold, tumble dry low"
                    },
                    features: [
                        "Limited edition Kenny Scharf design",
                        "High-quality print",
                        "Comfortable fit"
                    ]
                };
            } else {
                // Fallback mock data for other products
                mockProduct = {
                    product_id: productId,
                    title: '2023 RLC Skyline GT-R',
                    subtitle: 'Ultra-Rare Collectible',
                    current_price: 299.99,
                    main_image_url: '/HOT WHEELS IMAGES/hot-wheels-1.jpeg',
                    thumbnail_1_url: '/HOT WHEELS IMAGES/hot-wheels-2.jpeg',
                    thumbnail_2_url: '/HOT WHEELS IMAGES/hot-wheels-3.jpeg',
                    thumbnail_3_url: '/HOT WHEELS IMAGES/hot-wheels-4.jpeg',
                    thumbnail_4_url: '/HOT WHEELS IMAGES/hot-wheels-5.jpeg',
                    specifications: {
                        scale: '1:64',
                        material: 'Die-cast metal',
                        year: '2023'
                    },
                    features: []
                };
            }
            return res.json(mockProduct);
        }

        const { query } = require('./config/database');
        const result = await query('SELECT * FROM product_details WHERE product_id = $1', [productId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = result.rows[0];
        
        console.log('🔍 Raw product from database - available_sizes:', product.available_sizes);
        console.log('🔍 Raw product from database - product_type:', product.product_type);
        console.log('🔍 Raw product from database - historical_description:', product.historical_description?.substring(0, 50) + '...');
        console.log('🔍 Raw product from database - expert_quote:', product.expert_quote?.substring(0, 50) + '...');
        
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
        if (product.available_sizes) {
            console.log('🔍 Parsing available_sizes:', product.available_sizes);
            const sizesData = JSON.parse(product.available_sizes);
            product.productType = sizesData.productType || 'hot-wheels';
            product.sizes = sizesData.sizes || [];
            product.colors = sizesData.colors || [];
            console.log('🔍 Parsed T-shirt data:', { productType: product.productType, sizes: product.sizes, colors: product.colors });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// State for mock data
let mockHomepageListings = [
    { listing_id: 'featured-1', section: 'featured', position: 1, title: '1968 Redline Custom Camaro', description: 'Mint condition with original blister pack', price: '2450.00', image_url: '/HOT WHEELS IMAGES/hot-wheels-1.jpeg', tag_type: 'ultra-rare', tag_text: 'ULTRA RARE', product_link: 'product_detail.html?id=1', is_active: true },
    { listing_id: 'featured-2', section: 'featured', position: 2, title: '2023 RLC Exclusive McLaren', description: 'Limited edition with certificate', price: '89.00', image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&h=300', tag_type: 'rlc-exclusive', tag_text: 'RLC EXCLUSIVE', product_link: 'product_detail.html?id=2', is_active: true },
    { listing_id: 'featured-3', section: 'featured', position: 3, title: '2024 Treasure Hunt Mustang', description: 'Super Treasure Hunt variant', price: '156.00', image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400&h=300', tag_type: 'treasure-hunt', tag_text: 'TREASURE HUNT', product_link: 'product_detail.html?id=3', is_active: true },
];

// Homepage listings API endpoints
app.get('/api/homepage-listings', async (req, res) => {
    if (process.env.USE_MOCK_DATA === 'true') {
        return res.json({ success: true, data: { listings: mockHomepageListings } });
    }
    try {
        const { query } = require('./config/database');
        const result = await query(`
            SELECT hl.*,
                   pd.main_image_url, pd.thumbnail_1_url, pd.thumbnail_2_url,
                   pd.thumbnail_3_url, pd.thumbnail_4_url
            FROM homepage_listings hl
            LEFT JOIN product_details pd ON hl.listing_id = 'product-' || pd.product_id::text
            ORDER BY hl.section, hl.position
        `);
        res.json({ success: true, data: { listings: result.rows } });
    } catch (error) {
        console.error('Get homepage listings error:', error);
        res.status(500).json({ success: false, message: 'Failed to get homepage listings', error: error.message });
    }
});

app.put('/api/homepage-listings', async (req, res) => {
    console.log('--- PUT /api/homepage-listings request received ---');
    if (process.env.USE_MOCK_DATA === 'true') {
        console.log('✅ Mocking PUT /api/homepage-listings');
        const updatedListing = req.body;
        const index = mockHomepageListings.findIndex(l => l.listing_id === updatedListing.listing_id);
        if (index !== -1) {
            mockHomepageListings[index] = { ...mockHomepageListings[index], ...updatedListing };
        }
        return res.json({ success: true, message: 'Listing updated successfully (mocked)', data: { listing: mockHomepageListings[index] } });
    }

    try {
        const { query } = require('./config/database');
        const {
            listing_id, title, description, price, image_url, tag_type, tag_text, product_link, is_active,
            subtitle,
            main_image_url, thumbnail_1_url, thumbnail_2_url, thumbnail_3_url, thumbnail_4_url,
            productType, sizes, colors,
            market_value, price_change_percentage, investment_grade, week_low, week_high, avg_sale_price,
            expert_authenticated, certificate_number, authenticated_by,
            production_year, series, casting, color, tampo, wheels, country, condition_rating, condition_description,
            professional_grading, grading_price, custom_display_case, display_case_price, insurance_valuation, insurance_price,
            historical_description, expert_quote, expert_name, expert_rating,
            ...otherFields
        } = req.body;

        // --- 1. Update the base homepage_listings table ---
        const homepageListingResult = await query(`
            UPDATE homepage_listings 
            SET title = $1, description = $2, price = $3, image_url = $4, 
                tag_type = $5, tag_text = $6, product_link = $7, is_active = $8, 
                updated_at = CURRENT_TIMESTAMP
            WHERE listing_id = $9
            RETURNING *
        `, [title, description, price, image_url || main_image_url, tag_type, tag_text, product_link, is_active, listing_id]);
        
        if (homepageListingResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // --- 2. Update the detailed product_details table ---
        const productId = parseInt(listing_id.split('-')[1]);
        if (productId) {
            // Build dynamic update query - only update fields that are provided
            const updateFields = [];
            const queryParams = [];

            // Core required fields
            updateFields.push('title = $' + (queryParams.length + 1));
            queryParams.push(title);

            updateFields.push('current_price = $' + (queryParams.length + 1));
            queryParams.push(price);

            updateFields.push('updated_at = CURRENT_TIMESTAMP');

            // Optional fields - only include if provided
            if (subtitle !== undefined) {
                updateFields.push('subtitle = $' + (queryParams.length + 1));
                queryParams.push(subtitle);
            }
            if (main_image_url !== undefined) {
                updateFields.push('main_image_url = $' + (queryParams.length + 1));
                queryParams.push(main_image_url);
            }
            if (thumbnail_1_url !== undefined) {
                updateFields.push('thumbnail_1_url = $' + (queryParams.length + 1));
                queryParams.push(thumbnail_1_url);
            }
            if (thumbnail_2_url !== undefined) {
                updateFields.push('thumbnail_2_url = $' + (queryParams.length + 1));
                queryParams.push(thumbnail_2_url);
            }
            if (thumbnail_3_url !== undefined) {
                updateFields.push('thumbnail_3_url = $' + (queryParams.length + 1));
                queryParams.push(thumbnail_3_url);
            }
            if (thumbnail_4_url !== undefined) {
                updateFields.push('thumbnail_4_url = $' + (queryParams.length + 1));
                queryParams.push(thumbnail_4_url);
            }
            if (price_change_percentage !== undefined) {
                updateFields.push('price_change_percentage = $' + (queryParams.length + 1));
                queryParams.push(price_change_percentage);
            }
            if (investment_grade !== undefined) {
                updateFields.push('investment_grade = $' + (queryParams.length + 1));
                queryParams.push(investment_grade);
            }
            if (week_low !== undefined) {
                updateFields.push('week_low = $' + (queryParams.length + 1));
                queryParams.push(week_low);
            }
            if (week_high !== undefined) {
                updateFields.push('week_high = $' + (queryParams.length + 1));
                queryParams.push(week_high);
            }
            if (avg_sale_price !== undefined) {
                updateFields.push('avg_sale_price = $' + (queryParams.length + 1));
                queryParams.push(avg_sale_price);
            }
            if (tag_type !== undefined) {
                updateFields.push('primary_tag = $' + (queryParams.length + 1));
                queryParams.push(tag_type);
            }
            if (tag_text !== undefined) {
                updateFields.push('primary_tag_text = $' + (queryParams.length + 1));
                queryParams.push(tag_text);
            }
            if (expert_authenticated !== undefined) {
                updateFields.push('expert_authenticated = $' + (queryParams.length + 1));
                queryParams.push(expert_authenticated);
            }
            if (certificate_number !== undefined) {
                updateFields.push('certificate_number = $' + (queryParams.length + 1));
                queryParams.push(certificate_number);
            }
            if (authenticated_by !== undefined) {
                updateFields.push('authenticated_by = $' + (queryParams.length + 1));
                queryParams.push(authenticated_by);
            }
            if (production_year !== undefined) {
                updateFields.push('production_year = $' + (queryParams.length + 1));
                queryParams.push(production_year);
            }
            if (series !== undefined) {
                updateFields.push('series = $' + (queryParams.length + 1));
                queryParams.push(series);
            }
            if (casting !== undefined) {
                updateFields.push('casting = $' + (queryParams.length + 1));
                queryParams.push(casting);
            }
            if (color !== undefined) {
                updateFields.push('color = $' + (queryParams.length + 1));
                queryParams.push(color);
            }
            if (tampo !== undefined) {
                updateFields.push('tampo = $' + (queryParams.length + 1));
                queryParams.push(tampo);
            }
            if (wheels !== undefined) {
                updateFields.push('wheels = $' + (queryParams.length + 1));
                queryParams.push(wheels);
            }
            if (country !== undefined) {
                updateFields.push('country = $' + (queryParams.length + 1));
                queryParams.push(country);
            }
            if (condition_rating !== undefined) {
                updateFields.push('condition_rating = $' + (queryParams.length + 1));
                queryParams.push(condition_rating);
            }
            if (condition_description !== undefined) {
                updateFields.push('condition_description = $' + (queryParams.length + 1));
                queryParams.push(condition_description);
            }
            if (professional_grading !== undefined) {
                updateFields.push('professional_grading = $' + (queryParams.length + 1));
                queryParams.push(professional_grading);
            }
            if (grading_price !== undefined) {
                updateFields.push('grading_price = $' + (queryParams.length + 1));
                queryParams.push(grading_price);
            }
            if (custom_display_case !== undefined) {
                updateFields.push('custom_display_case = $' + (queryParams.length + 1));
                queryParams.push(custom_display_case);
            }
            if (display_case_price !== undefined) {
                updateFields.push('display_case_price = $' + (queryParams.length + 1));
                queryParams.push(display_case_price);
            }
            if (insurance_valuation !== undefined) {
                updateFields.push('insurance_valuation = $' + (queryParams.length + 1));
                queryParams.push(insurance_valuation);
            }
            if (insurance_price !== undefined) {
                updateFields.push('insurance_price = $' + (queryParams.length + 1));
                queryParams.push(insurance_price);
            }
            if (historical_description !== undefined) {
                updateFields.push('historical_description = $' + (queryParams.length + 1));
                queryParams.push(historical_description);
            }
            if (expert_quote !== undefined) {
                updateFields.push('expert_quote = $' + (queryParams.length + 1));
                queryParams.push(expert_quote);
            }
            if (expert_name !== undefined) {
                updateFields.push('expert_name = $' + (queryParams.length + 1));
                queryParams.push(expert_name);
            }
            if (expert_rating !== undefined) {
                updateFields.push('expert_rating = $' + (queryParams.length + 1));
                queryParams.push(expert_rating);
            }
            if (productType !== undefined) {
                updateFields.push('product_type = $' + (queryParams.length + 1));
                queryParams.push(productType);
            }
            if (sizes !== undefined || colors !== undefined) {
                updateFields.push('available_sizes = $' + (queryParams.length + 1));
                queryParams.push(JSON.stringify({
                    productType: productType || 'hot-wheels',
                    sizes: sizes || [],
                    colors: colors || []
                }));
            }

            const updateQuery = `
                UPDATE product_details SET
                    ${updateFields.join(', ')}
                WHERE product_id = $${queryParams.length + 1}
            `;
            queryParams.push(productId);

            console.log('🔍 Dynamic UPDATE query:', updateQuery);
            console.log('🔍 Query params count:', queryParams.length);

            try {
                const updateResult = await query(updateQuery, queryParams);
                console.log('✅ Product details update result:', updateResult.rowCount, 'rows affected');
            } catch (productError) {
                console.error('❌ Error updating product details:', productError);
                // Don't fail the entire request if product details update fails, but log it.
            }
        }
        
        // Return the updated homepage listing data
        res.json({ success: true, message: 'Listing updated successfully', data: { listing: homepageListingResult.rows[0] } });
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

    // Initialize data after database is ready
    try {
      const { initializeHomepageListings } = require('./scripts/init-homepage-listings');
      await initializeHomepageListings();
    } catch (error) {
      console.log('⚠️ Homepage listings initialization skipped:', error.message);
    }

    try {
      const { initializeProductDetails } = require('./scripts/init-product-details');
      await initializeProductDetails();
    } catch (error) {
      console.log('⚠️ Product details initialization skipped:', error.message);
    }

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
