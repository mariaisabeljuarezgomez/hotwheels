// Homepage Listings Management JavaScript
class HomepageListings {
    constructor() {
        this.currentListing = null;
        this.listings = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadListings();
        this.checkAuth();
    }

    checkAuth() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn');
        const loginTime = localStorage.getItem('adminLoginTime');
        const now = new Date().getTime();
        
        // For development/testing, allow access without strict auth
        if (!isLoggedIn || !loginTime || (now - parseInt(loginTime)) > 24 * 60 * 60 * 1000) {
            console.log('Admin not logged in, but allowing access for development');
            // Set temporary admin session for development
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminLoginTime', now.toString());
            return;
        }
    }

    setupEventListeners() {
        // Edit listing buttons
        document.querySelectorAll('.edit-listing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const listingId = e.target.getAttribute('data-listing');
                this.openEditModal(listingId);
            });
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

            // Load both homepage listings and product details
            const [homepageResponse, productDetailsResponse] = await Promise.all([
                fetch('/api/homepage-listings'),
                fetch('/api/product-details/all')
            ]);

            const [homepageResult, productDetailsResult] = await Promise.all([
                homepageResponse.json(),
                productDetailsResponse.json()
            ]);

            this.listings = {};

            // Load homepage listings
            if (homepageResult.success) {
                homepageResult.data.listings.forEach(listing => {
                    this.listings[listing.listing_id] = listing;
                });
            }

            // Load product details and merge with homepage listings
            if (productDetailsResult.success) {
                productDetailsResult.data.products.forEach(product => {
                    const listingId = `product-${product.product_id}`;
                    if (this.listings[listingId]) {
                        // Merge product details with existing homepage listing
                        this.listings[listingId] = { ...this.listings[listingId], ...product };
                    } else {
                        // Create new listing entry for product
                        this.listings[listingId] = {
                            listing_id: listingId,
                            title: product.title,
                            description: product.subtitle || '',
                            price: product.current_price,
                            image_url: product.main_image_url,
                            tag_type: product.primary_tag || 'standard',
                            tag_text: product.primary_tag_text || '',
                            product_link: `product_detail.html?id=${product.product_id}`,
                            is_active: product.is_active,
                            ...product // Include all product detail fields
                        };
                    }
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

        // Populate features
        if (listing.features && Array.isArray(listing.features)) {
            document.getElementById('listing-features').value = listing.features.join('\n');
        } else {
            document.getElementById('listing-features').value = '';
        }

        // Populate specifications
        if (listing.specifications && typeof listing.specifications === 'object') {
            document.getElementById('listing-scale').value = listing.specifications.scale || '';
            document.getElementById('listing-material').value = listing.specifications.material || '';
            document.getElementById('listing-dimensions').value = listing.specifications.dimensions || '';
            document.getElementById('listing-weight').value = listing.specifications.weight || '';
            document.getElementById('listing-packaging').value = listing.specifications.packaging || '';
            document.getElementById('listing-year').value = listing.specifications.year || '';
            document.getElementById('listing-series').value = listing.specifications.series || '';
        } else {
            // Clear all specification fields
            document.getElementById('listing-scale').value = '';
            document.getElementById('listing-material').value = '';
            document.getElementById('listing-dimensions').value = '';
            document.getElementById('listing-weight').value = '';
            document.getElementById('listing-packaging').value = '';
            document.getElementById('listing-year').value = '';
            document.getElementById('listing-series').value = '';
        }

        // Populate all the comprehensive fields
        document.getElementById('listing-market-value').value = listing.market_value || '';
        document.getElementById('listing-price-change').value = listing.price_change_percentage || '';
        document.getElementById('listing-investment-grade').value = listing.investment_grade || '';
        document.getElementById('listing-last-price-update').value = listing.last_price_update || '';
        document.getElementById('listing-week-low').value = listing.week_low || '';
        document.getElementById('listing-week-high').value = listing.week_high || '';
        document.getElementById('listing-avg-sale-price').value = listing.avg_sale_price || '';
        
        document.getElementById('listing-expert-authenticated').checked = listing.expert_authenticated || false;
        document.getElementById('listing-certificate-number').value = listing.certificate_number || '';
        document.getElementById('listing-authenticated-by').value = listing.authenticated_by || '';
        
        document.getElementById('listing-production-year').value = listing.production_year || '';
        document.getElementById('listing-casting').value = listing.casting || '';
        document.getElementById('listing-spectraflame-color').value = listing.spectraflame_color || '';
        document.getElementById('listing-tampo').value = listing.tampo || '';
        document.getElementById('listing-wheel-type').value = listing.wheel_type || '';
        document.getElementById('listing-country-of-origin').value = listing.country_of_origin || '';
        document.getElementById('listing-condition-rating').value = listing.condition_rating || '';
        document.getElementById('listing-condition-description').value = listing.condition_description || '';
        
        document.getElementById('listing-professional-grading').checked = listing.professional_grading || false;
        document.getElementById('listing-grading-price').value = listing.grading_price || '';
        document.getElementById('listing-custom-display-case').checked = listing.custom_display_case || false;
        document.getElementById('listing-display-case-price').value = listing.display_case_price || '';
        document.getElementById('listing-insurance-valuation').checked = listing.insurance_valuation || false;
        document.getElementById('listing-insurance-price').value = listing.insurance_price || '';
        
        document.getElementById('listing-ultra-rare').checked = listing.ultra_rare || false;
        document.getElementById('listing-mint-condition').checked = listing.mint_condition || false;
        document.getElementById('listing-investment-grade-tag').checked = listing.investment_grade_tag || false;
        document.getElementById('listing-limited-edition').checked = listing.limited_edition || false;
        document.getElementById('listing-original-packaging').checked = listing.original_packaging || false;
        document.getElementById('listing-certified-authentic').checked = listing.certified_authentic || false;
        
        document.getElementById('listing-historical-description').value = listing.historical_description || '';
        document.getElementById('listing-expert-quote').value = listing.expert_quote || '';
        document.getElementById('listing-expert-name').value = listing.expert_name || '';
        document.getElementById('listing-expert-rating').value = listing.expert_rating || '';

        // Populate image slots
        this.populateImageSlots(listing);

        // Update image preview
        console.log('[editListing] Setting image preview with URL:', listing.image_url);
        this.updateImagePreview(listing.image_url);

        // Show modal
        document.getElementById('edit-listing-modal').style.display = 'block';
    }

    handleImageUpload(file) {
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select a valid image file', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('Image file must be smaller than 5MB', 'error');
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.updateImagePreview(e.target.result);
            // Store the file for upload
            this.currentImageFile = file;
        };
        reader.readAsDataURL(file);
    }

    updateImagePreview(imageUrl) {
        const preview = document.getElementById('image-preview');
        if (preview) {
            if (imageUrl && imageUrl.trim() !== '') {
            preview.src = imageUrl;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
                preview.src = ''; // Clear the src to prevent 404 errors
            }
        }
    }

    closeModal() {
        document.getElementById('edit-listing-modal').style.display = 'none';
        this.currentListing = null;
        document.getElementById('listing-edit-form').reset();
        
        // Clear image preview
        const imagePreview = document.getElementById('image-preview');
        if (imagePreview) {
            imagePreview.style.display = 'none';
            imagePreview.src = ''; // Clear the src to prevent 404 errors
        }
    }

    async saveListing() {
        console.log('[saveListing] Function started.');
        if (!this.currentListing) {
            this.showMessage('No listing selected', 'error');
            console.error('[saveListing] No this.currentListing found.');
            return;
        }

        try {
            this.showLoading(true);
            console.log('[saveListing] Loading indicator shown.');

            // Handle multiple image uploads
            const imageUrls = {
                main_image_url: null,
                thumbnail_1_url: null,
                thumbnail_2_url: null,
                thumbnail_3_url: null,
                thumbnail_4_url: null
            };

            console.log('[saveListing] Starting image upload loop.');
            // Upload images for each slot that has a new file
            for (let i = 0; i < 5; i++) {
                const uploadArea = document.querySelector(`[data-slot="${i}"]`);
                const input = uploadArea.querySelector('.slot-input');
                
                if (input && input.files && input.files[0]) {
                    console.log(`[saveListing] Found file in slot ${i}. Uploading...`);
                    const uploadFormData = new FormData();
                    uploadFormData.append('image', input.files[0]);
                    uploadFormData.append('listing_id', this.currentListing);
                    uploadFormData.append('slot_index', i);
                    
                    const uploadResponse = await fetch('/api/upload-homepage-image', {
                        method: 'POST',
                        body: uploadFormData
                    });
                    
                    const uploadResult = await uploadResponse.json();
                    if (uploadResult.success) {
                        const fieldName = i === 0 ? 'main_image_url' : `thumbnail_${i}_url`;
                        imageUrls[fieldName] = uploadResult.data.imageUrl;
                        console.log(`[saveListing] Slot ${i} uploaded successfully. URL: ${uploadResult.data.imageUrl}`);
                    } else {
                        this.showMessage(`Failed to upload image ${i + 1}: ${uploadResult.message}`, 'error');
                        console.error(`[saveListing] Image upload failed for slot ${i}:`, uploadResult.message);
                        this.showLoading(false);
                        return;
                    }
                }
            }
            console.log('[saveListing] Image upload loop finished.');

            // Use existing image URLs if no new uploads
            const existingListing = this.listings[this.currentListing];
            console.log('[saveListing] Checking for existing images.');
            if (existingListing) {
                if (!imageUrls.main_image_url && existingListing.main_image_url) {
                    imageUrls.main_image_url = existingListing.main_image_url;
                }
                if (!imageUrls.thumbnail_1_url && existingListing.thumbnail_1_url) {
                    imageUrls.thumbnail_1_url = existingListing.thumbnail_1_url;
                }
                if (!imageUrls.thumbnail_2_url && existingListing.thumbnail_2_url) {
                    imageUrls.thumbnail_2_url = existingListing.thumbnail_2_url;
                }
                if (!imageUrls.thumbnail_3_url && existingListing.thumbnail_3_url) {
                    imageUrls.thumbnail_3_url = existingListing.thumbnail_3_url;
                }
                if (!imageUrls.thumbnail_4_url && existingListing.thumbnail_4_url) {
                    imageUrls.thumbnail_4_url = existingListing.thumbnail_4_url;
                }
            }
            console.log('[saveListing] Final image URLs:', imageUrls);

            // Handle old single image upload system
            let imageUrl = imageUrls.main_image_url || document.getElementById('listing-image-url').value;
            
            // If there's a new file uploaded via the old system, handle it
            const oldImageInput = document.getElementById('listing-image-upload');
            if (oldImageInput && oldImageInput.files && oldImageInput.files[0]) {
                console.log('[saveListing] Found file in old image upload system. Uploading...');
                const uploadFormData = new FormData();
                uploadFormData.append('image', oldImageInput.files[0]);
                uploadFormData.append('listing_id', this.currentListing);
                
                const uploadResponse = await fetch('/api/upload-homepage-image', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                const uploadResult = await uploadResponse.json();
                if (uploadResult.success) {
                    imageUrl = uploadResult.data.imageUrl;
                    console.log('[saveListing] Old image uploaded successfully. URL:', imageUrl);
                } else {
                    this.showMessage(`Failed to upload image: ${uploadResult.message}`, 'error');
                    console.error('[saveListing] Old image upload failed:', uploadResult.message);
                    this.showLoading(false);
                    return;
                }
            } else if (!imageUrl && existingListing && existingListing.image_url) {
                // Use existing image URL if no new upload
                imageUrl = existingListing.image_url;
                console.log('[saveListing] Using existing image URL:', imageUrl);
            }

            // Collect features from textarea (one per line)
            const featuresText = document.getElementById('listing-features').value;
            const features = featuresText ? featuresText.split('\n').filter(f => f.trim()) : [];

            // Collect specifications
            const specifications = {
                scale: document.getElementById('listing-scale').value || null,
                material: document.getElementById('listing-material').value || null,
                dimensions: document.getElementById('listing-dimensions').value || null,
                weight: document.getElementById('listing-weight').value || null,
                packaging: document.getElementById('listing-packaging').value || null,
                year: document.getElementById('listing-year').value || null,
                series: document.getElementById('listing-series').value || null
            };

            const listingData = {
                listing_id: this.currentListing,
                title: document.getElementById('listing-title').value,
                description: document.getElementById('listing-description').value,
                price: parseFloat(document.getElementById('listing-price').value),
                
                // Product Image (only if section is enabled)
                ...(document.getElementById('toggle-product-image').checked ? {
                image_url: imageUrl,
                } : {}),
                
                // Product Images (only if section is enabled)
                ...(document.getElementById('toggle-product-images').checked ? {
                    main_image_url: imageUrls.main_image_url,
                    thumbnail_1_url: imageUrls.thumbnail_1_url,
                    thumbnail_2_url: imageUrls.thumbnail_2_url,
                    thumbnail_3_url: imageUrls.thumbnail_3_url,
                    thumbnail_4_url: imageUrls.thumbnail_4_url,
                } : {}),
                // Product Tag (only if section is enabled)
                ...(document.getElementById('toggle-product-tag').checked ? {
                tag_type: document.getElementById('listing-tag').value,
                tag_text: document.getElementById('listing-tag-text').value || null,
                } : {}),
                
                // Product Link (only if section is enabled)
                ...(document.getElementById('toggle-product-link').checked ? {
                product_link: document.getElementById('listing-link').value || null,
                } : {}),
                
                // Status (always enabled)
                is_active: document.getElementById('listing-active').checked,
                
                // Extended product details (only if section is enabled)
                ...(document.getElementById('toggle-extended-details').checked ? {
                    subtitle: document.getElementById('listing-subtitle').value || null,
                    original_price: document.getElementById('listing-original-price').value ? parseFloat(document.getElementById('listing-original-price').value) : null,
                    stock_quantity: document.getElementById('listing-stock').value ? parseInt(document.getElementById('listing-stock').value) : null,
                    detailed_description: document.getElementById('listing-detailed-description').value || null,
                } : {}),
                
                // Product Features (only if section is enabled)
                ...(document.getElementById('toggle-product-features').checked ? {
                    features: features,
                } : {}),
                
                // Apparel data (only if section is enabled)
                ...(document.getElementById('toggle-apparel').checked ? {
                    ...this.getSelectedSizes(),
                } : {}),
                
                // Product Specifications (only if section is enabled)
                ...(document.getElementById('toggle-product-specifications').checked ? {
                    specifications: specifications,
                } : {}),

                // Market Value & Investment Data (only if section is enabled)
                ...(document.getElementById('toggle-market-value').checked ? {
                    market_value: document.getElementById('listing-market-value').value ? parseFloat(document.getElementById('listing-market-value').value) : null,
                    price_change_percentage: document.getElementById('listing-price-change').value ? parseFloat(document.getElementById('listing-price-change').value) : null,
                    investment_grade: document.getElementById('listing-investment-grade').value || null,
                    last_price_update: document.getElementById('listing-last-price-update').value || null,
                    week_low: document.getElementById('listing-week-low').value ? parseFloat(document.getElementById('listing-week-low').value) : null,
                    week_high: document.getElementById('listing-week-high').value ? parseFloat(document.getElementById('listing-week-high').value) : null,
                    avg_sale_price: document.getElementById('listing-avg-sale-price').value ? parseFloat(document.getElementById('listing-avg-sale-price').value) : null,
                } : {}),

                // Expert Authentication (only if section is enabled)
                ...(document.getElementById('toggle-expert-auth').checked ? {
                    expert_authenticated: document.getElementById('listing-expert-authenticated').checked,
                    certificate_number: document.getElementById('listing-certificate-number').value || null,
                    authenticated_by: document.getElementById('listing-authenticated-by').value || null,
                } : {}),

                // Detailed Specifications (only if section is enabled)
                ...(document.getElementById('toggle-detailed-specs').checked ? {
                    production_year: document.getElementById('listing-production-year').value ? parseInt(document.getElementById('listing-production-year').value) : null,
                    casting: document.getElementById('listing-casting').value || null,
                    spectraflame_color: document.getElementById('listing-spectraflame-color').value || null,
                    tampo: document.getElementById('listing-tampo').value || null,
                    wheel_type: document.getElementById('listing-wheel-type').value || null,
                    country_of_origin: document.getElementById('listing-country-of-origin').value || null,
                    condition_rating: document.getElementById('listing-condition-rating').value ? parseFloat(document.getElementById('listing-condition-rating').value) : null,
                    condition_description: document.getElementById('listing-condition-description').value || null,
                } : {}),

                // Premium Services (only if section is enabled)
                ...(document.getElementById('toggle-premium-services').checked ? {
                    professional_grading: document.getElementById('listing-professional-grading').checked,
                    grading_price: document.getElementById('listing-grading-price').value ? parseFloat(document.getElementById('listing-grading-price').value) : null,
                    custom_display_case: document.getElementById('listing-custom-display-case').checked,
                    display_case_price: document.getElementById('listing-display-case-price').value ? parseFloat(document.getElementById('listing-display-case-price').value) : null,
                    insurance_valuation: document.getElementById('listing-insurance-valuation').checked,
                    insurance_price: document.getElementById('listing-insurance-price').value ? parseFloat(document.getElementById('listing-insurance-price').value) : null,
                } : {}),

                // Product Status Tags (only if section is enabled)
                ...(document.getElementById('toggle-status-tags').checked ? {
                    ultra_rare: document.getElementById('listing-ultra-rare').checked,
                    mint_condition: document.getElementById('listing-mint-condition').checked,
                    investment_grade_tag: document.getElementById('listing-investment-grade-tag').checked,
                    limited_edition: document.getElementById('listing-limited-edition').checked,
                    original_packaging: document.getElementById('listing-original-packaging').checked,
                    certified_authentic: document.getElementById('listing-certified-authentic').checked,
                } : {}),

                // Historical Context & Expert Commentary (only if section is enabled)
                ...(document.getElementById('toggle-historical-context').checked ? {
                    historical_description: document.getElementById('listing-historical-description').value || null,
                    expert_quote: document.getElementById('listing-expert-quote').value || null,
                    expert_name: document.getElementById('listing-expert-name').value || null,
                    expert_rating: document.getElementById('listing-expert-rating').value ? parseFloat(document.getElementById('listing-expert-rating').value) : null
                } : {})
            };

            console.log('[saveListing] Assembled listingData object:', listingData);

            // Determine which API endpoint to use based on listing type
            let apiEndpoint, requestData;

            if (this.currentListing.startsWith('product-')) {
                // This is a product detail edit - use product details API
                const productId = this.currentListing.split('-')[1];
                apiEndpoint = `/api/product-details/${productId}`;

                // For product details, we only send the product-specific data
                // Collect current toggle states
                const toggleStates = {};
                document.querySelectorAll('input[type="checkbox"][id^="toggle-"]').forEach(toggle => {
                    toggleStates[toggle.id] = toggle.checked;
                });

                requestData = {
                    title: listingData.title,
                    subtitle: listingData.subtitle,
                    current_price: listingData.price,
                    main_image_url: listingData.main_image_url,
                    thumbnail_1_url: listingData.thumbnail_1_url,
                    thumbnail_2_url: listingData.thumbnail_2_url,
                    thumbnail_3_url: listingData.thumbnail_3_url,
                    thumbnail_4_url: listingData.thumbnail_4_url,
                    primary_tag: listingData.tag_type,
                    primary_tag_text: listingData.tag_text,
                    toggle_settings: toggleStates, // Save toggle states
                    // Include all other product detail fields that were provided
                    ...Object.fromEntries(
                        Object.entries(listingData).filter(([key, value]) =>
                            value !== undefined && value !== null &&
                            !['listing_id', 'price', 'tag_type', 'tag_text', 'image_url', 'product_link', 'is_active'].includes(key)
                        )
                    )
                };
            } else {
                // This is a homepage listing edit - use homepage listings API
                apiEndpoint = '/api/homepage-listings';
                requestData = listingData;
            }

            console.log(`[saveListing] Sending PUT request to ${apiEndpoint}...`, requestData);
            const response = await fetch(apiEndpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
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

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    showMessage(message, type) {
        const container = document.getElementById('message-container');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        container.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    logout() {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = '/admin-login';
    }

    // Image upload functionality
    populateImageSlots(listing) {
        // Clear all image slots first
        for (let i = 0; i < 5; i++) {
            const uploadArea = document.querySelector(`[data-slot="${i}"]`);
            const preview = uploadArea.parentElement.querySelector('.image-preview');
            const input = uploadArea.querySelector('.slot-input');
            
            if (uploadArea && preview && input) {
                uploadArea.style.display = 'block';
                preview.style.display = 'none';
                input.value = '';
            }
        }

        // Populate with existing images if available
        if (listing.main_image_url) {
            this.populateImageSlot(0, listing.main_image_url);
        } else if (listing.image_url) {
            // Fallback to single image_url for main image if main_image_url is not available
            this.populateImageSlot(0, listing.image_url);
        }
        
        if (listing.thumbnail_1_url) {
            this.populateImageSlot(1, listing.thumbnail_1_url);
        }
        if (listing.thumbnail_2_url) {
            this.populateImageSlot(2, listing.thumbnail_2_url);
        }
        if (listing.thumbnail_3_url) {
            this.populateImageSlot(3, listing.thumbnail_3_url);
        }
        if (listing.thumbnail_4_url) {
            this.populateImageSlot(4, listing.thumbnail_4_url);
        }
        
        console.log('🖼️ [populateImageSlots] Populated images for listing:', listing.listing_id, {
            main_image_url: listing.main_image_url,
            image_url: listing.image_url,
            thumbnail_1_url: listing.thumbnail_1_url,
            thumbnail_2_url: listing.thumbnail_2_url,
            thumbnail_3_url: listing.thumbnail_3_url,
            thumbnail_4_url: listing.thumbnail_4_url
        });
    }

    populateImageSlot(slotIndex, imageUrl) {
        const uploadArea = document.querySelector(`[data-slot="${slotIndex}"]`);
        const preview = uploadArea.parentElement.querySelector('.image-preview');
        const img = preview.querySelector('img');

        if (uploadArea && preview && img) {
            if (imageUrl && imageUrl.trim() !== '') {
                uploadArea.style.display = 'none';
                preview.style.display = 'block';
                img.src = imageUrl;
            } else {
                uploadArea.style.display = 'block';
                preview.style.display = 'none';
                img.src = ''; // Clear the src to prevent 404 errors
            }
        }
    }

    handleToggleChange(toggleId, isChecked) {
        // This method handles showing/hiding sections based on toggle states
        // The actual implementation depends on how your toggle system works
        // For now, we'll just ensure the toggle element reflects the correct state
        const toggleElement = document.getElementById(toggleId);
        if (toggleElement) {
            toggleElement.checked = isChecked;
        }
    }

    // Initialize image upload functionality
    initializeImageUploads() {
        // Add click handlers for image upload areas
        document.querySelectorAll('.image-upload-area').forEach(area => {
            area.addEventListener('click', () => {
                const input = area.querySelector('.slot-input');
                if (input) {
                    input.click();
                }
            });
        });

        // Add change handlers for file inputs
        document.querySelectorAll('.slot-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const slotIndex = parseInt(e.target.closest('.image-upload-area').dataset.slot);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.populateImageSlot(slotIndex, event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });

        // Add delete handlers for image previews
        document.querySelectorAll('.delete-image').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const preview = e.target.closest('.image-preview');
                const uploadArea = preview.parentElement.querySelector('.image-upload-area');
                const input = uploadArea.querySelector('.slot-input');
                
                if (preview && uploadArea && input) {
                    preview.style.display = 'none';
                    uploadArea.style.display = 'block';
                    input.value = '';
                }
            });
        });
    }

    setupToggleSwitches() {
        // Toggle switches for form sections
        const toggleSwitches = [
            'toggle-basic-info',
            'toggle-product-image',
            'toggle-product-tag',
            'toggle-product-link', 
            'toggle-apparel',
            'toggle-product-images',
            'toggle-extended-details',
            'toggle-product-features',
            'toggle-product-specifications',
            'toggle-market-value',
            'toggle-expert-auth',
            'toggle-detailed-specs',
            'toggle-premium-services',
            'toggle-status-tags',
            'toggle-historical-context',
            'toggle-status'
        ];

        toggleSwitches.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    const sectionId = toggleId.replace('toggle-', '') + '-content';
                    const content = document.getElementById(sectionId);
                    if (content) {
                        if (e.target.checked) {
                            content.style.display = 'block';
                        } else {
                            content.style.display = 'none';
                        }
                    }
                });
            }
        });
    }

    setupProductTypeSelection() {
        // Product type radio buttons
        const productTypeRadios = document.querySelectorAll('input[name="product_type"]');
        productTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleProductTypeChange(e.target.value);
            });
        });

        // Size checkboxes
        const sizeCheckboxes = document.querySelectorAll('input[name="sizes"], input[name="hat_sizes"], input[name="tumbler_sizes"]');
        sizeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.updateSizeSelection(e.target);
            });
        });
    }

    handleProductTypeChange(productType) {
        // Hide all size and color selectors
        document.getElementById('tshirt-colors').style.display = 'none';
        document.getElementById('size-selector').style.display = 'none';
        document.getElementById('hat-sizes').style.display = 'none';
        document.getElementById('tumbler-options').style.display = 'none';

        // Show appropriate size selector
        switch(productType) {
            case 't-shirt':
                document.getElementById('tshirt-colors').style.display = 'block';
                document.getElementById('size-selector').style.display = 'block';
                break;
            case 'hat':
                document.getElementById('hat-sizes').style.display = 'block';
                break;
            case 'tumbler':
                document.getElementById('tumbler-options').style.display = 'block';
                break;
            case 'hot-wheels':
            default:
                // No size selector needed for Hot Wheels
                break;
        }
    }

    updateSizeSelection(checkbox) {
        // Add visual feedback for size selection
        const sizeOption = checkbox.closest('.size-option');
        if (checkbox.checked) {
            sizeOption.classList.add('selected');
        } else {
            sizeOption.classList.remove('selected');
        }
    }

    getSelectedSizes() {
        const productType = document.querySelector('input[name="product_type"]:checked')?.value || 'hot-wheels';
        let sizes = [];
        let colors = [];

        switch(productType) {
            case 't-shirt':
                sizes = Array.from(document.querySelectorAll('input[name="sizes"]:checked')).map(cb => cb.value);
                colors = Array.from(document.querySelectorAll('input[name="tshirt_colors"]:checked')).map(cb => cb.value);
                break;
            case 'hat':
                sizes = Array.from(document.querySelectorAll('input[name="hat_sizes"]:checked')).map(cb => cb.value);
                break;
            case 'tumbler':
                sizes = Array.from(document.querySelectorAll('input[name="tumbler_sizes"]:checked')).map(cb => cb.value);
                break;
        }

        return {
            productType,
            sizes,
            colors
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.homepageListings = new HomepageListings();
    window.homepageListings.initializeImageUploads();
});

// Add some CSS for form validation
const style = document.createElement('style');
style.textContent = `
    .form-input.error,
    .form-textarea.error,
    .form-select.error {
        border-color: #dc3545;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
    
    .form-input.valid,
    .form-textarea.valid,
    .form-select.valid {
        border-color: #28a745;
        box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
    }
`;
document.head.appendChild(style);
