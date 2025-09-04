// Admin Dashboard JavaScript

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.products = [];
        this.orders = [];
        this.users = [];
        this.categories = [];
        this.currentProduct = null;
        this.currentCategory = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDashboardData();
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.admin-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Product management
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.showProductModal();
        });

        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Category management
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.showCategoryModal();
        });

        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Search and filters
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.filterProducts();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterProducts();
        });

        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filterProducts();
        });
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.admin-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'products':
                this.loadProducts();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading();
            
            // Load stats
            const [productsRes, ordersRes, usersRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/admin/orders'),
                fetch('/api/admin/users')
            ]);

            const productsData = await productsRes.json();
            const ordersData = await ordersRes.json();
            const usersData = await usersRes.json();

            // Update stats
            document.getElementById('total-products').textContent = productsData.data?.products?.length || 0;
            document.getElementById('total-orders').textContent = ordersData.data?.orders?.length || 0;
            document.getElementById('total-users').textContent = usersData.data?.users?.length || 0;
            
            // Calculate total revenue
            const totalRevenue = ordersData.data?.orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

            // Load recent orders
            this.loadRecentOrders(ordersData.data?.orders || []);
            
            // Load low stock products
            this.loadLowStockProducts(productsData.data?.products || []);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.hideLoading();
        }
    }

    loadRecentOrders(orders) {
        const container = document.getElementById('recent-orders');
        const recentOrders = orders.slice(0, 5);

        if (recentOrders.length === 0) {
            container.innerHTML = '<div class="loading">No recent orders</div>';
            return;
        }

        container.innerHTML = recentOrders.map(order => `
            <div class="admin-list-item">
                <div>
                    <strong>Order #${order.id}</strong>
                    <div class="text-muted">${order.customer_name || 'Guest'}</div>
                </div>
                <div class="text-right">
                    <div>$${order.total?.toFixed(2) || '0.00'}</div>
                    <span class="status-badge ${order.status}">${order.status}</span>
                </div>
            </div>
        `).join('');
    }

    loadLowStockProducts(products) {
        const container = document.getElementById('low-stock');
        const lowStockProducts = products.filter(p => p.stock_quantity < 5);

        if (lowStockProducts.length === 0) {
            container.innerHTML = '<div class="loading">All products are well stocked</div>';
            return;
        }

        container.innerHTML = lowStockProducts.map(product => `
            <div class="admin-list-item">
                <div>
                    <strong>${product.name}</strong>
                    <div class="text-muted">SKU: ${product.sku}</div>
                </div>
                <div class="text-right">
                    <span class="status-badge ${product.stock_quantity < 2 ? 'cancelled' : 'pending'}">
                        ${product.stock_quantity} left
                    </span>
                </div>
            </div>
        `).join('');
    }

    async loadProducts() {
        try {
            this.showLoading();
            const response = await fetch('/api/products');
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data.products || [];
                this.renderProductsTable();
                this.loadCategoriesForFilter();
            } else {
                this.showError('Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        } finally {
            this.hideLoading();
        }
    }

    renderProductsTable() {
        const tbody = document.getElementById('products-table-body');
        
        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td>
                    <img src="${product.primary_image || '../HOT WHEELS IMAGES/hot-wheels-1.jpeg'}" 
                         alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                </td>
                <td>
                    <strong>${product.name}</strong>
                    <div class="text-muted">${product.series || 'N/A'}</div>
                </td>
                <td>${product.sku}</td>
                <td>$${product.price?.toFixed(2) || '0.00'}</td>
                <td>
                    <span class="${product.stock_quantity < 5 ? 'text-danger' : ''}">
                        ${product.stock_quantity || 0}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${product.is_active ? 'active' : 'inactive'}">
                        ${product.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="admin.editProduct(${product.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-action btn-delete" onclick="admin.deleteProduct(${product.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadCategoriesForFilter() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('category-filter');
                select.innerHTML = '<option value="">All Categories</option>' +
                    data.data.categories.map(cat => 
                        `<option value="${cat.slug}">${cat.name}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    filterProducts() {
        const search = document.getElementById('product-search').value.toLowerCase();
        const category = document.getElementById('category-filter').value;
        const status = document.getElementById('status-filter').value;

        let filtered = this.products;

        if (search) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(search) ||
                p.sku.toLowerCase().includes(search) ||
                p.series?.toLowerCase().includes(search)
            );
        }

        if (category) {
            // This would need to be implemented with proper category filtering
            // For now, we'll just show all products
        }

        if (status) {
            filtered = filtered.filter(p => {
                if (status === 'active') return p.is_active;
                if (status === 'inactive') return !p.is_active;
                return true;
            });
        }

        // Re-render with filtered data
        const originalProducts = this.products;
        this.products = filtered;
        this.renderProductsTable();
        this.products = originalProducts;
    }

    showProductModal(product = null) {
        this.currentProduct = product;
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');

        if (product) {
            title.textContent = 'Edit Product';
            // Populate form with product data
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-sku').value = product.sku || '';
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-price').value = product.price || '';
            document.getElementById('product-stock').value = product.stock_quantity || '';
            document.getElementById('product-series').value = product.series || '';
            document.getElementById('product-year').value = product.year_released || '';
            document.getElementById('product-rarity').value = product.rarity_level || 'Common';
            document.getElementById('product-featured').checked = product.is_featured || false;
            document.getElementById('product-active').checked = product.is_active !== false;
        } else {
            title.textContent = 'Add Product';
            form.reset();
        }

        modal.classList.add('active');
    }

    async saveProduct() {
        try {
            this.showLoading();
            
            const formData = {
                name: document.getElementById('product-name').value,
                sku: document.getElementById('product-sku').value,
                description: document.getElementById('product-description').value,
                price: parseFloat(document.getElementById('product-price').value),
                stock_quantity: parseInt(document.getElementById('product-stock').value),
                series: document.getElementById('product-series').value,
                year_released: parseInt(document.getElementById('product-year').value) || null,
                rarity_level: document.getElementById('product-rarity').value,
                is_featured: document.getElementById('product-featured').checked,
                is_active: document.getElementById('product-active').checked
            };

            const url = this.currentProduct ? `/api/products/${this.currentProduct.id}` : '/api/products';
            const method = this.currentProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.closeModals();
                this.loadProducts();
                this.showSuccess(this.currentProduct ? 'Product updated successfully' : 'Product created successfully');
            } else {
                this.showError(data.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('Failed to save product');
        } finally {
            this.hideLoading();
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.loadProducts();
                this.showSuccess('Product deleted successfully');
            } else {
                this.showError(data.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Failed to delete product');
        } finally {
            this.hideLoading();
        }
    }

    async loadCategories() {
        try {
            this.showLoading();
            const response = await fetch('/api/categories');
            const data = await response.json();
            
            if (data.success) {
                this.categories = data.data.categories || [];
                this.renderCategoriesTable();
            } else {
                this.showError('Failed to load categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Failed to load categories');
        } finally {
            this.hideLoading();
        }
    }

    renderCategoriesTable() {
        const tbody = document.getElementById('categories-table-body');
        
        if (this.categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No categories found</td></tr>';
            return;
        }

        tbody.innerHTML = this.categories.map(category => `
            <tr>
                <td><strong>${category.name}</strong></td>
                <td>${category.slug}</td>
                <td>${category.description || 'N/A'}</td>
                <td>${category.sort_order || 0}</td>
                <td>
                    <span class="status-badge ${category.is_active ? 'active' : 'inactive'}">
                        ${category.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="admin.editCategory(${category.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-action btn-delete" onclick="admin.deleteCategory(${category.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showCategoryModal(category = null) {
        this.currentCategory = category;
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        const form = document.getElementById('category-form');

        if (category) {
            title.textContent = 'Edit Category';
            document.getElementById('category-name').value = category.name || '';
            document.getElementById('category-slug').value = category.slug || '';
            document.getElementById('category-description').value = category.description || '';
            document.getElementById('category-sort').value = category.sort_order || 0;
            document.getElementById('category-active').checked = category.is_active !== false;
        } else {
            title.textContent = 'Add Category';
            form.reset();
        }

        modal.classList.add('active');
    }

    async saveCategory() {
        try {
            this.showLoading();
            
            const formData = {
                name: document.getElementById('category-name').value,
                slug: document.getElementById('category-slug').value,
                description: document.getElementById('category-description').value,
                sort_order: parseInt(document.getElementById('category-sort').value) || 0,
                is_active: document.getElementById('category-active').checked
            };

            const url = this.currentCategory ? `/api/categories/${this.currentCategory.id}` : '/api/categories';
            const method = this.currentCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.closeModals();
                this.loadCategories();
                this.showSuccess(this.currentCategory ? 'Category updated successfully' : 'Category created successfully');
            } else {
                this.showError(data.message || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            this.showError('Failed to save category');
        } finally {
            this.hideLoading();
        }
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            this.showCategoryModal(category);
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.loadCategories();
                this.showSuccess('Category deleted successfully');
            } else {
                this.showError(data.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showError('Failed to delete category');
        } finally {
            this.hideLoading();
        }
    }

    async loadOrders() {
        try {
            this.showLoading();
            const response = await fetch('/api/admin/orders');
            const data = await response.json();
            
            if (data.success) {
                this.orders = data.data.orders || [];
                this.renderOrdersTable();
            } else {
                this.showError('Failed to load orders');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showError('Failed to load orders');
        } finally {
            this.hideLoading();
        }
    }

    renderOrdersTable() {
        const tbody = document.getElementById('orders-table-body');
        
        if (this.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.customer_name}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${order.status}">${order.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="admin.viewOrder('${order.id}')" title="View">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadUsers() {
        try {
            this.showLoading();
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            
            if (data.success) {
                this.users = data.data.users || [];
                this.renderUsersTable();
            } else {
                this.showError('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        } finally {
            this.hideLoading();
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        
        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div style="width: 40px; height: 40px; background: #ff6b35; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${(user.first_name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                </td>
                <td><strong>${user.first_name} ${user.last_name}</strong></td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge ${user.role === 'admin' ? 'active' : 'pending'}">
                        ${user.role}
                    </span>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="admin.viewUser(${user.id})" title="View">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadAnalytics() {
        try {
            this.showLoading();
            
            // Mock analytics data
            document.getElementById('sales-chart').innerHTML = '<div class="loading">Sales chart would be displayed here</div>';
            document.getElementById('top-products').innerHTML = '<div class="loading">Top products would be displayed here</div>';
            
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics');
        } finally {
            this.hideLoading();
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentProduct = null;
        this.currentCategory = null;
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 4000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 4000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear any stored auth data
            localStorage.removeItem('admin_token');
            // Redirect to login or home page
            window.location.href = '/';
        }
    }

    // Placeholder methods for future implementation
    viewOrder(orderId) {
        alert(`View order ${orderId} - This would open order details`);
    }

    viewUser(userId) {
        alert(`View user ${userId} - This would open user details`);
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminDashboard();
});
