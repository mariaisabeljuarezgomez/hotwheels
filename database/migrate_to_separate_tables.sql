-- MIGRATION SCRIPT: Move data from conflicting tables to separate tables
-- This eliminates ALL conflicts between sections

-- 1. Create the new separate tables
\i separate_tables_schema.sql

-- 2. Migrate data from homepage_listings to homepage_cards
INSERT INTO homepage_cards (listing_id, section, position, title, description, price, image_url, tag_type, tag_text, product_link, is_active, created_at, updated_at)
SELECT 
    listing_id, 
    section, 
    position, 
    title, 
    description, 
    price, 
    image_url, 
    tag_type, 
    tag_text, 
    product_link, 
    is_active, 
    created_at, 
    updated_at
FROM homepage_listings
ON CONFLICT (listing_id) DO NOTHING;

-- 3. Migrate data from product_details to basic_information
INSERT INTO basic_information (product_id, title, description, price, image_url, tag_type, tag_text, product_link, is_active, created_at, updated_at)
SELECT 
    product_id,
    title,
    COALESCE(historical_description, 'No description available') as description,
    current_price as price,
    main_image_url as image_url,
    primary_tag as tag_type,
    primary_tag_text as tag_text,
    CONCAT('product_detail.html?id=', product_id) as product_link,
    is_active,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 4. Migrate extended details to extended_product_details
INSERT INTO extended_product_details (product_id, subtitle, original_price, stock_quantity, detailed_description, toggle_settings, created_at, updated_at)
SELECT 
    product_id,
    subtitle,
    NULL as original_price, -- This field doesn't exist in product_details
    NULL as stock_quantity, -- This field doesn't exist in product_details
    historical_description as detailed_description,
    COALESCE(toggle_settings, '{}') as toggle_settings,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 5. Migrate images to product_images
INSERT INTO product_images (product_id, main_image_url, thumbnail_1_url, thumbnail_2_url, thumbnail_3_url, thumbnail_4_url, created_at, updated_at)
SELECT 
    product_id,
    main_image_url,
    thumbnail_1_url,
    thumbnail_2_url,
    thumbnail_3_url,
    thumbnail_4_url,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 6. Migrate specifications to product_specifications
INSERT INTO product_specifications (product_id, specifications, created_at, updated_at)
SELECT 
    product_id,
    COALESCE(specifications, '{}') as specifications,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 7. Migrate market value data
INSERT INTO market_value_data (product_id, market_value, price_change_percentage, investment_grade, week_low, week_high, avg_sale_price, created_at, updated_at)
SELECT 
    product_id,
    NULL as market_value, -- This field doesn't exist in product_details
    price_change_percentage,
    investment_grade,
    week_low,
    week_high,
    avg_sale_price,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 8. Migrate expert authentication data
INSERT INTO expert_authentication (product_id, expert_authenticated, certificate_number, authenticated_by, created_at, updated_at)
SELECT 
    product_id,
    expert_authenticated,
    certificate_number,
    authenticated_by,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 9. Migrate detailed specifications
INSERT INTO detailed_specifications (product_id, production_year, series, casting, color, tampo, wheels, country, condition_rating, condition_description, created_at, updated_at)
SELECT 
    product_id,
    production_year,
    series,
    casting,
    color,
    tampo,
    wheels,
    country,
    condition_rating,
    condition_description,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 10. Migrate premium services
INSERT INTO premium_services (product_id, professional_grading, grading_price, custom_display_case, display_case_price, insurance_valuation, insurance_price, created_at, updated_at)
SELECT 
    product_id,
    professional_grading,
    grading_price,
    custom_display_case,
    display_case_price,
    insurance_valuation,
    insurance_price,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 11. Migrate historical context
INSERT INTO historical_context (product_id, historical_description, expert_quote, expert_name, expert_rating, created_at, updated_at)
SELECT 
    product_id,
    historical_description,
    expert_quote,
    expert_name,
    expert_rating,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 12. Migrate apparel data
INSERT INTO apparel_data (product_id, available_sizes, size_chart_url, created_at, updated_at)
SELECT 
    product_id,
    COALESCE(available_sizes, '{}') as available_sizes,
    size_chart_url,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 13. Create status tags (these don't exist in current schema, so create empty records)
INSERT INTO status_tags (product_id, ultra_rare, mint_condition, investment_grade_tag, limited_edition, original_packaging, created_at, updated_at)
SELECT 
    product_id,
    FALSE as ultra_rare,
    FALSE as mint_condition,
    FALSE as investment_grade_tag,
    FALSE as limited_edition,
    FALSE as original_packaging,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- 14. Create product features (these don't exist in current schema, so create empty records)
INSERT INTO product_features (product_id, features, created_at, updated_at)
SELECT 
    product_id,
    '[]' as features,
    created_at,
    updated_at
FROM product_details
ON CONFLICT (product_id) DO NOTHING;

-- Show migration results
SELECT 'Migration completed successfully!' as status;
SELECT 'homepage_cards' as table_name, COUNT(*) as record_count FROM homepage_cards
UNION ALL
SELECT 'basic_information', COUNT(*) FROM basic_information
UNION ALL
SELECT 'extended_product_details', COUNT(*) FROM extended_product_details
UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL
SELECT 'product_features', COUNT(*) FROM product_features
UNION ALL
SELECT 'product_specifications', COUNT(*) FROM product_specifications
UNION ALL
SELECT 'market_value_data', COUNT(*) FROM market_value_data
UNION ALL
SELECT 'expert_authentication', COUNT(*) FROM expert_authentication
UNION ALL
SELECT 'detailed_specifications', COUNT(*) FROM detailed_specifications
UNION ALL
SELECT 'premium_services', COUNT(*) FROM premium_services
UNION ALL
SELECT 'status_tags', COUNT(*) FROM status_tags
UNION ALL
SELECT 'historical_context', COUNT(*) FROM historical_context
UNION ALL
SELECT 'apparel_data', COUNT(*) FROM apparel_data;
