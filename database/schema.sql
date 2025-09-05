-- Hot Wheels Velocity Database Schema
-- PostgreSQL Database Tables for eCommerce Platform

-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- Categories for Hot Wheels products
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    parent_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hot Wheels products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    weight DECIMAL(8,2),
    dimensions VARCHAR(100), -- "L x W x H"
    material VARCHAR(100),
    color VARCHAR(50),
    year_released INTEGER,
    series VARCHAR(100),
    collection VARCHAR(100),
    rarity_level VARCHAR(50), -- 'Common', 'Rare', 'Ultra Rare', 'Treasure Hunt'
    condition_rating DECIMAL(3,1) DEFAULT 5.0, -- 1.0 to 10.0
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    
    -- Current Market Value & Investment Data
    market_value DECIMAL(10,2),
    price_change_percentage DECIMAL(5,2),
    investment_grade VARCHAR(10), -- 'A+', 'A', 'B+', 'B', 'C'
    last_price_update DATE,
    week_low DECIMAL(10,2),
    week_high DECIMAL(10,2),
    avg_sale_price DECIMAL(10,2),
    
    -- Expert Authentication
    expert_authenticated BOOLEAN DEFAULT FALSE,
    certificate_number VARCHAR(100),
    authenticated_by VARCHAR(255),
    
    -- Detailed Specifications
    production_year INTEGER,
    casting VARCHAR(255),
    spectraflame_color VARCHAR(100),
    tampo VARCHAR(255),
    wheel_type VARCHAR(100),
    country_of_origin VARCHAR(100),
    condition_description VARCHAR(100),
    
    -- Premium Services
    professional_grading BOOLEAN DEFAULT FALSE,
    grading_price DECIMAL(8,2),
    custom_display_case BOOLEAN DEFAULT FALSE,
    display_case_price DECIMAL(8,2),
    insurance_valuation BOOLEAN DEFAULT FALSE,
    insurance_price DECIMAL(8,2),
    
    -- Product Status Tags
    ultra_rare BOOLEAN DEFAULT FALSE,
    mint_condition BOOLEAN DEFAULT FALSE,
    investment_grade_tag BOOLEAN DEFAULT FALSE,
    limited_edition BOOLEAN DEFAULT FALSE,
    original_packaging BOOLEAN DEFAULT FALSE,
    certified_authentic BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product categories (many-to-many)
