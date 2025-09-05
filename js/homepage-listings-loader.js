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
            console.log('🔄 Loading homepage listings...');
            const response = await fetch(`/api/homepage-listings?t=${Date.now()}`);
            const result = await response.json();
            
            console.log('📊 API Response:', result);
            
            if (result.success) {
                // Group listings by section
                this.listings.featured = result.data.listings.filter(l => l.section === 'featured' && l.is_active);
                this.listings.exclusive = result.data.listings.filter(l => l.section === 'exclusive' && l.is_active);
                
                // Sort by position
                this.listings.featured.sort((a, b) => a.position - b.position);
                this.listings.exclusive.sort((a, b) => a.position - b.position);
                
                console.log('✅ Loaded listings:', {
                    featured: this.listings.featured,
                    exclusive: this.listings.exclusive
                });
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
        // Only use fallback if API completely fails - don't show hardcoded data
        console.warn('Using fallback data - API failed');
        this.listings.featured = [];
        this.listings.exclusive = [];
    }

    updateHomepage() {
        console.log('🔄 Updating homepage with listings:', {
            featured: this.listings.featured,
            exclusive: this.listings.exclusive
        });
        
        // Debug featured section specifically
        console.log(`🔍 FEATURED SECTION DEBUG:`, {
            count: this.listings.featured.length,
            listings: this.listings.featured.map(l => ({
                id: l.id,
                listing_id: l.listing_id,
                title: l.title,
                image_url: l.image_url
            }))
        });
        this.updateSection('featured', this.listings.featured);
        this.updateSection('exclusive', this.listings.exclusive);
    }

    updateSection(sectionName, listings) {
        const carouselId = sectionName === 'featured' ? 'treasureCarousel' : 'exclusiveCarousel';
        const carousel = document.getElementById(carouselId);
        
        console.log(`🔄 Updating ${sectionName} section:`, {
            carouselId,
            carousel,
            listingsCount: listings.length,
            listings: listings
        });
        
        if (!carousel) {
            console.warn(`Carousel not found: ${carouselId}`);
            return;
        }

        // Clear existing content
        carousel.innerHTML = '';
        console.log(`✅ Cleared ${sectionName} carousel content`);

        // Add listings
        listings.forEach((listing, index) => {
            console.log(`🔄 Creating card ${index + 1} for ${sectionName}:`, listing);
            const card = this.createListingCard(listing, sectionName, index);
            carousel.appendChild(card);
            console.log(`✅ Added card ${index + 1} to ${sectionName} carousel`);
        });
        
        console.log(`✅ Finished updating ${sectionName} section`);
        console.log(`🔍 Final carousel content:`, carousel.innerHTML.substring(0, 200) + '...');
        console.log(`🔍 Carousel dimensions:`, {
            width: carousel.offsetWidth,
            height: carousel.offsetHeight,
            scrollWidth: carousel.scrollWidth,
            clientWidth: carousel.clientWidth,
            children: carousel.children.length
        });
        
        // Check first card dimensions and visibility
        if (carousel.children.length > 0) {
            const firstCard = carousel.children[0];
            console.log(`🔍 First card details:`, {
                element: firstCard,
                className: firstCard.className,
                offsetWidth: firstCard.offsetWidth,
                offsetHeight: firstCard.offsetHeight,
                offsetTop: firstCard.offsetTop,
                offsetLeft: firstCard.offsetLeft,
                computedStyle: window.getComputedStyle(firstCard).display,
                visibility: window.getComputedStyle(firstCard).visibility,
                opacity: window.getComputedStyle(firstCard).opacity
            });
        }
    }

    createListingCard(listing, sectionName, index) {
        const card = document.createElement('div');
        card.className = sectionName === 'featured' ? 'card-rare min-w-96 group cursor-pointer' : 'card-premium min-w-96 group cursor-pointer';
        
        
        const tagClass = this.getTagClass(listing.tag_type);
        const tagText = listing.tag_text || this.getDefaultTagText(listing.tag_type);
        
        card.innerHTML = `
            <div class="relative mb-4 overflow-hidden rounded-lg">
                <div class="aspect-[3/5] w-full">
                    <img src="${listing.image_url}" 
                         alt="${listing.title}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" 
                         loading="lazy" 
                         onerror="this.src='../HOT_WHEELS_IMAGES/hot-wheels-2.jpeg'; this.onerror=null;" />
                </div>
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
