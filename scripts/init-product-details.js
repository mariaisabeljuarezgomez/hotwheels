const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OCrMfnkeqCuKljjsbXJVzpVqXnEFMwAG@nozomi.proxy.rlwy.net:18246/railway'
});

async function initializeProductDetails() {
    try {
        console.log('🔄 Initializing product details...');

        // Check if product details already exist
        const checkQuery = 'SELECT COUNT(*) FROM product_details';
        const result = await pool.query(checkQuery);
        const existingCount = parseInt(result.rows[0].count);

        if (existingCount > 0) {
            console.log(`✅ Product details already exist (${existingCount} records)`);
            return;
        }

        // Insert default product details for 6 products
        const productDetails = [
            {
                product_id: 1,
                title: '2023 RLC Skyline GT-R',
                subtitle: 'Ultra-Rare Collectible',
                current_price: 299.99,
                                        main_image_url: '/HOT_WHEELS_IMAGES/hot-wheels-1.jpeg',
                        thumbnail_1_url: '/HOT_WHEELS_IMAGES/hot-wheels-2.jpeg',
                        thumbnail_2_url: '/HOT_WHEELS_IMAGES/hot-wheels-3.jpeg',
                        thumbnail_3_url: '/HOT_WHEELS_IMAGES/hot-wheels-4.jpeg',
                        thumbnail_4_url: '/HOT_WHEELS_IMAGES/hot-wheels-5.jpeg',
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
            }
        ];

        // Insert each product detail
        for (const product of productDetails) {
            const insertQuery = `
                INSERT INTO product_details (
                    product_id, title, subtitle, current_price, main_image_url,
                    thumbnail_1_url, thumbnail_2_url, thumbnail_3_url, thumbnail_4_url,
                    primary_tag, primary_tag_text, secondary_tag, secondary_tag_text,
                    expert_authenticated, certificate_number, authenticated_by,
                    historical_description, expert_quote, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `;
            
            await pool.query(insertQuery, [
                product.product_id,
                product.title,
                product.subtitle,
                product.current_price,
                product.main_image_url,
                product.thumbnail_1_url,
                product.thumbnail_2_url,
                product.thumbnail_3_url,
                product.thumbnail_4_url,
                product.primary_tag,
                product.primary_tag_text,
                product.secondary_tag,
                product.secondary_tag_text,
                product.expert_authenticated,
                product.certificate_number,
                product.authenticated_by,
                product.historical_description,
                product.expert_quote,
                product.is_active
            ]);
        }

        console.log('✅ Product details initialized successfully!');
        console.log(`📦 Created ${productDetails.length} product detail record`);

    } catch (error) {
        console.error('❌ Error initializing product details:', error);
        throw error;
    }
}

module.exports = { initializeProductDetails };

// Run if called directly
if (require.main === module) {
    initializeProductDetails()
        .then(() => {
            console.log('✅ Product details initialization completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Product details initialization failed:', error);
            process.exit(1);
        });
}