// HYBRID FRONTEND - Best of both solutions
// - Uses existing product_details table with toggle_settings for toggles
// - Simpler than full separation, but fixes all conflicts

console.log('🔄 LOADING NEW VERSION OF HOMEPAGE-LISTINGS-HYBRID.JS - CACHE BUSTED!');
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

        // Save button click
        document.getElementById('save-listing-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Save button clicked, preventing form submission');
            this.saveListing();
        });

        // Image file upload preview
        document.getElementById('listing-image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Image slot uploads
        document.addEventListener('click', (e) => {
            if (e.target.closest('.image-upload-area[data-slot]')) {
                const slot = e.target.closest('.image-upload-area[data-slot]');
                const input = slot.querySelector('input[type="file"]');
                if (input) {
                    console.log('🖼️ Clicking file input for slot:', slot.dataset.slot);
                    input.click();
                }
            }
        });

        // Handle slot image uploads
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-slot] input[type="file"]')) {
                this.handleSlotImageUpload(e.target);
            }
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

        // Image upload slot clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-slot]')) {
                const slot = e.target.closest('[data-slot]');
                const input = slot.querySelector('.slot-input');
                if (input) {
                    input.click();
                }
            }
        });

        // Image slot file input changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('slot-input')) {
                this.handleSlotImageUpload(e.target);
            }
        });

        // Delete image buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-image-btn')) {
                e.stopPropagation();
                console.log('🗑️ [Delete] Delete button clicked');
                const preview = e.target.closest('.image-preview');
                const uploadArea = preview.parentElement.querySelector('.image-upload-area');
                const input = uploadArea.querySelector('.slot-input');
                
                console.log('🗑️ [Delete] Preview found:', !!preview, 'Upload area found:', !!uploadArea, 'Input found:', !!input);
                
                if (preview && uploadArea && input) {
                    // Get the slot number to know which thumbnail to clear
                    const slotElement = uploadArea.closest('[data-slot]');
                    const slotNumber = slotElement ? parseInt(slotElement.getAttribute('data-slot')) : null;
                    
                    console.log('🗑️ [Delete] Deleting image from slot:', slotNumber);
                    
                    // Hide preview and show upload area
                    preview.style.display = 'none';
                    uploadArea.style.display = 'block';
                    input.value = '';
                    
                    // Clear the image from the current listing data
                    if (slotNumber !== null && this.currentListing) {
                        const listing = this.listings[this.currentListing];
                        if (listing) {
                            if (slotNumber === 0) {
                                listing.main_image_url = null;
                            } else {
                                const thumbnailKey = `thumbnail_${slotNumber}_url`;
                                listing[thumbnailKey] = null;
                            }
                            console.log('🗑️ [Delete] Cleared image data for slot', slotNumber);
                            console.log('🗑️ [Delete] Updated listing data:', listing);
                        }
                    }
                    
                    console.log('✅ [Delete] Image deleted successfully');
                } else {
                    console.error('❌ [Delete] Could not find required elements');
                }
            }
        });
    }

    handleSlotImageUpload(input) {
        const file = input.files[0];
        if (!file) return;

        const slot = input.closest('[data-slot]');
        if (!slot) return;
        
        // Find the parent image-slot container
        const imageSlot = slot.closest('.image-slot');
        if (!imageSlot) return;
        
        const uploadArea = slot.querySelector('.image-upload-area');
        const preview = imageSlot.querySelector('.image-preview');
        
        if (!preview) {
            console.error('Preview element not found for slot:', imageSlot);
            return;
        }
        
        const img = preview.querySelector('img');
        if (!img) {
            console.error('Image element not found in preview:', preview);
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            if (uploadArea) uploadArea.style.display = 'none';
            if (preview) preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    async loadListings() {
        try {
            this.showLoading(true);

            // Load homepage listings with joined data
            const homepageResponse = await fetch(`/api/homepage-listings?t=${Date.now()}`);
            const homepageResult = await homepageResponse.json();

            this.listings = {};

            // Load homepage listings
            if (homepageResult.success) {
                console.log('🔄 Admin: Loading listings from API:', homepageResult.data.listings);
                homepageResult.data.listings.forEach(listing => {
                    this.listings[listing.listing_id] = listing;
                });
                console.log('🔄 Admin: Processed listings:', this.listings);
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
        console.log('🔄 [openEditModal] Opening modal for listing:', listingId);
        this.currentListing = listingId;
        const listing = this.listings[listingId];
        
        console.log('🔄 [openEditModal] Available listings:', Object.keys(this.listings));
        console.log('🔄 [openEditModal] Selected listing data:', listing);
        
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
            
            // Populate T-shirt sizes and colors
            if (listing.toggle_settings.sizes && Array.isArray(listing.toggle_settings.sizes)) {
                console.log('👕 [Edit] Populating T-shirt sizes:', listing.toggle_settings.sizes);
                // Clear existing selections
                document.querySelectorAll('input[name="sizes"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                // Check the sizes from database
                listing.toggle_settings.sizes.forEach(size => {
                    const checkbox = document.querySelector(`input[name="sizes"][value="${size}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
            
            if (listing.toggle_settings.colors && Array.isArray(listing.toggle_settings.colors)) {
                console.log('👕 [Edit] Populating T-shirt colors:', listing.toggle_settings.colors);
                // Clear existing selections
                document.querySelectorAll('input[name="tshirt_colors"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                // Check the colors from database
                listing.toggle_settings.colors.forEach(color => {
                    const checkbox = document.querySelector(`input[name="tshirt_colors"][value="${color}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
        }

        // Populate extended product details
        document.getElementById('listing-subtitle').value = listing.subtitle || '';
        document.getElementById('listing-original-price').value = listing.original_price || '';
        document.getElementById('listing-stock').value = listing.stock_quantity || '';

        // Populate Tumbler Size Guide data
        if (listing.tumbler_guide_title) {
            document.getElementById('tumbler-guide-title').value = listing.tumbler_guide_title;
        }
        if (listing.tumbler_guide_data) {
            document.getElementById('tumbler-guide-data').value = typeof listing.tumbler_guide_data === 'string' 
                ? listing.tumbler_guide_data 
                : JSON.stringify(listing.tumbler_guide_data, null, 2);
        }
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

        // Show T-shirt sections if this is a T-shirt product
        if (listing.product_type === 't-shirt') {
            console.log('👕 [Edit] This is a T-shirt product, showing apparel sections');
            const apparelToggle = document.getElementById('toggle-apparel');
            if (apparelToggle) {
                apparelToggle.checked = true;
                this.handleToggleChange('toggle-apparel', true);
            }
        }

        // Show modal
        document.getElementById('edit-listing-modal').style.display = 'flex';
    }

    populateImageSlots(listing) {
        console.log('🖼️ [populateImageSlots] Starting for listing:', listing.listing_id);
        
        // Clear all image slots first
        for (let i = 0; i < 5; i++) {
            const uploadArea = document.querySelector(`[data-slot="${i}"]`);
            const preview = uploadArea?.parentElement?.querySelector('.image-preview');
            const input = uploadArea?.querySelector('.slot-input');
            
            if (preview) {
                preview.style.display = 'none';
                const img = preview.querySelector('img');
                if (img) img.src = '';
            }
            if (input) {
                input.value = '';
            }
            if (uploadArea) {
                uploadArea.style.display = 'block';
            }
        }

        // Populate with existing images - map thumbnails to correct slots
        // Slot 0 is for main image, slots 1-4 are for thumbnails
        const imageMapping = [
            { key: 'main_image_url', slot: 0 },
            { key: 'thumbnail_1_url', slot: 1 },
            { key: 'thumbnail_2_url', slot: 2 },
            { key: 'thumbnail_3_url', slot: 3 },
            { key: 'thumbnail_4_url', slot: 4 }
        ];

        console.log('🖼️ [populateImageSlots] Image URLs from listing:', {
            main_image_url: listing.main_image_url,
            thumbnail_1_url: listing.thumbnail_1_url,
            thumbnail_2_url: listing.thumbnail_2_url,
            thumbnail_3_url: listing.thumbnail_3_url,
            thumbnail_4_url: listing.thumbnail_4_url
        });

        imageMapping.forEach(({ key, slot }) => {
            const url = listing[key];
            console.log(`🖼️ [populateImageSlots] Processing ${key}: ${url} -> slot ${slot}`);
            
            if (url) {
                const uploadArea = document.querySelector(`[data-slot="${slot}"]`);
                const preview = uploadArea?.parentElement?.querySelector('.image-preview');
                
                console.log(`🖼️ [populateImageSlots] Slot ${slot} - uploadArea:`, !!uploadArea, 'preview:', !!preview);
                
                if (preview && uploadArea) {
                    const img = preview.querySelector('img');
                    if (img) {
                        img.src = url;
                        preview.style.display = 'block';
                        uploadArea.style.display = 'none';
                        console.log(`✅ [populateImageSlots] Set image for slot ${slot}:`, url);
                    } else {
                        console.log(`❌ [populateImageSlots] No img element found in preview for slot ${slot}`);
                    }
                } else {
                    console.log(`❌ [populateImageSlots] No preview element found for slot ${slot}`);
                }
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
        console.log('🖼️ [updateImagePreview] Called with URL:', imageUrl);
        const preview = document.getElementById('image-preview');
        console.log('🖼️ [updateImagePreview] Preview element found:', !!preview);
        if (preview && imageUrl) {
            // The image-preview element is the img tag itself
            preview.src = imageUrl;
            preview.style.display = 'block';
            console.log('✅ [updateImagePreview] Image set and preview shown');
        } else {
            console.log('❌ [updateImagePreview] Preview element not found or no image URL');
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
        let sectionId = toggleId.replace('toggle-', '');
        
        // Special handling for specific toggles
        if (toggleId === 'toggle-apparel') {
            sectionId = 'apparel-content';
        } else if (toggleId === 'toggle-tumbler-guide') {
            sectionId = 'tumbler-guide-content';
        }
        
        const section = document.getElementById(sectionId);
        
        if (section) {
            if (isChecked) {
                section.style.display = 'block';
                section.classList.add('active');
                console.log('🔧 [Toggle] Showing section:', sectionId);
                
                // Special handling for apparel section - show T-shirt subsections
                if (toggleId === 'toggle-apparel') {
                    const tshirtColors = document.getElementById('tshirt-colors');
                    const sizeSelector = document.getElementById('size-selector');
                    if (tshirtColors) {
                        tshirtColors.style.display = 'block';
                        console.log('👕 [Toggle] Showing T-shirt colors section');
                    }
                    if (sizeSelector) {
                        sizeSelector.style.display = 'block';
                        console.log('👕 [Toggle] Showing T-shirt sizes section');
                    }
                }
            } else {
                section.style.display = 'none';
                section.classList.remove('active');
                console.log('🔧 [Toggle] Hiding section:', sectionId);
                
                // Special handling for apparel section - hide T-shirt subsections
                if (toggleId === 'toggle-apparel') {
                    const tshirtColors = document.getElementById('tshirt-colors');
                    const sizeSelector = document.getElementById('size-selector');
                    if (tshirtColors) {
                        tshirtColors.style.display = 'none';
                        console.log('👕 [Toggle] Hiding T-shirt colors section');
                    }
                    if (sizeSelector) {
                        sizeSelector.style.display = 'none';
                        console.log('👕 [Toggle] Hiding T-shirt sizes section');
                    }
                }
            }
        } else {
            console.log('🔧 [Toggle] Section not found:', sectionId);
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

    async handleImageUpload(file) {
        if (file) {
            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                this.updateImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            
            // Also upload the file immediately
            try {
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('🖼️ [handleImageUpload] Main image uploaded successfully:', result.data.imageUrl);
                    // Store the uploaded URL for later use
                    this.uploadedMainImageUrl = result.data.imageUrl;
                } else {
                    console.error('🖼️ [handleImageUpload] Main image upload failed:', response.status);
                }
            } catch (error) {
                console.error('🖼️ [handleImageUpload] Error uploading main image:', error);
            }
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
                            console.log(`[saveListing] Upload response for slot ${i}:`, result);
                            // Map slots correctly: slot 0 = main_image_url, slots 1-4 = thumbnail_1_url to thumbnail_4_url
                            const urlKey = i === 0 ? 'main_image_url' : `thumbnail_${i}_url`;
                            imageUrls[urlKey] = result.data.imageUrl;
                            console.log(`[saveListing] Slot ${i} uploaded successfully. URL: ${result.data.imageUrl}`);
                        } else {
                            console.error(`[saveListing] Upload failed for slot ${i}:`, response.status, response.statusText);
                        }
                    } catch (error) {
                        console.error(`[saveListing] Error uploading slot ${i}:`, error);
                    }
                }
            }
            console.log('[saveListing] Image upload loop finished.');

            // Check for existing images - but respect deletions (null values)
            console.log('[saveListing] Checking for existing images.');
            const currentListing = this.listings[this.currentListing];
            if (currentListing) {
                // Use uploaded images if available, otherwise keep existing images (including nulls from deletions)
                imageUrls.main_image_url = imageUrls.main_image_url || currentListing.main_image_url;
                imageUrls.thumbnail_1_url = imageUrls.thumbnail_1_url || currentListing.thumbnail_1_url;
                imageUrls.thumbnail_2_url = imageUrls.thumbnail_2_url || currentListing.thumbnail_2_url;
                imageUrls.thumbnail_3_url = imageUrls.thumbnail_3_url || currentListing.thumbnail_3_url;
                imageUrls.thumbnail_4_url = imageUrls.thumbnail_4_url || currentListing.thumbnail_4_url;
            }

            console.log('[saveListing] Final image URLs:', imageUrls);
            console.log('[saveListing] Current listing data after deletions:', currentListing);

            // Get the main image URL (either uploaded or existing)
            const imageUrl = this.uploadedMainImageUrl || imageUrls.main_image_url || this.getExistingMainImage() || '/HOT_WHEELS_IMAGES/placeholder.jpg';

            // Collect current toggle states
            const toggleStates = {};
            document.querySelectorAll('input[type="checkbox"][id^="toggle-"]').forEach(toggle => {
                toggleStates[toggle.id] = toggle.checked;
            });

            // Collect T-shirt sizes and colors
            const tshirtSizes = [];
            const tshirtColors = [];
            
            // Get selected sizes
            document.querySelectorAll('input[name="sizes"]:checked').forEach(checkbox => {
                tshirtSizes.push(checkbox.value);
            });
            
            // Get selected colors
            document.querySelectorAll('input[name="tshirt_colors"]:checked').forEach(checkbox => {
                tshirtColors.push(checkbox.value);
            });
            
            console.log('👕 [T-shirt] Collected sizes:', tshirtSizes);
            console.log('👕 [T-shirt] Collected colors:', tshirtColors);
            
            // Add sizes and colors to toggle_settings
            if (tshirtSizes.length > 0) {
                toggleStates.sizes = tshirtSizes;
            }
            if (tshirtColors.length > 0) {
                toggleStates.colors = tshirtColors;
            }

            // Collect Tumbler Size Guide data
            const tumblerGuideTitle = document.getElementById('tumbler-guide-title')?.value || 'Size guide';
            const tumblerGuideData = document.getElementById('tumbler-guide-data')?.value || '{"20oz": {"width": "2 7/8", "length": "8 3/8"}}';
            
            console.log('🥤 [Tumbler] Collected guide title:', tumblerGuideTitle);
            console.log('🥤 [Tumbler] Collected guide data:', tumblerGuideData);

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
                main_image_url: this.uploadedMainImageUrl || imageUrls.main_image_url,
                thumbnail_1_url: imageUrls.thumbnail_1_url,
                thumbnail_2_url: imageUrls.thumbnail_2_url,
                thumbnail_3_url: imageUrls.thumbnail_3_url,
                thumbnail_4_url: imageUrls.thumbnail_4_url,
                detailed_description: document.getElementById('listing-detailed-description')?.value || null,
                original_price: document.getElementById('listing-original-price')?.value ? parseFloat(document.getElementById('listing-original-price').value) : null,
                stock_quantity: document.getElementById('listing-stock')?.value ? parseInt(document.getElementById('listing-stock').value) : null,
                toggle_settings: toggleStates,
                tumbler_guide_title: tumblerGuideTitle,
                tumbler_guide_data: tumblerGuideData
            };

            console.log('[saveListing] Assembled listingData object:', listingData);

            // Send to new update API endpoint
            console.log('[saveListing] Sending POST request to /api/homepage-listings/update...');
            const response = await fetch('/api/homepage-listings/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    listingId: this.currentListing,
                    updates: listingData
                })
            });
            console.log('[saveListing] PUT request sent. Response status:', response.status);

            const result = await response.json();
            console.log('[saveListing] Parsed JSON response:', result);

            if (result.success) {
                this.showMessage('Listing updated successfully!', 'success');
                // Re-fetch all listings to get the updated data
                await this.loadListings();
                // Re-populate the current form with fresh data
                if (this.currentListing) {
                    const updatedListing = this.listings[this.currentListing];
                    if (updatedListing) {
                        this.populateImageSlots(updatedListing);
                        this.updateImagePreview(updatedListing.image_url);
                    }
                }
                // Don't close modal or refresh homepage - let user continue editing
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

    refreshHomepage() {
        // Open homepage in a new tab to show updated data
        const homepageUrl = '/pages/homepage.html';
        window.open(homepageUrl, '_blank');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomepageListings();
});
