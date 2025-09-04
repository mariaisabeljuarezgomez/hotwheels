// Admin Uploads JavaScript - Hot Wheels Velocity

class AdminUploads {
    constructor() {
        this.uploadedImages = [];
        this.mainImageIndex = 0;
        this.products = [];
        this.currentFilters = {
            category: '',
            rarity: '',
            search: ''
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.setupImageUpload();
        this.setupFormValidation();
        this.loadCategories();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submission
        document.getElementById('new-product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProductSubmit();
        });

        // Clear form
        document.getElementById('clear-form').addEventListener('click', () => {
            this.clearForm();
        });

        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchProducts();
        });

        document.getElementById('product-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchProducts();
            }
        });

        // Filter functionality
        document.getElementById('category-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('rarity-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        // Rarity level change handler
        document.getElementById('product-rarity').addEventListener('change', (e) => {
            this.handleRarityChange(e.target.value);
        });

        // Feature checkboxes
        document.querySelectorAll('input[name="features"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateFeatureFlags();
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data for edit tab
        if (tabName === 'edit-product') {
            this.loadProducts();
        }
    }

    setupImageUpload() {
        // Initialize image slots array
        this.imageSlots = Array(5).fill(null);
        
        // Setup individual image slots
        document.querySelectorAll('.image-slot').forEach((slot, index) => {
            this.setupImageSlot(slot, index);
        });
    }

    setupImageSlot(slotElement, slotIndex) {
        const uploadArea = slotElement.querySelector('.image-upload-area');
        const fileInput = slotElement.querySelector('.slot-input');
        const imagePreview = slotElement.querySelector('.image-preview');
        const deleteButton = slotElement.querySelector('.delete-image');

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleSlotImage(e.target.files[0], slotIndex, slotElement);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.handleSlotImage(e.dataTransfer.files[0], slotIndex, slotElement);
            }
        });

        // Delete image
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                this.removeSlotImage(slotIndex, slotElement);
            });
        }
    }

    handleSlotImage(file, slotIndex, slotElement) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            this.showMessage(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`, 'error');
            return;
        }

        if (file.size > maxSize) {
            this.showMessage(`File too large: ${file.name}. Maximum size is 5MB.`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                file: file,
                url: e.target.result,
                name: file.name,
                size: file.size,
                id: Date.now() + Math.random()
            };
            
            // Store image in slot
            this.imageSlots[slotIndex] = imageData;
            
            // Update slot display
            this.updateSlotDisplay(slotElement, imageData);
            
            this.showMessage(`Image uploaded to ${slotIndex === 0 ? 'Main Image' : 'Thumbnail ' + slotIndex} slot!`, 'success');
        };
        reader.readAsDataURL(file);
    }

    updateSlotDisplay(slotElement, imageData) {
        const uploadArea = slotElement.querySelector('.image-upload-area');
        const imagePreview = slotElement.querySelector('.image-preview');
        const img = imagePreview.querySelector('img');

        // Hide upload area and show preview
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
        
        // Set image source
        img.src = imageData.url;
        img.alt = imageData.name;
    }

    removeSlotImage(slotIndex, slotElement) {
        // Clear slot data
        this.imageSlots[slotIndex] = null;
        
        // Reset slot display
        const uploadArea = slotElement.querySelector('.image-upload-area');
        const imagePreview = slotElement.querySelector('.image-preview');
        const fileInput = slotElement.querySelector('.slot-input');
        
        // Show upload area and hide preview
        uploadArea.style.display = 'flex';
        imagePreview.style.display = 'none';
        
        // Clear file input
        fileInput.value = '';
        
        this.showMessage(`Image removed from ${slotIndex === 0 ? 'Main Image' : 'Thumbnail ' + slotIndex} slot!`, 'success');
    }

    handleFileSelect(files) {
        const maxFiles = 5;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (files.length > maxFiles) {
            this.showMessage('Maximum 5 images allowed', 'warning');
            return;
        }

        Array.from(files).forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                this.showMessage(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`, 'error');
                return;
            }

            if (file.size > maxSize) {
                this.showMessage(`File too large: ${file.name}. Maximum size is 5MB.`, 'error');
                return;
            }

            this.processImageFile(file);
        });
    }

    processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                file: file,
                url: e.target.result,
                name: file.name,
                size: file.size,
                isMain: this.uploadedImages.length === 0
            };

            this.uploadedImages.push(imageData);
            this.updateImagePreview();
        };
        reader.readAsDataURL(file);
    }

    updateImagePreview() {
        const previewContainer = document.getElementById('image-preview');
        previewContainer.innerHTML = '';

        this.uploadedImages.forEach((image, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            previewItem.innerHTML = `
                <img src="${image.url}" alt="${image.name}">
                <button type="button" class="remove-btn" onclick="adminUploads.removeImage(${index})">×</button>
                ${image.isMain ? '<span class="main-badge">Main</span>' : ''}
            `;

            // Click to set as main image
            previewItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-btn')) {
                    this.setMainImage(index);
                }
            });

            previewContainer.appendChild(previewItem);
        });
    }

    removeImage(index) {
        this.uploadedImages.splice(index, 1);
        
        // If we removed the main image, set the first remaining as main
        if (this.uploadedImages.length > 0 && index === this.mainImageIndex) {
            this.uploadedImages[0].isMain = true;
            this.mainImageIndex = 0;
        } else if (index < this.mainImageIndex) {
            this.mainImageIndex--;
        }
        
        this.updateImagePreview();
    }

    setMainImage(index) {
        this.uploadedImages.forEach((img, i) => {
            img.isMain = i === index;
        });
        this.mainImageIndex = index;
        this.updateImagePreview();
    }

    handleRarityChange(rarity) {
        // Auto-check relevant feature checkboxes based on rarity
        const treasureHuntCheckbox = document.getElementById('feature-treasure-hunt');
        const superTreasureHuntCheckbox = document.getElementById('feature-super-treasure-hunt');

        if (rarity === 'Treasure Hunt') {
            treasureHuntCheckbox.checked = true;
            superTreasureHuntCheckbox.checked = false;
        } else if (rarity === 'Super Treasure Hunt') {
            treasureHuntCheckbox.checked = false;
            superTreasureHuntCheckbox.checked = true;
        } else {
            treasureHuntCheckbox.checked = false;
            superTreasureHuntCheckbox.checked = false;
        }
    }

    updateFeatureFlags() {
        // Update treasure hunt flags based on checkboxes
        const treasureHuntCheckbox = document.getElementById('feature-treasure-hunt');
        const superTreasureHuntCheckbox = document.getElementById('feature-super-treasure-hunt');
        const raritySelect = document.getElementById('product-rarity');

        if (superTreasureHuntCheckbox.checked) {
            raritySelect.value = 'Super Treasure Hunt';
            treasureHuntCheckbox.checked = false;
        } else if (treasureHuntCheckbox.checked) {
            raritySelect.value = 'Treasure Hunt';
            superTreasureHuntCheckbox.checked = false;
        }
    }

    setupFormValidation() {
        const form = document.getElementById('new-product-form');
        const inputs = form.querySelectorAll('input[required], select[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const isValid = value !== '';

        if (isValid) {
            field.classList.remove('error');
            field.classList.add('valid');
        } else {
            field.classList.remove('valid');
            field.classList.add('error');
        }

        return isValid;
    }

    validateForm() {
        const form = document.getElementById('new-product-form');
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate images
        if (this.uploadedImages.length === 0) {
            this.showMessage('Please upload at least one product image', 'error');
            isValid = false;
        }

        return isValid;
    }

    async handleProductSubmit() {
        if (!this.validateForm()) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const formData = this.collectFormData();
            const response = await fetch('/api/admin/products/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Product uploaded successfully!', 'success');
                this.clearForm();
                this.loadProducts(); // Refresh products list
            } else {
                this.showMessage(result.message || 'Failed to upload product', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('An error occurred while uploading the product', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    collectFormData() {
        const form = document.getElementById('new-product-form');
        const formData = new FormData(form);
        const data = {};

        // Collect form fields
        for (let [key, value] of formData.entries()) {
            if (key === 'features') {
                if (!data.features) data.features = [];
                data.features.push(value);
            } else {
                data[key] = value;
            }
        }

        // Add images
        data.images = this.uploadedImages.map(img => ({
            name: img.name,
            size: img.size,
            url: img.url,
            isMain: img.isMain
        }));

        // Add computed fields
        data.is_featured = document.getElementById('is-featured').checked;
        data.is_active = document.getElementById('is-active').checked;
        data.track_inventory = document.getElementById('track-inventory').checked;

        // Process color variations and special features
        if (data.color_variations) {
            data.color_variations = data.color_variations.split(',').map(c => c.trim()).filter(c => c);
        }
        if (data.special_features) {
            data.special_features = data.special_features.split(',').map(f => f.trim()).filter(f => f);
        }
        if (data.tags) {
            data.tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
        }

        return data;
    }

    clearForm() {
        document.getElementById('new-product-form').reset();
        this.uploadedImages = [];
        this.mainImageIndex = 0;
        this.updateImagePreview();
        
        // Clear validation classes
        document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
            field.classList.remove('error', 'valid');
        });

        this.showMessage('Form cleared', 'info');
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/admin/products');
            const result = await response.json();

            if (result.success) {
                this.products = result.data.products;
                this.renderProducts();
            } else {
                this.showMessage('Failed to load products', 'error');
            }
        } catch (error) {
            console.error('Load products error:', error);
            this.showMessage('An error occurred while loading products', 'error');
        }
    }

    renderProducts() {
        const container = document.getElementById('products-list');
        
        if (this.products.length === 0) {
            container.innerHTML = '<div class="loading">No products found</div>';
            return;
        }

        const filteredProducts = this.getFilteredProducts();
        
        if (filteredProducts.length === 0) {
            container.innerHTML = '<div class="loading">No products match your filters</div>';
            return;
        }

        container.innerHTML = filteredProducts.map(product => `
            <div class="product-item">
                <img src="${product.image_url || '/images/placeholder-car.jpg'}" 
                     alt="${product.name}" 
                     class="product-image">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-details">
                        ${product.category} • ${product.rarity_level || 'Common'} • 
                        $${product.price} • Stock: ${product.stock_quantity}
                    </p>
                    <p class="product-details">
                        ${product.series ? `Series: ${product.series}` : ''}
                        ${product.year_released ? ` • Year: ${product.year_released}` : ''}
                    </p>
                </div>
                <div class="product-actions">
                    <button class="btn-action btn-edit" onclick="adminUploads.editProduct(${product.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-action btn-delete" onclick="adminUploads.deleteProduct(${product.id})" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFilteredProducts() {
        return this.products.filter(product => {
            const matchesCategory = !this.currentFilters.category || 
                product.category_id === this.currentFilters.category;
            const matchesRarity = !this.currentFilters.rarity || 
                product.rarity_level === this.currentFilters.rarity;
            const matchesSearch = !this.currentFilters.search || 
                product.name.toLowerCase().includes(this.currentFilters.search.toLowerCase()) ||
                (product.series && product.series.toLowerCase().includes(this.currentFilters.search.toLowerCase()));

            return matchesCategory && matchesRarity && matchesSearch;
        });
    }

    searchProducts() {
        this.currentFilters.search = document.getElementById('product-search').value;
        this.renderProducts();
    }

    applyFilters() {
        this.currentFilters.category = document.getElementById('category-filter').value;
        this.currentFilters.rarity = document.getElementById('rarity-filter').value;
        this.renderProducts();
    }

    async editProduct(productId) {
        // Switch to edit tab and load product data
        this.switchTab('edit-product');
        
        // Find the product
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showMessage('Product not found', 'error');
            return;
        }

        // For now, show a message - we'll implement full editing in the next phase
        this.showMessage(`Edit functionality for "${product.name}" will be implemented in the next phase`, 'info');
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Product deleted successfully', 'success');
                this.loadProducts();
            } else {
                this.showMessage(result.message || 'Failed to delete product', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showMessage('An error occurred while deleting the product', 'error');
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;

        container.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();

            if (data.success) {
                const categorySelect = document.getElementById('product-category');
                if (categorySelect) {
                    // Clear existing options except the first one
                    categorySelect.innerHTML = '<option value="">Select Category</option>';
                    
                    // Add categories from database
                    data.data.categories.forEach(category => {
                        if (category.is_active) {
                            const option = document.createElement('option');
                            option.value = category.id;
                            option.textContent = category.name;
                            categorySelect.appendChild(option);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Load categories error:', error);
            this.showMessage('Failed to load categories', 'error');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminUploads = new AdminUploads();
});

// Add some CSS for form validation
const style = document.createElement('style');
style.textContent = `
    .form-input.error,
    .form-select.error,
    .form-textarea.error {
        border-color: #dc3545;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
    
    .form-input.valid,
    .form-select.valid,
    .form-textarea.valid {
        border-color: #28a745;
        box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
    }
`;
document.head.appendChild(style);
