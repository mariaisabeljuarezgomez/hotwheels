// Hot Wheels Product Management
class ProductManager {
  constructor() {
    this.currentPage = 1;
    this.currentFilters = {};
    this.isLoading = false;
    this.products = [];
    this.categories = [];
  }

  // Initialize product manager
  async init() {
    await this.loadCategories();
    await this.loadProducts();
    this.setupEventListeners();
  }

  // Load categories
  async loadCategories() {
    try {
      const response = await window.hotWheelsAPI.getCategories();
      this.categories = response.data.categories;
      this.renderCategoryFilter();
    } catch (error) {
      window.HotWheelsUtils.handleError(error);
    }
  }

  // Load products with current filters
  async loadProducts(page = 1) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.currentPage = page;
    
    try {
      const filters = {
        page,
        limit: 12,
        ...this.currentFilters
      };

      const response = await window.hotWheelsAPI.getProducts(filters);
      this.products = response.data.products;
      
      this.renderProducts();
      this.renderPagination(response.data.pagination);
      this.updateLoadingState(false);
    } catch (error) {
      window.HotWheelsUtils.handleError(error);
      this.updateLoadingState(false);
    }
  }

  // Load featured products
  async loadFeaturedProducts() {
    try {
      const response = await window.hotWheelsAPI.getFeaturedProducts(8);
      this.renderFeaturedProducts(response.data.products);
    } catch (error) {
      window.HotWheelsUtils.handleError(error);
    }
  }

  // Search products
  async searchProducts(query) {
    if (!query || query.trim().length < 2) {
      await this.loadProducts();
      return;
    }

    try {
      const response = await window.hotWheelsAPI.searchProducts(query.trim());
      this.products = response.data.products;
      this.renderProducts();
      this.renderSearchResults(query.trim());
    } catch (error) {
      window.HotWheelsUtils.handleError(error);
    }
  }

  // Apply filters
  applyFilters(filters) {
    this.currentFilters = { ...filters };
    this.currentPage = 1;
    this.loadProducts();
  }

  // Clear filters
  clearFilters() {
    this.currentFilters = {};
    this.currentPage = 1;
    this.loadProducts();
  }

  // Render products grid
  renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (this.products.length === 0) {
      container.innerHTML = `
        <div class="no-products">
          <h3>No products found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      `;
      return;
    }

    const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
    container.innerHTML = productsHTML;
  }

  // Create product card HTML
  createProductCard(product) {
    const discountPercentage = product.comparePrice ? 
      Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
    
    const stockStatus = product.stockQuantity > 0 ? 
      (product.stockQuantity <= product.minStockLevel ? 'low-stock' : 'in-stock') : 'out-of-stock';

    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-image">
          ${product.primaryImage ? 
            `<img src="${product.primaryImage}" alt="${product.name}" loading="lazy">` :
            `<div class="no-image">No Image</div>`
          }
          ${discountPercentage > 0 ? `<div class="discount-badge">-${discountPercentage}%</div>` : ''}
          ${product.isFeatured ? `<div class="featured-badge">Featured</div>` : ''}
          <div class="product-overlay">
            <button class="btn btn-primary quick-view" data-product-id="${product.id}">
              Quick View
            </button>
            <button class="btn btn-secondary add-to-cart" data-product-id="${product.id}">
              Add to Cart
            </button>
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-name">
            <a href="/pages/product-detail.html?id=${product.id}">${product.name}</a>
          </h3>
          <div class="product-meta">
            <span class="product-series">${product.series || 'Hot Wheels'}</span>
            ${product.yearReleased ? `<span class="product-year">${product.yearReleased}</span>` : ''}
          </div>
          <div class="product-rating">
            ${this.renderRating(product.averageRating || 0)}
            <span class="rating-count">(${product.reviewCount || 0})</span>
          </div>
          <div class="product-price">
            ${product.comparePrice ? 
              `<span class="original-price">${window.HotWheelsUtils.formatPrice(product.comparePrice)}</span>` : ''
            }
            <span class="current-price">${window.HotWheelsUtils.formatPrice(product.price)}</span>
          </div>
          <div class="product-stock ${stockStatus}">
            ${this.getStockText(product.stockQuantity, product.minStockLevel)}
          </div>
        </div>
      </div>
    `;
  }

  // Render rating stars
  renderRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<span class="star filled">★</span>';
    }
    
    // Half star
    if (hasHalfStar) {
      starsHTML += '<span class="star half">★</span>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<span class="star empty">★</span>';
    }

    return starsHTML;
  }

  // Get stock status text
  getStockText(stockQuantity, minStockLevel) {
    if (stockQuantity === 0) return 'Out of Stock';
    if (stockQuantity <= minStockLevel) return `Only ${stockQuantity} left`;
    return 'In Stock';
  }

  // Render featured products
  renderFeaturedProducts(products) {
    const container = document.getElementById('featured-products');
    if (!container) return;

    const productsHTML = products.map(product => this.createProductCard(product)).join('');
    container.innerHTML = productsHTML;
  }

  // Render category filter
  renderCategoryFilter() {
    const container = document.getElementById('category-filter');
    if (!container) return;

    const categoriesHTML = this.categories.map(category => 
      `<option value="${category.slug}">${category.name}</option>`
    ).join('');

    container.innerHTML = `
      <option value="">All Categories</option>
      ${categoriesHTML}
    `;
  }

  // Render pagination
  renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || pagination.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let paginationHTML = '';

    // Previous button
    if (pagination.hasPrev) {
      paginationHTML += `
        <button class="pagination-btn" data-page="${pagination.currentPage - 1}">
          Previous
        </button>
      `;
    }

    // Page numbers
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="pagination-btn ${i === pagination.currentPage ? 'active' : ''}" 
                data-page="${i}">
          ${i}
        </button>
      `;
    }

    // Next button
    if (pagination.hasNext) {
      paginationHTML += `
        <button class="pagination-btn" data-page="${pagination.currentPage + 1}">
          Next
        </button>
      `;
    }

    container.innerHTML = paginationHTML;
  }

  // Render search results header
  renderSearchResults(query) {
    const container = document.getElementById('search-results');
    if (!container) return;

    container.innerHTML = `
      <h2>Search Results for "${query}"</h2>
      <p>Found ${this.products.length} products</p>
    `;
  }

  // Update loading state
  updateLoadingState(loading) {
    this.isLoading = loading;
    const container = document.getElementById('products-container');
    if (!container) return;

    if (loading) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading products...</p>
        </div>
      `;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      const debouncedSearch = window.HotWheelsUtils.debounce((e) => {
        this.searchProducts(e.target.value);
      }, 300);
      
      searchInput.addEventListener('input', debouncedSearch);
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        const filters = { ...this.currentFilters };
        if (e.target.value) {
          filters.category = e.target.value;
        } else {
          delete filters.category;
        }
        this.applyFilters(filters);
      });
    }

    // Price range filter
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    
    if (priceMin) {
      priceMin.addEventListener('change', () => {
        const filters = { ...this.currentFilters };
        if (priceMin.value) {
          filters.minPrice = priceMin.value;
        } else {
          delete filters.minPrice;
        }
        this.applyFilters(filters);
      });
    }

    if (priceMax) {
      priceMax.addEventListener('change', () => {
        const filters = { ...this.currentFilters };
        if (priceMax.value) {
          filters.maxPrice = priceMax.value;
        } else {
          delete filters.maxPrice;
        }
        this.applyFilters(filters);
      });
    }

    // Sort options
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [sortBy, sortOrder] = e.target.value.split('-');
        const filters = { ...this.currentFilters, sortBy, sortOrder };
        this.applyFilters(filters);
      });
    }

    // Pagination
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('pagination-btn')) {
        const page = parseInt(e.target.dataset.page);
        this.loadProducts(page);
      }
    });

    // Add to cart buttons
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('add-to-cart')) {
        const productId = parseInt(e.target.dataset.productId);
        await this.addToCart(productId);
      }
    });

    // Quick view buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-view')) {
        const productId = parseInt(e.target.dataset.productId);
        this.showQuickView(productId);
      }
    });
  }

  // Add product to cart
  async addToCart(productId) {
    try {
      const response = await window.hotWheelsAPI.addToCart(productId, 1);
      window.HotWheelsUtils.showNotification(
        'Product added to cart!',
        'success'
      );
      
      // Update cart count
      this.updateCartCount();
    } catch (error) {
      window.HotWheelsUtils.handleError(error);
    }
  }

  // Update cart count in UI
  async updateCartCount() {
    try {
      const response = await window.hotWheelsAPI.getCartCount();
      const cartCount = response.data.count;
      const cartBadges = document.querySelectorAll('.cart-count');
      cartBadges.forEach(badge => {
        badge.textContent = cartCount;
        badge.style.display = cartCount > 0 ? 'inline' : 'none';
      });
    } catch (error) {
      console.log('Could not update cart count:', error.message);
    }
  }

  // Show quick view modal
  async showQuickView(productId) {
    try {
      const response = await window.hotWheelsAPI.getProduct(productId);
      const product = response.data.product;
      
      // Create and show modal
      this.createQuickViewModal(product);
    } catch (error) {
      window.HotWheelsUtils.handleError(error);
    }
  }

  // Create quick view modal
  createQuickViewModal(product) {
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <button class="modal-close">&times;</button>
          <div class="modal-body">
            <div class="product-image">
              ${product.primaryImage ? 
                `<img src="${product.primaryImage}" alt="${product.name}">` :
                `<div class="no-image">No Image</div>`
              }
            </div>
            <div class="product-details">
              <h2>${product.name}</h2>
              <div class="product-meta">
                <span class="product-series">${product.series || 'Hot Wheels'}</span>
                ${product.yearReleased ? `<span class="product-year">${product.yearReleased}</span>` : ''}
              </div>
              <div class="product-price">
                ${product.comparePrice ? 
                  `<span class="original-price">${window.HotWheelsUtils.formatPrice(product.comparePrice)}</span>` : ''
                }
                <span class="current-price">${window.HotWheelsUtils.formatPrice(product.price)}</span>
              </div>
              <div class="product-description">
                ${product.shortDescription || product.description || 'No description available.'}
              </div>
              <div class="product-actions">
                <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                  Add to Cart
                </button>
                <a href="/pages/product-detail.html?id=${product.id}" class="btn btn-secondary">
                  View Details
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal handlers
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.body.removeChild(modal);
      }
    });

    // Add to cart in modal
    modal.querySelector('.add-to-cart').addEventListener('click', async () => {
      await this.addToCart(product.id);
      document.body.removeChild(modal);
    });
  }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.productManager = new ProductManager();
  window.productManager.init();
});
