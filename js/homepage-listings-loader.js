// Homepage Listings Loader - Loads dynamic listings from database
class HomepageListingsLoader {
    constructor() {
        this.listings = {
            featured: [],
            exclusive: []
        };
        this.init();
    }

    async init() {
        await this.loadListings();
        this.updateHomepage();
    }

    async loadListings() {
        try {
            const response = await fetch('/api/homepage-listings');
            const result = await response.json();
            
            if (result.success) {
                // Group listings by section
                this.listings.featured = result.data.listings.filter(l => l.section === 'featured' && l.is_active);
                this.listings.exclusive = result.data.listings.filter(l => l.section === 'exclusive' && l.is_active);
                
                // Sort by position
                this.listings.featured.sort((a, b) => a.position - b.position);
                this.listings.exclusive.sort((a, b) => a.position - b.position);
            } else {
                console.warn('Failed to load homepage listings:', result.message);
                this.useFallbackData();
            }
        } catch (error) {
            console.error('Error loading homepage listings:', error);
            this.useFallbackData();
        }
    }

    useFallbackData() {
        // Fallback to static data if API fails
        this.listings.featured = [
            {
                listing_id: 'featured-1',
                title: '1968 Redline Custom Camaro',
                description: 'Mint condition with original blister pack',
                price: 2450.00,
                image_url: '../HOT_WHEELS_IMAGES/hot-wheels-1.jpeg',
                tag_type: 'ultra-rare',
                tag_text: 'ULTRA RARE',
                product_link: 'product_detail.html?id=1'
            },
            {
                listing_id: 'featured-2',
                title: '2023 RLC Exclusive McLaren',
                description: 'Limited edition with certificate',
                price: 89.00,
                image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&h=300',
                tag_type: 'rlc-exclusive',
                tag_text: 'RLC EXCLUSIVE',
                product_link: 'product_detail.html?id=1'
            },
            {
                listing_id: 'featured-3',
                title: '2024 Treasure Hunt Mustang',
                description: 'Super Treasure Hunt variant',
                price: 156.00,
                image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
                tag_type: 'treasure-hunt',
                tag_text: 'TREASURE HUNT',
                product_link: 'product_detail.html?id=1'
            }
        ];

        this.listings.exclusive = [
            {
                listing_id: 'exclusive-1',
                title: '1968 Redline Custom Camaro',
                description: 'Mint condition with original blister pack',
                price: 2450.00,
                image_url: '../HOT_WHEELS_IMAGES/hot-wheels-1.jpeg',
                tag_type: 'ultra-rare',
                tag_text: 'ULTRA RARE',
                product_link: 'product_detail.html?id=1'
            },
            {
                listing_id: 'exclusive-2',
                title: '2023 RLC Exclusive McLaren',
                description: 'Limited edition with certificate',
                price: 89.00,
                image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&h=300',
                tag_type: 'rlc-exclusive',
                tag_text: 'RLC EXCLUSIVE',
                product_link: 'product_detail.html?id=1'
            },
            {
                listing_id: 'exclusive-3',
                title: '2024 Treasure Hunt Mustang',
                description: 'Super Treasure Hunt variant',
                price: 156.00,
                image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
                tag_type: 'treasure-hunt',
                tag_text: 'TREASURE HUNT',
                product_link: 'product_detail.html?id=1'
            }
        ];
    }

    updateHomepage() {
        this.updateSection('featured', this.listings.featured);
        this.updateSection('exclusive', this.listings.exclusive);
    }

    updateSection(sectionName, listings) {
        const carouselId = sectionName === 'featured' ? 'treasureCarousel' : 'exclusiveCarousel';
        const carousel = document.getElementById(carouselId);
        
        if (!carousel) {
            console.warn(`Carousel not found: ${carouselId}`);
            return;
        }

        // Clear existing content
        carousel.innerHTML = '';

        // Add listings
        listings.forEach((listing, index) => {
            const card = this.createListingCard(listing, sectionName, index);
            carousel.appendChild(card);
        });
    }

    createListingCard(listing, sectionName, index) {
        const card = document.createElement('div');
        card.className = sectionName === 'featured' ? 'card-rare min-w-80 group cursor-pointer' : 'card-premium min-w-80 group cursor-pointer';
        
        const tagClass = this.getTagClass(listing.tag_type);
        const tagText = listing.tag_text || this.getDefaultTagText(listing.tag_type);
        
        card.innerHTML = `
            <div class="relative mb-4 overflow-hidden rounded-lg">
                <img src="${listing.image_url}" 
                     alt="${listing.title}" 
                     class="w-full h-48 object-cover group-hover:scale-110 transition-all duration-500" 
                     loading="lazy" 
                     onerror="this.src='../HOT_WHEELS_IMAGES/hot-wheels-2.jpeg'; this.onerror=null;" />
                <div class="absolute top-3 right-3 ${tagClass} px-2 py-1 rounded-full text-xs font-mono font-bold">
                    ${tagText}
                </div>
                ${sectionName === 'featured' ? '<div class="absolute bottom-3 left-3 bg-accent text-white px-3 py-1 rounded-full text-sm font-rajdhani font-semibold">360° VIEW</div>' : ''}
            </div>
            <h3 class="font-orbitron font-bold text-xl mb-2">${listing.title}</h3>
            <p class="text-text-secondary mb-3">${listing.description}</p>
            <div class="flex items-center justify-between">
                <span class="font-mono text-2xl font-bold text-success">$${listing.price.toLocaleString()}</span>
                <a href="${listing.product_link}" class="bg-accent text-white px-4 py-2 rounded-lg hover:shadow-rare transition-smooth">
                    View Details
                </a>
            </div>
        `;
        
        return card;
    }

    getTagClass(tagType) {
        const tagClasses = {
            'ultra-rare': 'bg-warning text-primary',
            'rlc-exclusive': 'bg-accent text-white',
            'treasure-hunt': 'bg-success text-primary',
            'super-treasure-hunt': 'bg-gradient-to-r from-accent to-success text-white',
            'limited-edition': 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white',
            'vintage': 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-white',
            'premium': 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
        };
        return tagClasses[tagType] || 'bg-accent text-white';
    }

    getDefaultTagText(tagType) {
        const tagTexts = {
            'ultra-rare': 'ULTRA RARE',
            'rlc-exclusive': 'RLC EXCLUSIVE',
            'treasure-hunt': 'TREASURE HUNT',
            'super-treasure-hunt': 'SUPER TREASURE HUNT',
            'limited-edition': 'LIMITED EDITION',
            'vintage': 'VINTAGE',
            'premium': 'PREMIUM'
        };
        return tagTexts[tagType] || tagType.toUpperCase();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.homepageListingsLoader = new HomepageListingsLoader();
});
