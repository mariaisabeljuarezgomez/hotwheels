// Analytics JavaScript for Hot Wheels Velocity
class Analytics {
    constructor() {
        this.events = [];
        this.init();
    }

    init() {
        this.setupEventTracking();
        this.trackPageView();
    }

    setupEventTracking() {
        // Track product views
        document.addEventListener('click', (e) => {
            if (e.target.closest('.product-card, .listing-card')) {
                const productElement = e.target.closest('.product-card, .listing-card');
                const productName = productElement.querySelector('h3, h4, h5, h6')?.textContent || 'Unknown Product';
                this.trackEvent('product_view', { product_name: productName });
            }
        });

        // Track add to cart events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                const productName = e.target.getAttribute('data-product-name') || 'Unknown Product';
                const productPrice = e.target.getAttribute('data-product-price') || '0';
                this.trackEvent('add_to_cart', { 
                    product_name: productName,
                    product_price: productPrice
                });
            }
        });

        // Track navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.getAttribute('href')) {
                const linkText = e.target.textContent.trim();
                const linkUrl = e.target.getAttribute('href');
                this.trackEvent('navigation_click', { 
                    link_text: linkText,
                    link_url: linkUrl
                });
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const formName = e.target.getAttribute('name') || e.target.className || 'unknown_form';
            this.trackEvent('form_submit', { form_name: formName });
        });

        // Track search queries
        document.addEventListener('submit', (e) => {
            const searchInput = e.target.querySelector('input[type="search"], input[name*="search"]');
            if (searchInput) {
                const searchQuery = searchInput.value.trim();
                if (searchQuery) {
                    this.trackEvent('search', { query: searchQuery });
                }
            }
        });
    }

    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            referrer: document.referrer
        };

        this.trackEvent('page_view', pageData);
    }

    trackEvent(eventName, eventData = {}) {
        const event = {
            name: eventName,
            data: eventData,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.events.push(event);
        this.saveEvents();
        
        // Send to server if available
        this.sendEventToServer(event);
        
        console.log('📊 Analytics Event:', event);
    }

    sendEventToServer(event) {
        // Send analytics data to server
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }).catch(error => {
            console.log('Analytics server not available:', error.message);
        });
    }

    saveEvents() {
        // Save events to localStorage for offline tracking
        try {
            localStorage.setItem('hotwheels_analytics', JSON.stringify(this.events.slice(-100))); // Keep last 100 events
        } catch (e) {
            console.error('Error saving analytics:', e);
        }
    }

    loadEvents() {
        try {
            const savedEvents = localStorage.getItem('hotwheels_analytics');
            if (savedEvents) {
                this.events = JSON.parse(savedEvents);
            }
        } catch (e) {
            console.error('Error loading analytics:', e);
            this.events = [];
        }
    }

    // Get analytics summary
    getSummary() {
        const summary = {
            totalEvents: this.events.length,
            pageViews: this.events.filter(e => e.name === 'page_view').length,
            productViews: this.events.filter(e => e.name === 'product_view').length,
            addToCart: this.events.filter(e => e.name === 'add_to_cart').length,
            searches: this.events.filter(e => e.name === 'search').length,
            navigationClicks: this.events.filter(e => e.name === 'navigation_click').length
        };

        return summary;
    }

    // Track custom events
    trackCustomEvent(eventName, eventData) {
        this.trackEvent(eventName, eventData);
    }

    // Track user interactions
    trackUserInteraction(interactionType, target, additionalData = {}) {
        this.trackEvent('user_interaction', {
            interaction_type: interactionType,
            target: target,
            ...additionalData
        });
    }
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analytics = new Analytics();
});

// Export for use in other scripts
window.Analytics = Analytics;
