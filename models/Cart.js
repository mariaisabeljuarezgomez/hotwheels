// Cart model for Hot Wheels Velocity
const { query, transaction } = require('../config/database');
const Product = require('./Product');

class Cart {
  constructor(userId, sessionId = null) {
    this.userId = userId;
    this.sessionId = sessionId;
  }

  // Add item to cart
  async addItem(productId, quantity = 1) {
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isInStock()) {
      throw new Error('Product is out of stock');
    }

    if (quantity > product.stockQuantity) {
      throw new Error('Not enough stock available');
    }

    return await transaction(async (client) => {
      // Check if item already exists in cart
      const existingItem = await client.query(
        this.userId 
          ? 'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2'
          : 'SELECT * FROM cart_items WHERE session_id = $1 AND product_id = $2',
        this.userId ? [this.userId, productId] : [this.sessionId, productId]
      );

      if (existingItem.rows.length > 0) {
        // Update existing item
        const newQuantity = existingItem.rows[0].quantity + quantity;
        if (newQuantity > product.stockQuantity) {
          throw new Error('Not enough stock available');
        }

        const result = await client.query(
          'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          [newQuantity, existingItem.rows[0].id]
        );
        return result.rows[0];
      } else {
        // Add new item
        const result = await client.query(
          `INSERT INTO cart_items (user_id, session_id, product_id, quantity, price_at_time)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [this.userId, this.sessionId, productId, quantity, product.price]
        );
        return result.rows[0];
      }
    });
  }

  // Update item quantity
  async updateItemQuantity(productId, quantity) {
    if (quantity <= 0) {
      return await this.removeItem(productId);
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (quantity > product.stockQuantity) {
      throw new Error('Not enough stock available');
    }

    const result = await query(
      `UPDATE cart_items 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE ${this.userId ? 'user_id = $2' : 'session_id = $2'} AND product_id = $3
       RETURNING *`,
      [quantity, this.userId || this.sessionId, productId]
    );

    if (result.rows.length === 0) {
      throw new Error('Item not found in cart');
    }

    return result.rows[0];
  }

  // Remove item from cart
  async removeItem(productId) {
    const result = await query(
      `DELETE FROM cart_items 
       WHERE ${this.userId ? 'user_id = $1' : 'session_id = $1'} AND product_id = $2
       RETURNING *`,
      [this.userId || this.sessionId, productId]
    );

    return result.rows[0];
  }

  // Get all cart items with product details
  async getItems() {
    const result = await query(
      `SELECT ci.*, 
              p.name, p.slug, p.price, p.stock_quantity, p.is_active,
              pi.image_url as primary_image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE ${this.userId ? 'ci.user_id = $1' : 'ci.session_id = $1'}
       ORDER BY ci.created_at DESC`,
      [this.userId || this.sessionId]
    );

    return result.rows;
  }

  // Get cart summary
  async getSummary() {
    const items = await this.getItems();
    
    const summary = {
      items: items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + (item.price_at_time * item.quantity), 0),
      tax: 0, // Will be calculated based on location
      shipping: 0, // Will be calculated based on shipping method
      total: 0
    };

    // Calculate tax (simplified - 8.5% for demo)
    summary.tax = summary.subtotal * 0.085;
    
    // Calculate shipping (free over $50, otherwise $5.99)
    summary.shipping = summary.subtotal >= 50 ? 0 : 5.99;
    
    summary.total = summary.subtotal + summary.tax + summary.shipping;

    return summary;
  }

  // Clear cart
  async clear() {
    await query(
      `DELETE FROM cart_items WHERE ${this.userId ? 'user_id = $1' : 'session_id = $1'}`,
      [this.userId || this.sessionId]
    );
  }

  // Merge session cart with user cart (when user logs in)
  async mergeWithUserCart(userId) {
    if (!this.sessionId) {
      throw new Error('No session cart to merge');
    }

    return await transaction(async (client) => {
      // Get session cart items
      const sessionItems = await client.query(
        'SELECT * FROM cart_items WHERE session_id = $1',
        [this.sessionId]
      );

      for (const sessionItem of sessionItems.rows) {
        // Check if user already has this item
        const existingUserItem = await client.query(
          'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
          [userId, sessionItem.product_id]
        );

        if (existingUserItem.rows.length > 0) {
          // Merge quantities
          const newQuantity = existingUserItem.rows[0].quantity + sessionItem.quantity;
          await client.query(
            'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newQuantity, existingUserItem.rows[0].id]
          );
        } else {
          // Transfer session item to user
          await client.query(
            'UPDATE cart_items SET user_id = $1, session_id = NULL WHERE id = $2',
            [userId, sessionItem.id]
          );
        }
      }

      // Clear session cart
      await client.query('DELETE FROM cart_items WHERE session_id = $1', [this.sessionId]);
    });
  }

  // Validate cart items (check stock, prices, etc.)
  async validateItems() {
    const items = await this.getItems();
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    for (const item of items) {
      // Check if product is still active
      if (!item.is_active) {
        validation.errors.push(`Product "${item.name}" is no longer available`);
        validation.isValid = false;
        continue;
      }

      // Check stock
      if (item.quantity > item.stock_quantity) {
        validation.errors.push(`Not enough stock for "${item.name}". Available: ${item.stock_quantity}`);
        validation.isValid = false;
      }

      // Check price changes
      if (item.price_at_time !== item.price) {
        validation.warnings.push(`Price changed for "${item.name}". Old: $${item.price_at_time}, New: $${item.price}`);
      }
    }

    return validation;
  }

  // Get cart count
  async getItemCount() {
    const result = await query(
      `SELECT COALESCE(SUM(quantity), 0) as count
       FROM cart_items 
       WHERE ${this.userId ? 'user_id = $1' : 'session_id = $1'}`,
      [this.userId || this.sessionId]
    );

    return parseInt(result.rows[0].count);
  }
}

module.exports = Cart;
