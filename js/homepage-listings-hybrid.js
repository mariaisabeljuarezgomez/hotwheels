// HYBRID FRONTEND - Best of both solutions
// - Uses existing product_details table with toggle_settings for toggles
// - Simpler than full separation, but fixes all conflicts

class HomepageListings {
    constructor() {
        this.listings = {};
        this.currentListing = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadListings();
    }

    setupEventListeners() {
        // Edit button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-listing-btn')) {
                const listingId = e.target.dataset.listing;
                this.openEditModal(listingId);
            }
        });

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Cancel button
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('listing-edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveListing();
        });

        // Image file upload preview
        document.getElementById('listing-image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Toggle switch functionality
        this.setupToggleSwitches();
        
        // Product type selection
        this.setupProductTypeSelection();

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Close modal on outside click
        document.getElementById('edit-listing-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-listing-modal') {
                this.closeModal();
            }
        });
    }

    async loadListings() {
        try {
            this.showLoading(true);

            // Load homepage listings with joined data
            const homepageResponse = await fetch('/api/homepage-listings');
            const homepageResult = await homepageResponse.json();

            this.listings = {};

            // Load homepage listings
            if (homepageResult.success) {
                homepageResult.data.listings.forEach(listing => {
                    this.listings[listing.listing_id] = listing;
                });
            }

            this.updateDisplay();
        } catch (error) {
            console.error('Load listings error:', error);
            this.showMessage('Error loading listings: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateDisplay() {
        // Update all listing displays with current data
        Object.keys(this.listings).forEach(listingId => {
            const listing = this.listings[listingId];
            this.updateListingDisplay(listingId, listing);
        });
    }

    updateListingDisplay(listingId, listing) {
        // Update title
        const titleElement = document.getElementById(`${listingId}-title`);
        if (titleElement) titleElement.textContent = listing.title;

        // Update description
        const descElement = document.getElementById(`${listingId}-description`);
        if (descElement) descElement.textContent = listing.description;

        // Update price
        const priceElement = document.getElementById(`${listingId}-price`);
        if (priceElement) priceElement.textContent = `$${listing.price}`;

        // Update image
        const imgElement = document.getElementById(`${listingId}-preview`);
        if (imgElement) {
            imgElement.src = listing.image_url;
            imgElement.alt = listing.title;
        }

        // Update tag
        const tagElement = document.getElementById(`${listingId}-tag`);
        if (tagElement) {
            tagElement.textContent = listing.tag_text || this.getDefaultTagText(listing.tag_type);
            tagElement.className = `tag ${listing.tag_type}`;
        }
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

    openEditModal(listingId) {
        this.currentListing = listingId;
        const listing = this.listings[listingId];
        
        if (!listing) {
            this.showMessage('Listing not found', 'error');
            return;
        }

        // Populate form with current data
        document.getElementById('modal-title').textContent = `Edit ${listingId.replace('-', ' ').toUpperCase()}`;
        document.getElementById('listing-title').value = listing.title;
        document.getElementById('listing-description').value = listing.description;
        document.getElementById('listing-price').value = listing.price;
        document.getElementById('listing-image-url').value = listing.image_url;
        document.getElementById('listing-tag').value = listing.tag_type;
        document.getElementById('listing-tag-text').value = listing.tag_text || '';

        // Auto-generate product link based on listing ID
        const productId = listingId.split('-')[1];
        const autoProductLink = `product_detail.html?id=${productId}`;
        document.getElementById('listing-link').value = autoProductLink;
        document.getElementById('listing-link').readOnly = true;
        document.getElementById('listing-link').style.backgroundColor = '#f3f4f6';

        document.getElementById('listing-active').checked = listing.is_active;

        // Restore toggle states from database if available
        if (listing.toggle_settings) {
            Object.entries(listing.toggle_settings).forEach(([toggleId, isChecked]) => {
                const toggleElement = document.getElementById(toggleId);
                if (toggleElement) {
                    toggleElement.checked = isChecked;
                    // Trigger the toggle functionality to show/hide sections
                    this.handleToggleChange(toggleId, isChecked);
                }
            });
        }

        // Populate extended product details
        document.getElementById('listing-subtitle').value = listing.subtitle || '';
        document.getElementById('listing-original-price').value = listing.original_price || '';
        document.getElementById('listing-stock').value = listing.stock_quantity || '';
        document.getElementById('listing-detailed-description').value = listing.detailed_description || '';
        
        // Populate historical context fields
        document.getElementById('listing-historical-description').value = listing.historical_description || '';
        document.getElementById('listing-expert-quote').value = listing.expert_quote || '';
        document.getElementById('listing-expert-name').value = listing.expert_name || '';
        document.getElementById('listing-expert-rating').value = listing.expert_rating || '';

        // Populate images
        this.populateImageSlots(listing);

        // Update image preview
        console.log('[editListing] Setting image preview with URL:', listing.image_url);
        this.updateImagePreview(listing.image_url);

        // Show modal
        document.getElementById('edit-listing-modal').style.display = 'flex';
    }

    populateImageSlots(listing) {
        // Clear all image slots first
        for (let i = 0; i < 5; i++) {
            const uploadArea = document.querySelector(`[data-slot="${i}"]`);
            const preview = uploadArea.parentElement.querySelector('.image-preview');
            const input = uploadArea.querySelector('.slot-input');
            
            if (preview) {
                preview.style.display = 'none';
                preview.src = '';
            }
            if (input) {
                input.value = '';
            }
        }

        // Populate with existing images
        const imageUrls = {
            main_image_url: listing.main_image_url,
            thumbnail_1_url: listing.thumbnail_1_url,
            thumbnail_2_url: listing.thumbnail_2_url,
            thumbnail_3_url: listing.thumbnail_3_url,
            thumbnail_4_url: listing.thumbnail_4_url
        };

        let slotIndex = 0;
        Object.entries(imageUrls).forEach(([key, url]) => {
            if (url && slotIndex < 5) {
                const uploadArea = document.querySelector(`[data-slot="${slotIndex}"]`);
                const preview = uploadArea.parentElement.querySelector('.image-preview');
                
                if (preview) {
                    preview.src = url;
                    preview.style.display = 'block';
                }
                slotIndex++;
            }
        });

        console.log('🖼️ [populateImageSlots] Populated images for listing:', listing.listing_id, {
            main_image_url: listing.main_image_url,
            image_url: listing.image_url,
            thumbnail_1_url: listing.thumbnail_1_url,
            thumbnail_2_url: listing.thumbnail_2_url,
            thumbnail_3_url: listing.thumbnail_3_url,
            thumbnail_4_url: listing.thumbnail_4_url
        });
    }

    updateImagePreview(imageUrl) {
        const preview = document.getElementById('image-preview');
        if (preview && imageUrl) {
            preview.src = imageUrl;
            preview.style.display = 'block';
        }
    }

    setupToggleSwitches() {
        // Add event listeners to all toggle switches
        document.querySelectorAll('input[type="checkbox"][id^="toggle-"]').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handleToggleChange(e.target.id, e.target.checked);
            });
        });
    }

    handleToggleChange(toggleId, isChecked) {
        // Find the section associated with this toggle
        const sectionId = toggleId.replace('toggle-', '');
        const section = document.getElementById(sectionId);
        
        if (section) {
            if (isChecked) {
                section.style.display = 'block';
                section.classList.add('active');
            } else {
                section.style.display = 'none';
                section.classList.remove('active');
            }
        }
    }

    setupProductTypeSelection() {
        // Product type selection logic
        const productTypeSelect = document.getElementById('listing-product-type');
        if (productTypeSelect) {
            productTypeSelect.addEventListener('change', (e) => {
                this.handleProductTypeChange(e.target.value);
            });
        }
    }

    handleProductTypeChange(productType) {
        // Show/hide relevant sections based on product type
        const apparelSection = document.getElementById('apparel');
        const specificationsSection = document.getElementById('product-specifications');
        
        if (productType === 'apparel') {
            if (apparelSection) apparelSection.style.display = 'block';
            if (specificationsSection) specificationsSection.style.display = 'none';
        } else {
            if (apparelSection) apparelSection.style.display = 'none';
            if (specificationsSection) specificationsSection.style.display = 'block';
        }
    }

    handleImageUpload(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.updateImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    async saveListing() {
        try {
            console.log('[saveListing] Function started.');
            this.showLoading(true);
            console.log('[saveListing] Loading indicator shown.');

            // Handle image uploads
            const imageUrls = {
                main_image_url: null,
                thumbnail_1_url: null,
                thumbnail_2_url: null,
                thumbnail_3_url: null,
                thumbnail_4_url: null
            };

            console.log('[saveListing] Starting image upload loop.');
            for (let i = 0; i < 5; i++) {
                const fileInput = document.querySelector(`[data-slot="${i}"] .slot-input`);
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    console.log(`[saveListing] Found file in slot ${i}. Uploading...`);
                    try {
                        const formData = new FormData();
                        formData.append('image', fileInput.files[0]);
                        
                        const response = await fetch('/api/upload-image', {
                            method: 'POST',
                            body: formData
                        });
                        
                        if (response.ok) {
                            const result = await response.json();
                            const urlKey = i === 0 ? 'main_image_url' : `thumbnail_${i}_url`;
                            imageUrls[urlKey] = result.url;
                            console.log(`[saveListing] Slot ${i} uploaded successfully. URL: ${result.url}`);
                        }
                    } catch (error) {
                        console.error(`[saveListing] Error uploading slot ${i}:`, error);
                    }
                }
            }
            console.log('[saveListing] Image upload loop finished.');

            // Check for existing images
            console.log('[saveListing] Checking for existing images.');
            const existingImages = this.getExistingImages();
            Object.keys(imageUrls).forEach(key => {
                if (!imageUrls[key] && existingImages[key]) {
                    imageUrls[key] = existingImages[key];
                }
            });

            console.log('[saveListing] Final image URLs:', imageUrls);

            // Get the main image URL (either uploaded or existing)
            const imageUrl = imageUrls.main_image_url || this.getExistingMainImage() || '/HOT_WHEELS_IMAGES/placeholder.jpg';

            // Collect current toggle states
            const toggleStates = {};
            document.querySelectorAll('input[type="checkbox"][id^="toggle-"]').forEach(toggle => {
                toggleStates[toggle.id] = toggle.checked;
            });

            // Prepare data for homepage listings
            const listingData = {
                listing_id: this.currentListing,
                title: document.getElementById('listing-title').value,
                description: document.getElementById('listing-description').value,
                price: parseFloat(document.getElementById('listing-price').value),
                image_url: imageUrl,
                tag_type: document.getElementById('listing-tag').value,
                tag_text: document.getElementById('listing-tag-text').value || null,
                product_link: document.getElementById('listing-link').value || null,
                is_active: document.getElementById('listing-active').checked,
                // Extended data
                subtitle: document.getElementById('listing-subtitle')?.value || null,
                main_image_url: imageUrls.main_image_url,
                thumbnail_1_url: imageUrls.thumbnail_1_url,
                thumbnail_2_url: imageUrls.thumbnail_2_url,
                thumbnail_3_url: imageUrls.thumbnail_3_url,
                thumbnail_4_url: imageUrls.thumbnail_4_url,
                detailed_description: document.getElementById('listing-detailed-description')?.value || null,
                original_price: document.getElementById('listing-original-price')?.value ? parseFloat(document.getElementById('listing-original-price').value) : null,
                stock_quantity: document.getElementById('listing-stock')?.value ? parseInt(document.getElementById('listing-stock').value) : null,
                toggle_settings: toggleStates
            };

            console.log('[saveListing] Assembled listingData object:', listingData);

            // Send to hybrid API endpoint
            console.log('[saveListing] Sending PUT request to /api/homepage-listings...');
            const response = await fetch('/api/homepage-listings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(listingData)
            });
            console.log('[saveListing] PUT request sent. Response status:', response.status);

            const result = await response.json();
            console.log('[saveListing] Parsed JSON response:', result);

            if (result.success) {
                this.showMessage('Listing updated successfully!', 'success');
                this.closeModal();
                this.loadListings(); // Re-fetch all listings to get the updated data
            } else {
                this.showMessage('Failed to update listing: ' + result.message, 'error');
                console.error('[saveListing] Save failed. Server message:', result.message);
            }
        } catch (error) {
            console.error('[saveListing] An error occurred:', error);
            this.showMessage('An unexpected error occurred: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            console.log('[saveListing] Function finished.');
        }
    }

    getExistingImages() {
        const listing = this.listings[this.currentListing];
        if (!listing) return {};

        return {
            main_image_url: listing.main_image_url,
            thumbnail_1_url: listing.thumbnail_1_url,
            thumbnail_2_url: listing.thumbnail_2_url,
            thumbnail_3_url: listing.thumbnail_3_url,
            thumbnail_4_url: listing.thumbnail_4_url
        };
    }

    getExistingMainImage() {
        const listing = this.listings[this.currentListing];
        return listing ? listing.image_url : null;
    }

    closeModal() {
        document.getElementById('edit-listing-modal').style.display = 'none';
        this.currentListing = null;
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    showMessage(message, type) {
        // Simple message display
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    logout() {
        // Simple logout
        window.location.href = '/';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomepageListings();
});
