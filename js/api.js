// Hot Wheels Velocity API Client
class HotWheelsAPI {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getProfile() {
    return await this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(currentPassword, newPassword) {
    return await this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // Product methods
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/products?${params}`);
  }

  async getProduct(id) {
    return await this.request(`/products/${id}`);
  }

  async getProductBySlug(slug) {
    return await this.request(`/products/slug/${slug}`);
  }

  async getFeaturedProducts(limit = 8) {
    return await this.request(`/products/featured?limit=${limit}`);
  }

  async searchProducts(query, limit = 12) {
    return await this.request(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getProductsByCategory(categorySlug, limit = 12) {
    return await this.request(`/products/category/${categorySlug}?limit=${limit}`);
  }

  async getProductReviews(productId, page = 1, limit = 10) {
    return await this.request(`/products/${productId}/reviews?page=${page}&limit=${limit}`);
  }

  async getCategories() {
    return await this.request('/categories');
  }

  async getProductFilters() {
    return await this.request('/products/filters');
  }

  // Cart methods
  async getCart() {
    return await this.request('/cart');
  }

  async addToCart(productId, quantity = 1) {
    return await this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  }

  async updateCartItem(productId, quantity) {
    return await this.request(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  }

  async removeFromCart(productId) {
    return await this.request(`/cart/${productId}`, {
      method: 'DELETE'
    });
  }

  async clearCart() {
    return await this.request('/cart', {
      method: 'DELETE'
    });
  }

  async getCartCount() {
    return await this.request('/cart/count');
  }

  async validateCart() {
    return await this.request('/cart/validate');
  }

  async mergeCart() {
    return await this.request('/cart/merge', {
      method: 'POST'
    });
  }

  // Utility methods
  async healthCheck() {
    return await this.request('/health');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current user from token (basic implementation)
  getCurrentUser() {
    if (!this.token) return null;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }
}

// Create global API instance
window.hotWheelsAPI = new HotWheelsAPI();

// Utility functions for common operations
window.HotWheelsUtils = {
  // Format price
  formatPrice: (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  },

  // Format date
  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show notification
  showNotification: (message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '4px',
      color: 'white',
      fontWeight: '500',
      zIndex: '10000',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });

    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  },

  // Handle API errors
  handleError: (error) => {
    console.error('API Error:', error);
    window.HotWheelsUtils.showNotification(
      error.message || 'An error occurred',
      'error'
    );
  }
};

// Initialize API on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (window.hotWheelsAPI.isAuthenticated()) {
    // Update UI to show logged in state
    const loginElements = document.querySelectorAll('.login-required');
    loginElements.forEach(el => el.style.display = 'block');
    
    const logoutElements = document.querySelectorAll('.logout-required');
    logoutElements.forEach(el => el.style.display = 'none');
  } else {
    // Update UI to show logged out state
    const loginElements = document.querySelectorAll('.login-required');
    loginElements.forEach(el => el.style.display = 'none');
    
    const logoutElements = document.querySelectorAll('.logout-required');
    logoutElements.forEach(el => el.style.display = 'block');
  }

  // Load cart count
  window.hotWheelsAPI.getCartCount()
    .then(response => {
      const cartCount = response.data.count;
      const cartBadges = document.querySelectorAll('.cart-count');
      cartBadges.forEach(badge => {
        badge.textContent = cartCount;
        badge.style.display = cartCount > 0 ? 'inline' : 'none';
      });
    })
    .catch(error => {
      console.log('Could not load cart count:', error.message);
    });
});
