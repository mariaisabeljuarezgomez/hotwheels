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
const multer = require('multer');

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

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'HOT_WHEELS_IMAGES'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ========================================
// HEALTH CHECK ENDPOINT (for Railway deployment)
// ========================================
app.get('/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Hot Wheels Velocity API is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'API is working',
        timestamp: new Date().toISOString()
    });
});

// ========================================
// HYBRID API ENDPOINTS
// ========================================

// 1. HOMEPAGE LISTINGS (using existing table but with JOIN for images)
app.get('/api/homepage-listings', async (req, res) => {
    try {
        const { query } = require('./config/database');
        const result = await query(`
            SELECT hl.*
            FROM homepage_listings hl
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
        const productId = req.params.id;
        const { query } = require('./config/database');
        
        console.log('🔍 Product detail request for ID:', productId);
        
        // Get from homepage_listings using the listing_id
        let result = await query('SELECT * FROM homepage_listings WHERE listing_id = $1', [productId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        console.log('✅ Found product:', result.rows[0].title);
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

// 4. IMAGE UPLOAD ENDPOINTS
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const imageUrl = `/HOT_WHEELS_IMAGES/${req.file.filename}`;
        
        res.json({
            success: true,
            data: { imageUrl: imageUrl }
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
});

app.post('/api/upload-homepage-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const imageUrl = `/HOT_WHEELS_IMAGES/${req.file.filename}`;
        
        res.json({
            success: true,
            data: { imageUrl: imageUrl }
        });
    } catch (error) {
        console.error('Error uploading homepage image:', error);
        res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
});

// 5. UPDATE HOMEPAGE LISTING (for saving changes)
app.post('/api/homepage-listings/update', async (req, res) => {
    try {
        console.log('Update request received:', req.body);
        const { query } = require('./config/database');
        const { listingId, updates } = req.body;
        
        if (!listingId || !updates) {
            return res.status(400).json({ success: false, message: 'Missing listingId or updates' });
        }
        
        // Update homepage_listings table
        const homepageUpdateFields = [];
        const homepageValues = [];
        let paramCount = 1;
        
        if (updates.title !== undefined) {
            homepageUpdateFields.push(`title = $${paramCount++}`);
            homepageValues.push(updates.title);
        }
        if (updates.description !== undefined) {
            homepageUpdateFields.push(`description = $${paramCount++}`);
            homepageValues.push(updates.description);
        }
        if (updates.price !== undefined) {
            homepageUpdateFields.push(`price = $${paramCount++}`);
            homepageValues.push(updates.price);
        }
        if (updates.image_url !== undefined) {
            homepageUpdateFields.push(`image_url = $${paramCount++}`);
            homepageValues.push(updates.image_url);
        }
        if (updates.main_image_url !== undefined) {
            homepageUpdateFields.push(`main_image_url = $${paramCount++}`);
            homepageValues.push(updates.main_image_url);
        }
        if (updates.thumbnail_1_url !== undefined) {
            homepageUpdateFields.push(`thumbnail_1_url = $${paramCount++}`);
            homepageValues.push(updates.thumbnail_1_url);
        }
        if (updates.thumbnail_2_url !== undefined) {
            homepageUpdateFields.push(`thumbnail_2_url = $${paramCount++}`);
            homepageValues.push(updates.thumbnail_2_url);
        }
        if (updates.thumbnail_3_url !== undefined) {
            homepageUpdateFields.push(`thumbnail_3_url = $${paramCount++}`);
            homepageValues.push(updates.thumbnail_3_url);
        }
        if (updates.thumbnail_4_url !== undefined) {
            homepageUpdateFields.push(`thumbnail_4_url = $${paramCount++}`);
            homepageValues.push(updates.thumbnail_4_url);
        }
        if (updates.product_type !== undefined) {
            homepageUpdateFields.push(`product_type = $${paramCount++}`);
            homepageValues.push(updates.product_type);
        }
        if (updates.available_sizes !== undefined) {
            homepageUpdateFields.push(`available_sizes = $${paramCount++}`);
            homepageValues.push(JSON.stringify(updates.available_sizes));
        }
        if (updates.toggle_settings !== undefined) {
            homepageUpdateFields.push(`toggle_settings = $${paramCount++}`);
            homepageValues.push(JSON.stringify(updates.toggle_settings));
        }
        if (updates.tumbler_guide_title !== undefined) {
            homepageUpdateFields.push(`tumbler_guide_title = $${paramCount++}`);
            homepageValues.push(updates.tumbler_guide_title);
        }
        if (updates.tumbler_guide_data !== undefined) {
            homepageUpdateFields.push(`tumbler_guide_data = $${paramCount++}`);
            homepageValues.push(updates.tumbler_guide_data);
        }
        if (updates.specifications !== undefined) {
            homepageUpdateFields.push(`specifications = $${paramCount++}`);
            homepageValues.push(JSON.stringify(updates.specifications));
        }
        if (updates.historical_description !== undefined) {
            homepageUpdateFields.push(`historical_description = $${paramCount++}`);
            homepageValues.push(updates.historical_description);
        }
        if (updates.expert_quote !== undefined) {
            homepageUpdateFields.push(`expert_quote = $${paramCount++}`);
            homepageValues.push(updates.expert_quote);
        }
        if (updates.subtitle !== undefined) {
            homepageUpdateFields.push(`subtitle = $${paramCount++}`);
            homepageValues.push(updates.subtitle);
        }
        if (updates.detailed_description !== undefined) {
            homepageUpdateFields.push(`detailed_description = $${paramCount++}`);
            homepageValues.push(updates.detailed_description);
        }
        if (updates.original_price !== undefined) {
            homepageUpdateFields.push(`original_price = $${paramCount++}`);
            homepageValues.push(updates.original_price);
        }
        if (updates.stock_quantity !== undefined) {
            homepageUpdateFields.push(`stock_quantity = $${paramCount++}`);
            homepageValues.push(updates.stock_quantity);
        }
        
        if (homepageUpdateFields.length > 0) {
            homepageValues.push(listingId);
            const homepageQuery = `UPDATE homepage_listings SET ${homepageUpdateFields.join(', ')} WHERE listing_id = $${homepageValues.length}`;
            console.log('Executing homepage query:', homepageQuery, homepageValues);
            await query(homepageQuery, homepageValues);
            console.log('Homepage update successful');
        }
        
        // Update product_details table (only for exclusive listings with valid numeric IDs)
        let productId = null;
        if (listingId.startsWith('exclusive-')) {
            const extractedId = listingId.replace('exclusive-', '');
            if (!isNaN(extractedId) && extractedId !== '') {
                productId = extractedId;
            }
        }
        // Skip product_details update for featured listings as they don't have corresponding product records
        
        const productUpdateFields = [];
        const productValues = [];
        paramCount = 1;
        
        if (updates.main_image_url !== undefined) {
            productUpdateFields.push(`main_image_url = $${paramCount++}`);
            productValues.push(updates.main_image_url);
        }
        if (updates.thumbnail_1_url !== undefined) {
            productUpdateFields.push(`thumbnail_1_url = $${paramCount++}`);
            productValues.push(updates.thumbnail_1_url);
        }
        if (updates.thumbnail_2_url !== undefined) {
            productUpdateFields.push(`thumbnail_2_url = $${paramCount++}`);
            productValues.push(updates.thumbnail_2_url);
        }
        if (updates.thumbnail_3_url !== undefined) {
            productUpdateFields.push(`thumbnail_3_url = $${paramCount++}`);
            productValues.push(updates.thumbnail_3_url);
        }
        if (updates.thumbnail_4_url !== undefined) {
            productUpdateFields.push(`thumbnail_4_url = $${paramCount++}`);
            productValues.push(updates.thumbnail_4_url);
        }
        if (updates.toggle_settings !== undefined) {
            productUpdateFields.push(`toggle_settings = $${paramCount++}`);
            productValues.push(JSON.stringify(updates.toggle_settings));
        }
        
        if (productUpdateFields.length > 0 && productId && !isNaN(productId)) {
            productValues.push(productId);
            const productQuery = `UPDATE product_details SET ${productUpdateFields.join(', ')} WHERE product_id = $${productValues.length}`;
            console.log('Executing product query:', productQuery, productValues);
            await query(productQuery, productValues);
            console.log('Product update successful');
        } else if (productUpdateFields.length > 0) {
            console.log('Skipping product_details update - no valid productId for listing:', listingId);
        }
        
        res.json({
            success: true,
            message: 'Listing updated successfully'
        });
    } catch (error) {
        console.error('Error updating listing:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            listingId: req.body?.listingId,
            updates: req.body?.updates
        });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update listing',
            error: error.message 
        });
    }
});

// Test endpoint
app.post('/api/test-update', (req, res) => {
    console.log('Test update received:', req.body);
    res.json({ success: true, message: 'Test endpoint working', received: req.body });
});

// ========================================
// ROUTES
// ========================================

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin login page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin-login.html'));
});

// Admin main page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin.html'));
});

// Admin dashboard
app.get('/homepage-listings', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'homepage-listings.html'));
});

// Admin uploads page
app.get('/admin-uploads', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin-uploads.html'));
});

// Product detail page
app.get('/pages/product_detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'product_detail.html'));
});

// Additional admin pages
app.get('/admin-access', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin-access.html'));
});

app.get('/category-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'category-management.html'));
});

// Customer pages
app.get('/checkout_experience', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'checkout_experience.html'));
});

app.get('/collection_browser', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'collection_browser.html'));
});

app.get('/collector_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'collector_dashboard.html'));
});

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'homepage.html'));
});

app.get('/about_hot_wheels_velocity', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'about_hot_wheels_velocity.html'));
});

app.get('/product-1', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'product-1.html'));
});

// Temporary endpoint to add missing columns
app.post('/api/add-columns', async (req, res) => {
    try {
        const alterQuery = `
            ALTER TABLE homepage_listings 
            ADD COLUMN IF NOT EXISTS product_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS available_sizes JSONB,
            ADD COLUMN IF NOT EXISTS toggle_settings JSONB,
            ADD COLUMN IF NOT EXISTS specifications JSONB,
            ADD COLUMN IF NOT EXISTS historical_description TEXT,
            ADD COLUMN IF NOT EXISTS expert_quote TEXT,
            ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
        `;
        
        await query(alterQuery);
        console.log('✅ Added missing columns to homepage_listings');
        
        res.json({ success: true, message: 'Columns added successfully' });
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        res.status(500).json({ success: false, message: 'Failed to add columns', error: error.message });
    }
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
