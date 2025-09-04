// Shopping Cart JavaScript for Hot Wheels Velocity
class ShoppingCart {
    constructor() {
        this.items = [];
        this.total = 0;
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    setupEventListeners() {
        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                const productName = e.target.getAttribute('data-product-name');
                const productPrice = parseFloat(e.target.getAttribute('data-product-price'));
                const productImage = e.target.getAttribute('data-product-image');
                
                this.addItem({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            }
        });

        // Cart quantity updates
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('cart-quantity')) {
                const productId = e.target.getAttribute('data-product-id');
                const quantity = parseInt(e.target.value);
                this.updateQuantity(productId, quantity);
            }
        });

        // Remove from cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-from-cart-btn')) {
                const productId = e.target.getAttribute('data-product-id');
                this.removeItem(productId);
            }
        });
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push(product);
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showMessage(`${product.name} added to cart!`, 'success');
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.showMessage('Item removed from cart', 'info');
    }

    updateQuantity(productId, quantity) {
        if (quantity <= 0) {
            this.removeItem(productId);
            return;
        }

        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartDisplay();
        }
    }

    calculateTotal() {
        this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return this.total;
    }

    updateCartDisplay() {
        this.calculateTotal();
        
        // Update cart count
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }

        // Update cart total
        const cartTotal = document.querySelector('.cart-total');
        if (cartTotal) {
            cartTotal.textContent = `$${this.total.toFixed(2)}`;
        }

        // Update cart items list
        const cartItems = document.querySelector('.cart-items');
        if (cartItems) {
            this.renderCartItems(cartItems);
        }
    }

    renderCartItems(container) {
        if (this.items.length === 0) {
            container.innerHTML = '<p class="text-text-secondary">Your cart is empty</p>';
            return;
        }

        container.innerHTML = this.items.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-controls">
                        <input type="number" 
                               class="cart-quantity" 
                               data-product-id="${item.id}"
                               value="${item.quantity}" 
                               min="1" 
                               max="99">
                        <button class="remove-from-cart-btn" data-product-id="${item.id}">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    saveCart() {
        localStorage.setItem('hotwheels_cart', JSON.stringify(this.items));
    }

    loadCart() {
        const savedCart = localStorage.getItem('hotwheels_cart');
        if (savedCart) {
            try {
                this.items = JSON.parse(savedCart);
            } catch (e) {
                console.error('Error loading cart:', e);
                this.items = [];
            }
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
        this.showMessage('Cart cleared', 'info');
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.querySelector('.cart-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'cart-message';
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.className = `cart-message cart-message-${type}`;
        messageEl.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }

    // Get cart data for API calls
    getCartData() {
        return {
            items: this.items,
            total: this.total,
            itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0)
        };
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shoppingCart = new ShoppingCart();
});

// Export for use in other scripts
window.ShoppingCart = ShoppingCart;
