// Mobile Testing and Validation Script for Hot Wheels Velocity
// This script helps test and validate mobile optimizations

class MobileTester {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        this.isDesktop = window.innerWidth > 1024;
        
        this.init();
    }

    init() {
        this.testMobileOptimizations();
        this.testTouchInteractions();
        this.testPerformance();
        this.testAccessibility();
        this.generateReport();
    }

    testMobileOptimizations() {
        console.log('🧪 Testing Mobile Optimizations...');
        
        const tests = {
            viewport: this.testViewport(),
            navigation: this.testMobileNavigation(),
            typography: this.testTypography(),
            spacing: this.testSpacing(),
            images: this.testImages(),
            forms: this.testForms(),
            buttons: this.testButtons()
        };

        this.results = { ...tests };
    }

    testViewport() {
        const viewport = document.querySelector('meta[name="viewport"]');
        const hasViewport = viewport && viewport.content.includes('width=device-width');
        
        return {
            passed: hasViewport,
            message: hasViewport ? 'Viewport meta tag configured correctly' : 'Missing or incorrect viewport meta tag'
        };
    }

    testMobileNavigation() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        return {
            passed: !!(mobileMenuBtn && mobileMenu),
            message: (mobileMenuBtn && mobileMenu) ? 'Mobile navigation elements found' : 'Mobile navigation elements missing'
        };
    }

    testTypography() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let responsiveHeadings = 0;
        
        headings.forEach(heading => {
            const styles = window.getComputedStyle(heading);
            const fontSize = parseFloat(styles.fontSize);
            
            // Check if font size is appropriate for mobile
            if (this.isMobile && fontSize <= 40) {
                responsiveHeadings++;
            } else if (this.isTablet && fontSize <= 60) {
                responsiveHeadings++;
            } else if (this.isDesktop && fontSize <= 80) {
                responsiveHeadings++;
            }
        });
        
        return {
            passed: responsiveHeadings === headings.length,
            message: `${responsiveHeadings}/${headings.length} headings have appropriate font sizes`
        };
    }

    testSpacing() {
        const sections = document.querySelectorAll('section');
        let mobileOptimized = 0;
        
        sections.forEach(section => {
            const styles = window.getComputedStyle(section);
            const paddingTop = parseFloat(styles.paddingTop);
            const paddingBottom = parseFloat(styles.paddingBottom);
            
            // Check if padding is appropriate for mobile
            if (this.isMobile && paddingTop <= 80 && paddingBottom <= 80) {
                mobileOptimized++;
            } else if (!this.isMobile) {
                mobileOptimized++;
            }
        });
        
        return {
            passed: mobileOptimized === sections.length,
            message: `${mobileOptimized}/${sections.length} sections have mobile-optimized spacing`
        };
    }

    testImages() {
        const images = document.querySelectorAll('img');
        let optimizedImages = 0;
        
        images.forEach(img => {
            const hasLazy = img.hasAttribute('loading') && img.getAttribute('loading') === 'lazy';
            const hasAlt = img.hasAttribute('alt');
            const hasMaxWidth = img.style.maxWidth === '100%' || 
                               window.getComputedStyle(img).maxWidth === '100%';
            
            if (hasLazy && hasAlt && hasMaxWidth) {
                optimizedImages++;
            }
        });
        
        return {
            passed: optimizedImages === images.length,
            message: `${optimizedImages}/${images.length} images are mobile-optimized`
        };
    }

    testForms() {
        const inputs = document.querySelectorAll('input, textarea, select');
        let mobileOptimized = 0;
        
        inputs.forEach(input => {
            const styles = window.getComputedStyle(input);
            const fontSize = parseFloat(styles.fontSize);
            const minHeight = parseFloat(styles.minHeight) || parseFloat(styles.height);
            
            // Check if form elements are mobile-friendly
            if (fontSize >= 16 && minHeight >= 44) {
                mobileOptimized++;
            }
        });
        
        return {
            passed: mobileOptimized === inputs.length,
            message: `${mobileOptimized}/${inputs.length} form elements are mobile-optimized`
        };
    }

    testButtons() {
        const buttons = document.querySelectorAll('button, a[role="button"], .btn-primary');
        let mobileOptimized = 0;
        
        buttons.forEach(button => {
            const styles = window.getComputedStyle(button);
            const minHeight = parseFloat(styles.minHeight) || parseFloat(styles.height);
            const minWidth = parseFloat(styles.minWidth) || parseFloat(styles.width);
            
            // Check if buttons are touch-friendly
            if (minHeight >= 44 && minWidth >= 44) {
                mobileOptimized++;
            }
        });
        
        return {
            passed: mobileOptimized === buttons.length,
            message: `${mobileOptimized}/${buttons.length} buttons are touch-friendly`
        };
    }

    testTouchInteractions() {
        console.log('🧪 Testing Touch Interactions...');
        
        const tests = {
            touchTargets: this.testTouchTargets(),
            swipeGestures: this.testSwipeGestures(),
            touchFeedback: this.testTouchFeedback()
        };

        this.touchResults = { ...tests };
    }

    testTouchTargets() {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
        let touchFriendly = 0;
        
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const minSize = 44; // Apple's recommended minimum touch target size
            
            if (rect.width >= minSize && rect.height >= minSize) {
                touchFriendly++;
            }
        });
        
        return {
            passed: touchFriendly === interactiveElements.length,
            message: `${touchFriendly}/${interactiveElements.length} elements are touch-friendly (≥44px)`
        };
    }

    testSwipeGestures() {
        const carousels = document.querySelectorAll('.carousel-container, .treasure-carousel, .exclusive-carousel');
        
        return {
            passed: carousels.length > 0,
            message: `${carousels.length} carousel containers found for swipe gestures`
        };
    }

    testTouchFeedback() {
        const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
        let hasFeedback = 0;
        
        interactiveElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const hasTransition = styles.transition !== 'none' && styles.transition !== '';
            const hasHover = styles.transform !== 'none' || styles.opacity !== '1';
            
            if (hasTransition || hasHover) {
                hasFeedback++;
            }
        });
        
        return {
            passed: hasFeedback > 0,
            message: `${hasFeedback}/${interactiveElements.length} elements have touch feedback`
        };
    }

    testPerformance() {
        console.log('🧪 Testing Mobile Performance...');
        
        const tests = {
            imageOptimization: this.testImageOptimization(),
            animationPerformance: this.testAnimationPerformance(),
            scrollPerformance: this.testScrollPerformance()
        };

        this.performanceResults = { ...tests };
    }

    testImageOptimization() {
        const images = document.querySelectorAll('img');
        let optimized = 0;
        
        images.forEach(img => {
            const hasLazy = img.hasAttribute('loading') && img.getAttribute('loading') === 'lazy';
            const hasProperSizing = img.style.width !== '' || img.style.height !== '';
            
            if (hasLazy || hasProperSizing) {
                optimized++;
            }
        });
        
        return {
            passed: optimized === images.length,
            message: `${optimized}/${images.length} images are performance-optimized`
        };
    }

    testAnimationPerformance() {
        const animatedElements = document.querySelectorAll('[class*="animate-"]');
        let optimized = 0;
        
        animatedElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const hasTransform = styles.transform !== 'none';
            const hasWillChange = styles.willChange !== 'auto';
            
            if (hasTransform || hasWillChange) {
                optimized++;
            }
        });
        
        return {
            passed: optimized === animatedElements.length,
            message: `${optimized}/${animatedElements.length} animations are performance-optimized`
        };
    }

    testScrollPerformance() {
        const scrollableElements = document.querySelectorAll('.overflow-auto, .overflow-x-auto, .overflow-y-auto');
        let optimized = 0;
        
        scrollableElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const hasTouchScroll = styles.webkitOverflowScrolling === 'touch';
            
            if (hasTouchScroll) {
                optimized++;
            }
        });
        
        return {
            passed: optimized === scrollableElements.length,
            message: `${optimized}/${scrollableElements.length} scrollable elements are touch-optimized`
        };
    }

    testAccessibility() {
        console.log('🧪 Testing Mobile Accessibility...');
        
        const tests = {
            focusManagement: this.testFocusManagement(),
            colorContrast: this.testColorContrast(),
            screenReader: this.testScreenReaderSupport()
        };

        this.accessibilityResults = { ...tests };
    }

    testFocusManagement() {
        const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
        let hasFocusStyles = 0;
        
        focusableElements.forEach(element => {
            const styles = window.getComputedStyle(element, ':focus');
            const hasOutline = styles.outline !== 'none' && styles.outline !== '';
            
            if (hasOutline) {
                hasFocusStyles++;
            }
        });
        
        return {
            passed: hasFocusStyles > 0,
            message: `${hasFocusStyles}/${focusableElements.length} elements have focus styles`
        };
    }

    testColorContrast() {
        // Basic color contrast test
        const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
        let goodContrast = 0;
        
        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            // Simple contrast check (this is basic - in production, use a proper contrast checker)
            if (color !== backgroundColor) {
                goodContrast++;
            }
        });
        
        return {
            passed: goodContrast === textElements.length,
            message: `${goodContrast}/${textElements.length} text elements have color contrast`
        };
    }

    testScreenReaderSupport() {
        const images = document.querySelectorAll('img');
        let hasAltText = 0;
        
        images.forEach(img => {
            if (img.hasAttribute('alt')) {
                hasAltText++;
            }
        });
        
        return {
            passed: hasAltText === images.length,
            message: `${hasAltText}/${images.length} images have alt text`
        };
    }

    generateReport() {
        console.log('📱 Mobile Optimization Report');
        console.log('============================');
        console.log(`Device Type: ${this.isMobile ? 'Mobile' : this.isTablet ? 'Tablet' : 'Desktop'}`);
        console.log(`Screen Size: ${window.innerWidth}x${window.innerHeight}`);
        console.log('');
        
        console.log('📋 Mobile Optimizations:');
        Object.entries(this.results).forEach(([test, result]) => {
            console.log(`  ${result.passed ? '✅' : '❌'} ${test}: ${result.message}`);
        });
        
        console.log('');
        console.log('👆 Touch Interactions:');
        Object.entries(this.touchResults).forEach(([test, result]) => {
            console.log(`  ${result.passed ? '✅' : '❌'} ${test}: ${result.message}`);
        });
        
        console.log('');
        console.log('⚡ Performance:');
        Object.entries(this.performanceResults).forEach(([test, result]) => {
            console.log(`  ${result.passed ? '✅' : '❌'} ${test}: ${result.message}`);
        });
        
        console.log('');
        console.log('♿ Accessibility:');
        Object.entries(this.accessibilityResults).forEach(([test, result]) => {
            console.log(`  ${result.passed ? '✅' : '❌'} ${test}: ${result.message}`);
        });
        
        // Calculate overall score
        const allTests = [
            ...Object.values(this.results),
            ...Object.values(this.touchResults),
            ...Object.values(this.performanceResults),
            ...Object.values(this.accessibilityResults)
        ];
        
        const passedTests = allTests.filter(test => test.passed).length;
        const totalTests = allTests.length;
        const score = Math.round((passedTests / totalTests) * 100);
        
        console.log('');
        console.log(`🎯 Overall Mobile Score: ${score}% (${passedTests}/${totalTests} tests passed)`);
        
        if (score >= 90) {
            console.log('🌟 Excellent mobile optimization!');
        } else if (score >= 75) {
            console.log('👍 Good mobile optimization with room for improvement');
        } else if (score >= 60) {
            console.log('⚠️  Mobile optimization needs work');
        } else {
            console.log('🚨 Mobile optimization requires significant improvements');
        }
    }

    // Public method to run tests manually
    runTests() {
        this.testMobileOptimizations();
        this.testTouchInteractions();
        this.testPerformance();
        this.testAccessibility();
        this.generateReport();
    }
}

// Auto-run tests when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.search.includes('mobile-test=true')) {
        window.mobileTester = new MobileTester();
    }
});

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileTester;
}
