// Cart Controller for Hot Wheels Velocity
const { validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const { isUsingMockData, getMockHelpers } = require('../config/database');

// Get cart items
exports.getCart = async (req, res) => {
  try {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const cart = mockHelpers.getCart(req.userId, req.sessionID);
      
      res.json({
        success: true,
        data: cart
      });
    } else {
      const cart = new Cart(req.userId, req.sessionID);
      const summary = await cart.getSummary();

      res.json({
        success: true,
        data: summary
      });
    }
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId, quantity = 1 } = req.body;

    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const result = mockHelpers.addToCart(req.userId, req.sessionID, productId, quantity);
      
      res.json({
        success: true,
        message: 'Item added to cart successfully',
        data: result
      });
    } else {
      const cart = new Cart(req.userId, req.sessionID);
      const cartItem = await cart.addItem(productId, quantity);

      // Get updated cart summary
      const summary = await cart.getSummary();

      res.json({
        success: true,
        message: 'Item added to cart successfully',
        data: {
          cartItem,
          summary
        }
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const result = mockHelpers.updateCartItem(req.userId, req.sessionID, productId, quantity);
      
      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: result
      });
    } else {
      const cart = new Cart(req.userId, req.sessionID);
      const cartItem = await cart.updateItemQuantity(productId, quantity);

      // Get updated cart summary
      const summary = await cart.getSummary();

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: {
          cartItem,
          summary
        }
      });
    }
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const result = mockHelpers.removeFromCart(req.userId, req.sessionID, productId);
      
      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: result
      });
    } else {
      const cart = new Cart(req.userId, req.sessionID);
      const cartItem = await cart.removeItem(productId);

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      // Get updated cart summary
      const summary = await cart.getSummary();

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: {
          summary
        }
      });
    }
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const result = mockHelpers.clearCart(req.userId, req.sessionID);
      
      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: result
      });
    } else {
      const cart = new Cart(req.userId, req.sessionID);
      await cart.clear();

      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    }
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Get cart count
exports.getCartCount = async (req, res) => {
  try {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const count = mockHelpers.getCartCount(req.userId, req.sessionID);
      
      res.json({
        success: true,
        data: {
          count
        }
      });
    } else {
      const cart = new Cart(req.userId, req.sessionID);
      const count = await cart.getItemCount();

      res.json({
        success: true,
        data: {
          count
        }
      });
    }
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart count',
      error: error.message
    });
  }
};

// Validate cart items
exports.validateCart = async (req, res) => {
  try {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const validation = mockHelpers.validateCart(req.userId, req.sessionID);
      
      res.json({
        success: true,
        data: validation
      });
    } else {
      const cart = new Cart(req.userId, req.sessionID);
      const validation = await cart.validateItems();

      res.json({
        success: true,
        data: validation
      });
    }
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart',
      error: error.message
    });
  }
};

// Merge session cart with user cart (called after login)
exports.mergeCart = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User must be authenticated'
      });
    }

    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const result = mockHelpers.mergeCart(req.userId, req.sessionID, []);
      
      res.json({
        success: true,
        message: 'Cart merged successfully',
        data: result
      });
    } else {
      const cart = new Cart(null, req.sessionID);
      await cart.mergeWithUserCart(req.userId);

      // Get updated cart summary
      const userCart = new Cart(req.userId);
      const summary = await userCart.getSummary();

      res.json({
        success: true,
        message: 'Cart merged successfully',
        data: summary
      });
    }
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge cart',
      error: error.message
    });
  }
};