CREATE TABLE IF NOT EXISTS product_categories (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Homepage listings for featured and exclusive collections
CREATE TABLE IF NOT EXISTS homepage_listings (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(50) UNIQUE NOT NULL, -- featured-1, featured-2, etc.
    section VARCHAR(20) NOT NULL, -- 'featured' or 'exclusive'
    position INTEGER NOT NULL, -- 1, 2, 3 for ordering
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    main_image_url VARCHAR(500),
    thumbnail_1_url VARCHAR(500),
    thumbnail_2_url VARCHAR(500),
    thumbnail_3_url VARCHAR(500),
    thumbnail_4_url VARCHAR(500),
    tag_type VARCHAR(50) NOT NULL, -- 'ultra-rare', 'rlc-exclusive', etc.
    tag_text VARCHAR(100), -- custom tag text if different from default
    product_link VARCHAR(500), -- link to product detail page
    product_type VARCHAR(50), -- 'hot-wheels', 't-shirt', 'hat', 'tumbler'
    available_sizes JSONB, -- Array of available sizes for apparel
    toggle_settings JSONB, -- Settings for toggles (colors, sizes, etc.)
    tumbler_guide_title VARCHAR(255), -- Title for tumbler size guide
    tumbler_guide_data JSONB, -- Tumbler size guide data (sizes and dimensions)
    specifications JSONB, -- Product specifications
    historical_description TEXT, -- Historical context
    expert_quote TEXT, -- Expert commentary
    subtitle VARCHAR(255), -- Product subtitle
    detailed_description TEXT, -- Detailed product description
    original_price DECIMAL(10,2), -- Original price before discount
    stock_quantity INTEGER, -- Stock quantity
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tumbler guide fields to existing homepage_listings table
ALTER TABLE homepage_listings 
ADD COLUMN IF NOT EXISTS tumbler_guide_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS tumbler_guide_data JSONB;

-- Individual product detail pages (product-1.html to product-6.html)
CREATE TABLE IF NOT EXISTS product_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL, -- 1, 2, 3, 4, 5, 6
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    main_image_url VARCHAR(500) NOT NULL,
    thumbnail_1_url VARCHAR(500),
    thumbnail_2_url VARCHAR(500),
    thumbnail_3_url VARCHAR(500),
    thumbnail_4_url VARCHAR(500),
    
    -- Pricing & Market Data
    current_price DECIMAL(10,2) NOT NULL,
    price_change_percentage DECIMAL(5,2),
    investment_grade VARCHAR(10),
    week_low DECIMAL(10,2),
    week_high DECIMAL(10,2),
    avg_sale_price DECIMAL(10,2),
    
    -- Product Tags
    primary_tag VARCHAR(50) NOT NULL,
    primary_tag_text VARCHAR(100),
    secondary_tag VARCHAR(50),
    secondary_tag_text VARCHAR(100),
    
    -- Authentication
    expert_authenticated BOOLEAN DEFAULT FALSE,
    certificate_number VARCHAR(100),
    authenticated_by VARCHAR(255),
    
    -- Specifications
    production_year INTEGER,
    series VARCHAR(100),
    casting VARCHAR(255),
    color VARCHAR(100),
    tampo VARCHAR(255),
    wheels VARCHAR(100),
    country VARCHAR(100),
    condition_rating DECIMAL(3,1),
    condition_description VARCHAR(100),
    
    -- Premium Services
    professional_grading BOOLEAN DEFAULT FALSE,
    grading_price DECIMAL(8,2),
    custom_display_case BOOLEAN DEFAULT FALSE,
    display_case_price DECIMAL(8,2),
    insurance_valuation BOOLEAN DEFAULT FALSE,
    insurance_price DECIMAL(8,2),
    
    -- Historical Context
    production_run VARCHAR(100),
    mint_survivors VARCHAR(100),
    designer VARCHAR(255),
    historical_description TEXT,
    
    -- Expert Commentary
    expert_quote TEXT,
    expert_name VARCHAR(255),
    expert_rating DECIMAL(3,1),
    
    -- Investment Analysis
    five_year_growth DECIMAL(5,2),
    liquidity VARCHAR(50),
    market_demand VARCHAR(50),
    risk_level VARCHAR(50),
    
    -- Reviews
    review_1_author VARCHAR(255),
    review_1_rating INTEGER,
    review_1_text TEXT,
    review_1_verified BOOLEAN DEFAULT FALSE,
    review_1_date DATE,
    
    review_2_author VARCHAR(255),
    review_2_rating INTEGER,
    review_2_text TEXT,
    review_2_verified BOOLEAN DEFAULT FALSE,
    review_2_date DATE,
    
    review_3_author VARCHAR(255),
    review_3_rating INTEGER,
    review_3_text TEXT,
    review_3_verified BOOLEAN DEFAULT FALSE,
    review_3_date DATE,
    
    -- Apparel & Product Type
    product_type VARCHAR(50) DEFAULT 'hot-wheels', -- 'hot-wheels', 't-shirt', 'hat', 'tumbler'
    available_sizes JSONB, -- Array of available sizes for apparel
    size_chart_url VARCHAR(500), -- URL to size chart for apparel
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest users
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time DECIMAL(10,2) NOT NULL, -- Store price when added to cart
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    UNIQUE(session_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE,
    user_id VARCHAR(255) REFERENCES users(id),
    session_id VARCHAR(255) NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL, -- Store product name at time of order
    product_sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User collections (wishlist/favorites)
CREATE TABLE IF NOT EXISTS user_collections (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection items
CREATE TABLE IF NOT EXISTS collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES user_collections(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, product_id)
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Coupons and discounts
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
    value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Insert sample categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Redline Collection', 'redline-collection', 'Classic 1968-1977 Redline Hot Wheels', 1),
('Modern Mainline', 'modern-mainline', 'Current Hot Wheels mainline series', 2),
('Premium Series', 'premium-series', 'Premium Hot Wheels with special features', 3),
('Treasure Hunts', 'treasure-hunts', 'Rare Treasure Hunt and Super Treasure Hunt cars', 4),
('Team Transport', 'team-transport', 'Hot Wheels Team Transport sets', 5),
('Car Culture', 'car-culture', 'Car Culture premium series', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, short_description, sku, price, stock_quantity, year_released, series, rarity_level, is_featured) VALUES
('1968 Redline Custom Camaro', '1968-redline-custom-camaro', 'The iconic first-year Redline Hot Wheels Custom Camaro in Spectraflame Red. This legendary casting started it all in 1968.', 'First-year Redline Custom Camaro in Spectraflame Red', 'HW-1968-001', 299.99, 5, 1968, 'Redline', 'Ultra Rare', true),
('2024 Nissan Skyline GT-R', '2024-nissan-skyline-gtr', 'Modern Hot Wheels casting of the legendary Nissan Skyline GT-R with premium details and authentic styling.', 'Premium Nissan Skyline GT-R with authentic details', 'HW-2024-001', 12.99, 25, 2024, 'Car Culture', 'Common', true),
('Treasure Hunt Batmobile', 'treasure-hunt-batmobile', 'Rare Treasure Hunt version of the Batmobile with special paint and hidden TH logo.', 'Rare Treasure Hunt Batmobile with special features', 'HW-TH-001', 89.99, 2, 2024, 'Treasure Hunt', 'Rare', true),
('Team Transport Porsche 911', 'team-transport-porsche-911', 'Premium Team Transport set featuring a Porsche 911 on a custom trailer with premium details.', 'Team Transport Porsche 911 with custom trailer', 'HW-TT-001', 24.99, 15, 2024, 'Team Transport', 'Common', false),
('Super Treasure Hunt Lamborghini', 'super-treasure-hunt-lamborghini', 'Ultra-rare Super Treasure Hunt Lamborghini with Spectraflame paint and Real Riders wheels.', 'Super Treasure Hunt Lamborghini with premium features', 'HW-STH-001', 199.99, 1, 2024, 'Super Treasure Hunt', 'Ultra Rare', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert product images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1, '../HOT_WHEELS_IMAGES/hot-wheels-1.jpeg', '1968 Redline Custom Camaro - Main View', true, 1),
(1, '../HOT_WHEELS_IMAGES/hot-wheels-2.jpeg', '1968 Redline Custom Camaro - Side View', false, 2),
(2, '../HOT_WHEELS_IMAGES/hot-wheels-3.jpeg', '2024 Nissan Skyline GT-R - Front View', true, 1),
(2, '../HOT_WHEELS_IMAGES/hot-wheels-4.jpeg', '2024 Nissan Skyline GT-R - Side View', false, 2),
(3, '../HOT_WHEELS_IMAGES/hot-wheels-5.jpeg', 'Treasure Hunt Batmobile - Main View', true, 1),
(4, '../HOT_WHEELS_IMAGES/hot-wheels-6.jpg', 'Team Transport Porsche 911 - Main View', true, 1),
(5, '../HOT_WHEELS_IMAGES/hot-wheels-7.jpeg', 'Super Treasure Hunt Lamborghini - Main View', true, 1)
ON CONFLICT DO NOTHING;

-- Insert product categories
INSERT INTO product_categories (product_id, category_id) VALUES
(1, 1), -- Redline Custom Camaro -> Redline Collection
(2, 6), -- Nissan Skyline -> Car Culture
(3, 4), -- Batmobile -> Treasure Hunts
(4, 5), -- Porsche 911 -> Team Transport
(5, 4)  -- Lamborghini -> Treasure Hunts
ON CONFLICT DO NOTHING;

-- Insert sample homepage listings with section data
INSERT INTO homepage_listings (listing_id, section, position, title, description, price, image_url, tag_type, tag_text, product_link, product_type, available_sizes, toggle_settings, specifications, historical_description, expert_quote, subtitle, main_image_url, thumbnail_1_url, thumbnail_2_url, thumbnail_3_url, thumbnail_4_url) VALUES
('featured-1', 'featured', 1, 'Hot Wheels 2025 Formula 1 Race Team Sergio Perez Oracle Red Bull F1 Racing', 'The 2025 Hot Wheels Premium Formula 1 2024 Oracle Red Bull Racing – RB20 (#11) is a 1:64 scale die-cast car by Hot Wheels, featuring a sleek blue F1-style design. This model is part of the Formula 1 series and showcases the Red Bull Racing team with driver Sergio Perez. It is a highly detailed and accurate replica of the 2024 season RB20 car, making it a perfect piece for collectors and Formula 1 racing fans.', 25.00, '/HOT_WHEELS_IMAGES/image-1757053736878-157461431.jpg', 'rlc-exclusive', 'Formula 1 2024 Oracle Red Bull Racing', 'product_detail.html?id=featured-1', 'hot-wheels', '["1:64 Scale"]', '{"colors": ["Red", "Blue"], "sizes": ["1:64 Scale"]}', '{"Scale": "1:64", "Material": "Die-cast", "Brand": "Hot Wheels", "Series": "Formula 1", "Year": "2025"}', 'This is a detailed historical description for the Hot Wheels Formula 1 car.', 'An exceptional piece for any F1 collector!', '2025 Oracle Red Bull Racing', '/HOT_WHEELS_IMAGES/image-1757053736878-157461431.jpg', '/HOT_WHEELS_IMAGES/image-1757053736878-157461431.jpg', '/HOT_WHEELS_IMAGES/image-1757053736896-189403107.jpg', '/HOT_WHEELS_IMAGES/image-1757053736906-677945102.jpg', '/HOT_WHEELS_IMAGES/image-1757053736920-348577233.jpg'),
('featured-2', 'featured', 2, '2023 RLC Exclusive McLaren', 'Limited edition with certificate', 89.00, '/uploads/homepage-images/homepage-undefined-1756958044320-867261409.jpg', 'rlc-exclusive', 'RLC EXCLUSIVE', 'product_detail.html?id=featured-2', 'hot-wheels', '["1:64 Scale"]', '{"colors": ["Orange", "Black"], "sizes": ["1:64 Scale"]}', '{"Scale": "1:64", "Material": "Die-cast", "Brand": "Hot Wheels", "Series": "RLC Exclusive", "Year": "2023"}', 'This McLaren represents the pinnacle of Hot Wheels collecting.', 'A must-have for any serious collector.', '2023 RLC Exclusive McLaren', NULL, NULL, NULL, NULL, NULL),
('featured-3', 'featured', 3, '2024 Treasure Hunt Mustang', 'Super Treasure Hunt variant', 156.00, '/uploads/homepage-images/homepage-undefined-1756958068486-246628207.jpg', 'treasure-hunt', 'TREASURE HUNT', 'product_detail.html?id=featured-3', 'hot-wheels', '["1:64 Scale"]', '{"colors": ["Spectraflame", "Chrome"], "sizes": ["1:64 Scale"]}', '{"Scale": "1:64", "Material": "Die-cast", "Brand": "Hot Wheels", "Series": "Treasure Hunt", "Year": "2024"}', 'The legendary Mustang in Treasure Hunt form.', 'Rare and highly sought after.', '2024 Treasure Hunt Mustang', NULL, NULL, NULL, NULL, NULL),
('exclusive-1', 'exclusive', 1, 'Hot Wheels x Kenny Scharf Black T-Shirt', 'This heavyweight Hot Wheels x Kenny Scharf Black T-shirt is one of the most comfortable shirts around, and made with special attention to durability and longevity.', 70.00, '/HOT_WHEELS_IMAGES/homepage-undefined-1757001557783-440192252.jpg', 'premium', 'BLACK T SHIRT', 'product_detail.html?id=exclusive-1', 't-shirt', '["S", "M", "L", "XL", "XXL"]', '{"colors": ["Black", "White"], "sizes": ["S", "M", "L", "XL"]}', '{"Material": "100% Cotton", "Weight": "Heavyweight", "Brand": "Hot Wheels x Kenny Scharf", "Style": "T-Shirt"}', 'A collaboration between Hot Wheels and renowned artist Kenny Scharf.', 'Art meets automotive culture in this exclusive design.', 'Hot Wheels x Kenny Scharf', NULL, NULL, NULL, NULL, NULL),
('exclusive-2', 'exclusive', 2, 'Hot Wheels x Kenny Scharf White Tumbler', 'Enjoy hot or cold drinks on the go with our stylish stainless steel Hot Wheels x Kenny Scharf White Tumbler. This reusable tumbler with a metal straw is a perfect combo for hot or cold drinks at any time of the day. This exclusive design is only available through Mattel Creations.', 45.00, '/uploads/homepage-images/homepage-undefined-1756958159145-849427263.jpg', 'premium', 'RLC EXCLUSIVE', 'product_detail.html?id=exclusive-2', 'tumbler', '["One Size"]', '{"colors": ["White", "Black"], "sizes": ["One Size"]}', '{"Material": "Stainless Steel", "Capacity": "20oz", "Brand": "Hot Wheels x Kenny Scharf", "Style": "Tumbler with Straw"}', 'Perfect for the Hot Wheels collector on the go.', 'Style meets functionality.', 'Hot Wheels x Kenny Scharf Tumbler', NULL, NULL, NULL, NULL, NULL),
('exclusive-3', 'exclusive', 3, 'Hot Wheels x Kenny Scharf Black Embroidered Dad Hat', 'Upgrade your style with our Hot Wheels x Kenny Scharf Black Embroidered Dad Hat, the perfect blend of classic design and modern comfort. This hat features a sleek, low-profile fit that sits comfortably on your head, making it ideal for everyday wear.', 50.00, '/uploads/homepage-images/homepage-undefined-1756958270026-271653793.jpg', 'premium', 'TREASURE HUNT', 'product_detail.html?id=exclusive-3', 'hat', '["One Size Fits Most"]', '{"colors": ["Black", "White"], "sizes": ["One Size Fits Most"]}', '{"Material": "Cotton", "Style": "Dad Hat", "Brand": "Hot Wheels x Kenny Scharf", "Embroidered": "Yes"}', 'The perfect cap for the Hot Wheels enthusiast.', 'Comfort and style combined.', 'Hot Wheels x Kenny Scharf Dad Hat', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (listing_id) DO UPDATE SET
    product_type = EXCLUDED.product_type,
    available_sizes = EXCLUDED.available_sizes,
    toggle_settings = EXCLUDED.toggle_settings,
    specifications = EXCLUDED.specifications,
    historical_description = EXCLUDED.historical_description,
    expert_quote = EXCLUDED.expert_quote,
    subtitle = EXCLUDED.subtitle,
    main_image_url = EXCLUDED.main_image_url,
    thumbnail_1_url = EXCLUDED.thumbnail_1_url,
    thumbnail_2_url = EXCLUDED.thumbnail_2_url,
    thumbnail_3_url = EXCLUDED.thumbnail_3_url,
    thumbnail_4_url = EXCLUDED.thumbnail_4_url;
