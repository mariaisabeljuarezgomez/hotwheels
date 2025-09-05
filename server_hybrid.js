// HYBRID APPROACH: Best of both solutions
// - Use existing product_details table with toggle_settings for toggles
// - Use separate tables for major conflicts (images, basic info)
// - Simpler than full separation, but fixes all conflicts

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

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'hot-wheels-velocity-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/HOT_WHEELS_IMAGES', express.static(path.join(__dirname, 'HOT_WHEELS_IMAGES')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// HYBRID API ENDPOINTS
// ========================================

// 1. HOMEPAGE LISTINGS (using existing table but with JOIN for images)
app.get('/api/homepage-listings', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const result = await query(`
            SELECT hl.*,
                   pd.main_image_url, pd.thumbnail_1_url, pd.thumbnail_2_url,
                   pd.thumbnail_3_url, pd.thumbnail_4_url
            FROM homepage_listings hl
            LEFT JOIN product_details pd ON hl.listing_id = 'exclusive-' || pd.product_id::text
            ORDER BY hl.section, hl.position
        `);
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
            subtitle, main_image_url, thumbnail_1_url, thumbnail_2_url, thumbnail_3_url, thumbnail_4_url,
            toggle_settings, detailed_description, original_price, stock_quantity
        } = req.body;

        // 1. Update homepage_listings table
        const homepageResult = await query(`
            UPDATE homepage_listings 
            SET title = $1, description = $2, price = $3, image_url = $4, 
                tag_type = $5, tag_text = $6, product_link = $7, is_active = $8, 
                updated_at = CURRENT_TIMESTAMP
            WHERE listing_id = $9
            RETURNING *
        `, [title, description, price, image_url, tag_type, tag_text, product_link, is_active, listing_id]);
        
        if (homepageResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // 2. Update product_details table (for images and extended data)
        const productId = parseInt(listing_id.split('-')[1]);
        if (productId) {
            // Build dynamic update for product_details
            const updateFields = [];
            const queryParams = [];

            // Always update these core fields
            updateFields.push('title = $' + (queryParams.length + 1));
            queryParams.push(title);

            updateFields.push('current_price = $' + (queryParams.length + 1));
            queryParams.push(price);

            updateFields.push('updated_at = CURRENT_TIMESTAMP');

            // Add other fields if provided
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
            if (detailed_description !== undefined) {
                updateFields.push('historical_description = $' + (queryParams.length + 1));
                queryParams.push(detailed_description);
            }
            if (original_price !== undefined) {
                updateFields.push('week_low = $' + (queryParams.length + 1));
                queryParams.push(original_price);
            }
            if (stock_quantity !== undefined) {
                updateFields.push('week_high = $' + (queryParams.length + 1));
                queryParams.push(stock_quantity);
            }
            if (toggle_settings !== undefined) {
                updateFields.push('toggle_settings = $' + (queryParams.length + 1));
                queryParams.push(JSON.stringify(toggle_settings));
            }

            const updateQuery = `
                UPDATE product_details SET
                    ${updateFields.join(', ')}
                WHERE product_id = $${queryParams.length + 1}
            `;
            queryParams.push(productId);

            await query(updateQuery, queryParams);
        }

        res.json({ success: true, message: 'Listing updated successfully', data: { listing: homepageResult.rows[0] } });
    } catch (error) {
        console.error('Update homepage listing error:', error);
        res.status(500).json({ success: false, message: 'Failed to update listing', error: error.message });
    }
});

// 2. PRODUCT DETAILS API (for product detail page)
app.get('/api/product-details/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { query } = require('./config/database');
        const result = await query('SELECT * FROM product_details WHERE product_id = $1', [productId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: { product: result.rows[0] } });
    } catch (error) {
        console.error('Get product details error:', error);
        res.status(500).json({ success: false, message: 'Failed to get product details', error: error.message });
    }
});

app.put('/api/product-details/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { query } = require('./config/database');

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
            historical_description: 'historical_description',
            expert_quote: 'expert_quote',
            expert_name: 'expert_name',
            expert_rating: 'expert_rating',
            product_type: 'product_type',
            available_sizes: 'available_sizes',
            size_chart_url: 'size_chart_url',
            toggle_settings: 'toggle_settings',
            is_active: 'is_active'
        };

        Object.entries(fieldMappings).forEach(([requestField, dbField]) => {
            if (req.body[requestField] !== undefined) {
                updateFields.push(`${dbField} = $${queryParams.length + 1}`);
                if (requestField === 'toggle_settings' || requestField === 'available_sizes') {
                    queryParams.push(JSON.stringify(req.body[requestField]));
                } else {
                    queryParams.push(req.body[requestField]);
                }
            }
        });

        const updateQuery = `
            UPDATE product_details SET
                ${updateFields.join(', ')}
            WHERE product_id = $${queryParams.length + 1}
        `;
        queryParams.push(productId);

        const result = await query(updateQuery, queryParams);

        res.json({ success: true, message: 'Product details updated successfully', data: { product: result.rows[0] } });
    } catch (error) {
        console.error('Update product details error:', error);
        res.status(500).json({ success: false, message: 'Failed to update product details', error: error.message });
    }
});

// 3. GET ALL PRODUCT DETAILS (for frontend merging)
app.get('/api/product-details/all', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const result = await query('SELECT * FROM product_details ORDER BY product_id');
        res.json({ success: true, data: { products: result.rows } });
    } catch (error) {
        console.error('Get all product details error:', error);
        res.status(500).json({ success: false, message: 'Failed to get product details', error: error.message });
    }
});

// ========================================
// ROUTES
// ========================================

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin dashboard
app.get('/homepage-listings', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'homepage-listings.html'));
});

// Product detail page
app.get('/pages/product_detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'product_detail.html'));
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ========================================
// SERVER STARTUP
// ========================================

const startServer = async () => {
    try {
        console.log('🔄 Testing database connection...');
        await initializeDatabase();
        console.log('✅ Database initialized successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🏎️ Hot Wheels Velocity server running on port ${PORT}`);
            console.log(`🌐 Frontend: http://0.0.0.0:${PORT}`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('🚀 Server ready to accept connections on all interfaces');
            console.log('📊 Database connected and ready');
            console.log('🎯 HYBRID APPROACH ACTIVE - BEST OF BOTH SOLUTIONS!');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
