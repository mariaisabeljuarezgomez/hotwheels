// Mobile-specific JavaScript for Hot Wheels Velocity
// Handles mobile navigation, touch interactions, and mobile optimizations

class MobileOptimizer {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isScrolling = false;
        
        this.init();
    }

    init() {
        this.setupMobileNavigation();
        this.setupTouchInteractions();
        this.setupMobileOptimizations();
        this.setupSwipeGestures();
        this.setupMobileForms();
        this.setupMobileImages();
        this.setupMobileVideo();
        
        // Listen for resize events
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    }

    setupMobileNavigation() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });

            // Close menu when clicking outside
            mobileMenu.addEventListener('click', (e) => {
                if (e.target === mobileMenu) {
                    this.closeMobileMenu();
                }
            });

            // Close menu when clicking on links
            const mobileLinks = mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            });
        }

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    setupTouchInteractions() {
        // Improve touch responsiveness
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
            this.isScrolling = false;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.touchStartY || !this.touchStartX) return;
            
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const diffY = this.touchStartY - touchY;
            const diffX = this.touchStartX - touchX;
            
            // Determine if user is scrolling
            if (Math.abs(diffY) > Math.abs(diffX)) {
                this.isScrolling = true;
            }
        }, { passive: true });

        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll('button, a, [role="button"], input, select, textarea');
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', (e) => {
                element.style.transform = 'scale(0.98)';
                element.style.transition = 'transform 0.1s ease';
            }, { passive: true });

            element.addEventListener('touchend', (e) => {
                element.style.transform = 'scale(1)';
            }, { passive: true });

            element.addEventListener('touchcancel', (e) => {
                element.style.transform = 'scale(1)';
            }, { passive: true });
        });
    }

    setupSwipeGestures() {
        // Swipe gestures for carousels
        const carousels = document.querySelectorAll('.carousel-container, .treasure-carousel, .exclusive-carousel');
        
        carousels.forEach(carousel => {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            let scrollLeft = 0;
            let velocity = 0;
            let lastX = 0;
            let lastTime = 0;

            carousel.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                scrollLeft = carousel.scrollLeft;
                isDragging = true;
                velocity = 0;
                lastX = startX;
                lastTime = Date.now();
                carousel.style.scrollBehavior = 'auto';
                
                // Add visual feedback
                carousel.style.cursor = 'grabbing';
            }, { passive: true });

            carousel.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentX = e.touches[0].clientX;
                const diff = startX - currentX;
                const currentTime = Date.now();
                
                // Calculate velocity for momentum scrolling
                if (currentTime - lastTime > 0) {
                    velocity = (lastX - currentX) / (currentTime - lastTime);
                    lastX = currentX;
                    lastTime = currentTime;
                }
                
                carousel.scrollLeft = scrollLeft + diff;
            }, { passive: true });

            carousel.addEventListener('touchend', () => {
                isDragging = false;
                carousel.style.cursor = 'grab';
                carousel.style.scrollBehavior = 'smooth';
                
                // Add momentum scrolling
                if (Math.abs(velocity) > 0.5) {
                    const momentum = velocity * 100;
                    carousel.scrollLeft += momentum;
                }
                
                // Snap to nearest card
                this.snapToNearestCard(carousel);
            }, { passive: true });

            // Add mouse support for desktop testing
            carousel.addEventListener('mousedown', (e) => {
                if (this.isMobile) return;
                
                startX = e.clientX;
                scrollLeft = carousel.scrollLeft;
                isDragging = true;
                carousel.style.cursor = 'grabbing';
                e.preventDefault();
            });

            carousel.addEventListener('mousemove', (e) => {
                if (!isDragging || this.isMobile) return;
                
                currentX = e.clientX;
                const diff = startX - currentX;
                carousel.scrollLeft = scrollLeft + diff;
                e.preventDefault();
            });

            carousel.addEventListener('mouseup', () => {
                if (this.isMobile) return;
                
                isDragging = false;
                carousel.style.cursor = 'grab';
                this.snapToNearestCard(carousel);
            });

            carousel.addEventListener('mouseleave', () => {
                if (this.isMobile) return;
                
                isDragging = false;
                carousel.style.cursor = 'grab';
            });
        });
    }

    snapToNearestCard(carousel) {
        const cards = carousel.querySelectorAll('.card-premium, .card-rare, .carousel-item');
        if (cards.length === 0) return;

        const cardWidth = cards[0].offsetWidth + 16; // Include margin
        const scrollLeft = carousel.scrollLeft;
        const nearestIndex = Math.round(scrollLeft / cardWidth);
        const targetScroll = nearestIndex * cardWidth;

        carousel.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    }

    setupMobileOptimizations() {
        // Optimize for mobile performance
        if (this.isMobile) {
            // Reduce animations on mobile for better performance
            const animatedElements = document.querySelectorAll('[class*="animate-"]');
            animatedElements.forEach(element => {
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    element.style.animation = 'none';
                }
            });

            // Lazy load images
            this.setupLazyLoading();

            // Optimize scroll performance
            let ticking = false;
            const optimizeScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        // Add any scroll optimizations here
                        ticking = false;
                    });
                    ticking = true;
                }
            };

            window.addEventListener('scroll', optimizeScroll, { passive: true });
        }
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                img.classList.add('loaded');
            });
        }
    }

    setupMobileForms() {
        // Prevent zoom on form focus (iOS)
        const formInputs = document.querySelectorAll('input, textarea, select');
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (this.isMobile) {
                    // Ensure font size is at least 16px to prevent zoom
                    const computedStyle = window.getComputedStyle(input);
                    const fontSize = parseFloat(computedStyle.fontSize);
                    if (fontSize < 16) {
                        input.style.fontSize = '16px';
                    }
                }
            });
        });

        // Improve form validation for mobile
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (this.isMobile) {
                    // Add mobile-specific validation
                    this.validateMobileForm(form);
                }
            });
        });
    }

    validateMobileForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
                this.showMobileError(field, 'This field is required');
            } else {
                field.classList.remove('error');
            }
        });

        if (!isValid) {
            // Scroll to first error field
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
        }

        return isValid;
    }

    showMobileError(field, message) {
        // Remove existing error
        const existingError = field.parentNode.querySelector('.mobile-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mobile-error text-error text-sm mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);

        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    setupMobileImages() {
        // Add loading states for images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });

            img.addEventListener('error', () => {
                img.classList.add('error');
                // Add fallback image
                if (!img.src.includes('placeholder')) {
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                }
            });
        });
    }

    setupMobileVideo() {
        // Optimize video for mobile
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (this.isMobile) {
                // Pause video when not in viewport to save battery
                const videoObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            video.play().catch(() => {
                                // Autoplay failed, which is expected on mobile
                                console.log('Video autoplay prevented by browser');
                            });
                        } else {
                            video.pause();
                        }
                    });
                });

                videoObserver.observe(video);
            }
        });
    }

    handleResize() {
        const wasMobile = this.isMobile;
        const wasTablet = this.isTablet;
        
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        
        // Close mobile menu if screen becomes larger
        if (!this.isMobile && document.getElementById('mobileMenu')?.classList.contains('active')) {
            this.closeMobileMenu();
        }
        
        // Reinitialize if device type changed
        if (wasMobile !== this.isMobile || wasTablet !== this.isTablet) {
            this.setupMobileOptimizations();
        }
    }

    handleOrientationChange() {
        // Handle orientation change
        setTimeout(() => {
            this.handleResize();
        }, 100);
    }

    // Utility methods
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    getDeviceType() {
        if (this.isMobile) return 'mobile';
        if (this.isTablet) return 'tablet';
        return 'desktop';
    }

    // Public API
    optimizeForMobile() {
        if (this.isMobile) {
            this.setupMobileOptimizations();
        }
    }

    // Method to reinitialize carousels after dynamic content is loaded
    reinitializeCarousels() {
        this.setupSwipeGestures();
        console.log('🔄 Carousels reinitialized for mobile');
    }
}

// Initialize mobile optimizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}
