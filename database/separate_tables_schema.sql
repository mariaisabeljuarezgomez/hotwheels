-- SEPARATE TABLES SCHEMA - NO MORE CONFLICTS!
-- Each section gets its own dedicated table

-- 1. HOMEPAGE LISTINGS TABLE (for homepage cards)
CREATE TABLE IF NOT EXISTS homepage_cards (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(50) UNIQUE NOT NULL,
    section VARCHAR(20) NOT NULL,
    position INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    tag_type VARCHAR(50) NOT NULL,
    tag_text VARCHAR(100),
    product_link VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BASIC INFORMATION TABLE (for basic product info)
CREATE TABLE IF NOT EXISTS basic_information (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    tag_type VARCHAR(50) NOT NULL,
    tag_text VARCHAR(100),
    product_link VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. EXTENDED PRODUCT DETAILS TABLE (for detailed product info)
CREATE TABLE IF NOT EXISTS extended_product_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    subtitle TEXT,
    original_price NUMERIC(10,2),
    stock_quantity INTEGER,
    detailed_description TEXT,
    toggle_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCT IMAGES TABLE (for all product images)
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    main_image_url VARCHAR(500),
    thumbnail_1_url VARCHAR(500),
    thumbnail_2_url VARCHAR(500),
    thumbnail_3_url VARCHAR(500),
    thumbnail_4_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCT FEATURES TABLE (for product features)
CREATE TABLE IF NOT EXISTS product_features (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PRODUCT SPECIFICATIONS TABLE (for technical specs)
CREATE TABLE IF NOT EXISTS product_specifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. MARKET VALUE TABLE (for investment data)
CREATE TABLE IF NOT EXISTS market_value_data (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    market_value NUMERIC(10,2),
    price_change_percentage NUMERIC(5,2),
    investment_grade VARCHAR(10),
    week_low NUMERIC(10,2),
    week_high NUMERIC(10,2),
    avg_sale_price NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. EXPERT AUTHENTICATION TABLE (for authentication data)
CREATE TABLE IF NOT EXISTS expert_authentication (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    expert_authenticated BOOLEAN DEFAULT FALSE,
    certificate_number VARCHAR(100),
    authenticated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. DETAILED SPECIFICATIONS TABLE (for detailed specs)
CREATE TABLE IF NOT EXISTS detailed_specifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    production_year INTEGER,
    series VARCHAR(100),
    casting VARCHAR(255),
    color VARCHAR(100),
    tampo VARCHAR(255),
    wheels VARCHAR(100),
    country VARCHAR(100),
    condition_rating NUMERIC(3,1),
    condition_description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. PREMIUM SERVICES TABLE (for premium services)
CREATE TABLE IF NOT EXISTS premium_services (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    professional_grading BOOLEAN DEFAULT FALSE,
    grading_price NUMERIC(8,2),
    custom_display_case BOOLEAN DEFAULT FALSE,
    display_case_price NUMERIC(8,2),
    insurance_valuation BOOLEAN DEFAULT FALSE,
    insurance_price NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. STATUS TAGS TABLE (for product status)
CREATE TABLE IF NOT EXISTS status_tags (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    ultra_rare BOOLEAN DEFAULT FALSE,
    mint_condition BOOLEAN DEFAULT FALSE,
    investment_grade_tag BOOLEAN DEFAULT FALSE,
    limited_edition BOOLEAN DEFAULT FALSE,
    original_packaging BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. HISTORICAL CONTEXT TABLE (for historical data)
CREATE TABLE IF NOT EXISTS historical_context (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    historical_description TEXT,
    expert_quote TEXT,
    expert_name VARCHAR(255),
    expert_rating NUMERIC(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. APPAREL DATA TABLE (for clothing sizes)
CREATE TABLE IF NOT EXISTS apparel_data (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    available_sizes JSONB DEFAULT '{}',
    size_chart_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_homepage_cards_listing_id ON homepage_cards(listing_id);
CREATE INDEX IF NOT EXISTS idx_basic_info_product_id ON basic_information(product_id);
CREATE INDEX IF NOT EXISTS idx_extended_details_product_id ON extended_product_details(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_product_id ON product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_market_value_product_id ON market_value_data(product_id);
CREATE INDEX IF NOT EXISTS idx_expert_auth_product_id ON expert_authentication(product_id);
CREATE INDEX IF NOT EXISTS idx_detailed_specs_product_id ON detailed_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_premium_services_product_id ON premium_services(product_id);
CREATE INDEX IF NOT EXISTS idx_status_tags_product_id ON status_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_historical_context_product_id ON historical_context(product_id);
CREATE INDEX IF NOT EXISTS idx_apparel_data_product_id ON apparel_data(product_id);
