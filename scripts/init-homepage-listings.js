// Initialize Homepage Listings with Default Data
const { query, initializeDatabase } = require('../config/database');

const defaultListings = [
    // Featured Treasures
    {
        listing_id: 'featured-1',
        section: 'featured',
        position: 1,
        title: '1968 Redline Custom Camaro',
        description: 'Mint condition with original blister pack',
        price: 2450.00,
        image_url: '../HOT_WHEELS_IMAGES/hot-wheels-1.jpeg',
        tag_type: 'ultra-rare',
        tag_text: 'ULTRA RARE',
        product_link: 'product_detail.html',
        is_active: true
    },
    {
        listing_id: 'featured-2',
        section: 'featured',
        position: 2,
        title: '2023 RLC Exclusive McLaren',
        description: 'Limited edition with certificate',
        price: 89.00,
        image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&h=300',
        tag_type: 'rlc-exclusive',
        tag_text: 'RLC EXCLUSIVE',
        product_link: 'product_detail.html',
        is_active: true
    },
    {
        listing_id: 'featured-3',
        section: 'featured',
        position: 3,
        title: '2024 Treasure Hunt Mustang',
        description: 'Super Treasure Hunt variant',
        price: 156.00,
        image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        tag_type: 'treasure-hunt',
        tag_text: 'TREASURE HUNT',
        product_link: 'product_detail.html',
        is_active: true
    },
    // Our Exclusive Collection
    {
        listing_id: 'exclusive-1',
        section: 'exclusive',
        position: 1,
        title: '1968 Redline Custom Camaro',
        description: 'Mint condition with original blister pack',
        price: 2450.00,
        image_url: '../HOT_WHEELS_IMAGES/hot-wheels-1.jpeg',
        tag_type: 'ultra-rare',
        tag_text: 'ULTRA RARE',
        product_link: 'product_detail.html',
        is_active: true
    },
    {
        listing_id: 'exclusive-2',
        section: 'exclusive',
        position: 2,
        title: '2023 RLC Exclusive McLaren',
        description: 'Limited edition with certificate',
        price: 89.00,
        image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&h=300',
        tag_type: 'rlc-exclusive',
        tag_text: 'RLC EXCLUSIVE',
        product_link: 'product_detail.html',
        is_active: true
    },
    {
        listing_id: 'exclusive-3',
        section: 'exclusive',
        position: 3,
        title: '2024 Treasure Hunt Mustang',
        description: 'Super Treasure Hunt variant',
        price: 156.00,
        image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        tag_type: 'treasure-hunt',
        tag_text: 'TREASURE HUNT',
        product_link: 'product_detail.html',
        is_active: true
    }
];

async function initializeHomepageListings() {
    try {
        console.log('🔄 Initializing homepage listings...');

        // Database should already be initialized by server

        // Check if listings already exist
        const existingListings = await query('SELECT COUNT(*) FROM homepage_listings');
        const count = parseInt(existingListings.rows[0].count);
        
        if (count > 0) {
            console.log(`✅ Homepage listings already exist (${count} listings)`);
            return;
        }
        
        // Insert default listings
        for (const listing of defaultListings) {
            await query(`
                INSERT INTO homepage_listings (
                    listing_id, section, position, title, description, price, 
                    image_url, tag_type, tag_text, product_link, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                listing.listing_id,
                listing.section,
                listing.position,
                listing.title,
                listing.description,
                listing.price,
                listing.image_url,
                listing.tag_type,
                listing.tag_text,
                listing.product_link,
                listing.is_active
            ]);
        }
        
        console.log('✅ Homepage listings initialized successfully');
        console.log(`📊 Created ${defaultListings.length} default listings`);
        
    } catch (error) {
        console.error('❌ Error initializing homepage listings:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    initializeHomepageListings()
        .then(() => {
            console.log('🎉 Homepage listings initialization complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Homepage listings initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeHomepageListings };
