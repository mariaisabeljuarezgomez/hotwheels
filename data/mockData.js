// Mock data for Hot Wheels Velocity - Fallback when database is unavailable
const mockData = {
  categories: [
    { id: 1, name: 'Redline Collection', slug: 'redline-collection', description: 'Classic 1968-1977 Redline Hot Wheels', sort_order: 1, is_active: true },
    { id: 2, name: 'Modern Mainline', slug: 'modern-mainline', description: 'Current Hot Wheels mainline series', sort_order: 2, is_active: true },
    { id: 3, name: 'Premium Series', slug: 'premium-series', description: 'Premium Hot Wheels with special features', sort_order: 3, is_active: true },
    { id: 4, name: 'Treasure Hunts', slug: 'treasure-hunts', description: 'Rare Treasure Hunt and Super Treasure Hunt cars', sort_order: 4, is_active: true },
    { id: 5, name: 'Team Transport', slug: 'team-transport', description: 'Hot Wheels Team Transport sets', sort_order: 5, is_active: true },
    { id: 6, name: 'Car Culture', slug: 'car-culture', description: 'Car Culture premium series', sort_order: 6, is_active: true }
  ],

  products: [
    {
      id: 1,
      name: '1968 Redline Custom Camaro',
      slug: '1968-redline-custom-camaro',
      description: 'The iconic first-year Redline Hot Wheels Custom Camaro in Spectraflame Red. This legendary casting started it all in 1968.',
      short_description: 'First-year Redline Custom Camaro in Spectraflame Red',
      sku: 'HW-1968-001',
      price: 299.99,
      compare_price: 349.99,
      stock_quantity: 5,
      min_stock_level: 2,
      year_released: 1968,
      series: 'Redline',
      rarity_level: 'Ultra Rare',
      is_featured: true,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-1.jpeg',
      average_rating: 4.8,
      review_count: 12
    },
    {
      id: 2,
      name: '2024 Nissan Skyline GT-R',
      slug: '2024-nissan-skyline-gtr',
      description: 'Modern Hot Wheels casting of the legendary Nissan Skyline GT-R with premium details and authentic styling.',
      short_description: 'Premium Nissan Skyline GT-R with authentic details',
      sku: 'HW-2024-001',
      price: 12.99,
      stock_quantity: 25,
      min_stock_level: 5,
      year_released: 2024,
      series: 'Car Culture',
      rarity_level: 'Common',
      is_featured: true,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-3.jpeg',
      average_rating: 4.5,
      review_count: 8
    },
    {
      id: 3,
      name: 'Treasure Hunt Batmobile',
      slug: 'treasure-hunt-batmobile',
      description: 'Rare Treasure Hunt version of the Batmobile with special paint and hidden TH logo.',
      short_description: 'Rare Treasure Hunt Batmobile with special features',
      sku: 'HW-TH-001',
      price: 89.99,
      stock_quantity: 2,
      min_stock_level: 1,
      year_released: 2024,
      series: 'Treasure Hunt',
      rarity_level: 'Rare',
      is_featured: true,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-5.jpeg',
      average_rating: 4.9,
      review_count: 15
    },
    {
      id: 4,
      name: 'Team Transport Porsche 911',
      slug: 'team-transport-porsche-911',
      description: 'Premium Team Transport set featuring a Porsche 911 on a custom trailer with premium details.',
      short_description: 'Team Transport Porsche 911 with custom trailer',
      sku: 'HW-TT-001',
      price: 24.99,
      stock_quantity: 15,
      min_stock_level: 3,
      year_released: 2024,
      series: 'Team Transport',
      rarity_level: 'Common',
      is_featured: false,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-6.jpg',
      average_rating: 4.3,
      review_count: 6
    },
    {
      id: 5,
      name: 'Super Treasure Hunt Lamborghini',
      slug: 'super-treasure-hunt-lamborghini',
      description: 'Ultra-rare Super Treasure Hunt Lamborghini with Spectraflame paint and Real Riders wheels.',
      short_description: 'Super Treasure Hunt Lamborghini with premium features',
      sku: 'HW-STH-001',
      price: 199.99,
      stock_quantity: 1,
      min_stock_level: 1,
      year_released: 2024,
      series: 'Super Treasure Hunt',
      rarity_level: 'Ultra Rare',
      is_featured: true,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-7.jpeg',
      average_rating: 5.0,
      review_count: 3
    },
    {
      id: 6,
      name: '2024 Ford Mustang GT',
      slug: '2024-ford-mustang-gt',
      description: 'Classic American muscle car in Hot Wheels form with authentic details and premium finish.',
      short_description: '2024 Ford Mustang GT premium casting',
      sku: 'HW-2024-002',
      price: 15.99,
      stock_quantity: 18,
      min_stock_level: 4,
      year_released: 2024,
      series: 'Car Culture',
      rarity_level: 'Common',
      is_featured: false,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-2.jpeg',
      average_rating: 4.2,
      review_count: 9
    },
    {
      id: 7,
      name: '1970 Plymouth Barracuda',
      slug: '1970-plymouth-barracuda',
      description: 'Vintage muscle car casting with Spectraflame paint and authentic styling from the golden era.',
      short_description: '1970 Plymouth Barracuda vintage casting',
      sku: 'HW-1970-001',
      price: 45.99,
      stock_quantity: 8,
      min_stock_level: 2,
      year_released: 1970,
      series: 'Vintage',
      rarity_level: 'Rare',
      is_featured: true,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-4.jpeg',
      average_rating: 4.7,
      review_count: 11
    },
    {
      id: 8,
      name: 'Tesla Cybertruck',
      slug: 'tesla-cybertruck',
      description: 'Futuristic electric truck casting with unique angular design and premium details.',
      short_description: 'Tesla Cybertruck futuristic casting',
      sku: 'HW-2024-003',
      price: 18.99,
      stock_quantity: 12,
      min_stock_level: 3,
      year_released: 2024,
      series: 'Modern',
      rarity_level: 'Common',
      is_featured: false,
      is_active: true,
      primary_image: '../HOT_WHEELS_IMAGES/hot-wheels-1.jpeg',
      average_rating: 4.1,
      review_count: 7
    }
  ],

  productCategories: [
    { product_id: 1, category_id: 1 }, // Redline Custom Camaro -> Redline Collection
    { product_id: 2, category_id: 6 }, // Nissan Skyline -> Car Culture
    { product_id: 3, category_id: 4 }, // Batmobile -> Treasure Hunts
    { product_id: 4, category_id: 5 }, // Porsche 911 -> Team Transport
    { product_id: 5, category_id: 4 }, // Lamborghini -> Treasure Hunts
    { product_id: 6, category_id: 6 }, // Mustang -> Car Culture
    { product_id: 7, category_id: 1 }, // Barracuda -> Redline Collection
    { product_id: 8, category_id: 2 }  // Cybertruck -> Modern Mainline
  ],

  users: [
    {
      id: 1,
      email: 'admin@hotwheels.com',
      first_name: 'Admin',
      last_name: 'User',
      is_admin: true,
      is_verified: true,
      created_at: new Date().toISOString()
    }
  ],

  cartItems: [],

  orders: [],

  reviews: [
    {
      id: 1,
      product_id: 1,
      user_id: 1,
      rating: 5,
      title: 'Amazing quality!',
      review_text: 'This is exactly what I was looking for. Perfect condition and fast shipping.',
      is_verified_purchase: true,
      is_approved: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      product_id: 2,
      user_id: 1,
      rating: 4,
      title: 'Great detail',
      review_text: 'Love the attention to detail on this casting. Highly recommend!',
      is_verified_purchase: true,
      is_approved: true,
      created_at: new Date().toISOString()
    }
  ]
};

// Helper functions for mock data operations
const mockDataHelpers = {
  // Get all products with filters
  getProducts: (filters = {}) => {
    let products = [...mockData.products];
    
    // Apply filters
    if (filters.category) {
      const categoryProducts = mockData.productCategories
        .filter(pc => mockData.categories.find(c => c.slug === filters.category)?.id === pc.category_id)
        .map(pc => pc.product_id);
      products = products.filter(p => categoryProducts.includes(p.id));
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.series.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.minPrice) {
      products = products.filter(p => p.price >= filters.minPrice);
    }
    
    if (filters.maxPrice) {
      products = products.filter(p => p.price <= filters.maxPrice);
    }
    
    if (filters.rarity) {
      products = products.filter(p => p.rarity_level === filters.rarity);
    }
    
    if (filters.series) {
      products = products.filter(p => p.series === filters.series);
    }
    
    if (filters.year) {
      products = products.filter(p => p.year_released === filters.year);
    }
    
    if (filters.featured !== null) {
      products = products.filter(p => p.is_featured === filters.featured);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      products.sort((a, b) => {
        let aVal = a[filters.sortBy];
        let bVal = b[filters.sortBy];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (filters.sortOrder === 'ASC') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const offset = (page - 1) * limit;
    
    const totalCount = products.length;
    const paginatedProducts = products.slice(offset, offset + limit);
    
    return {
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    };
  },

  // Get product by ID
  getProductById: (id) => {
    return mockData.products.find(p => p.id === parseInt(id));
  },

  // Get product by slug
  getProductBySlug: (slug) => {
    return mockData.products.find(p => p.slug === slug);
  },

  // Get featured products
  getFeaturedProducts: (limit = 8) => {
    return mockData.products.filter(p => p.is_featured).slice(0, limit);
  },

  // Get products by category
  getProductsByCategory: (categorySlug, limit = 12) => {
    const category = mockData.categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    
    const categoryProducts = mockData.productCategories
      .filter(pc => pc.category_id === category.id)
      .map(pc => pc.product_id);
    
    return mockData.products
      .filter(p => categoryProducts.includes(p.id))
      .slice(0, limit);
  },

  // Search products
  searchProducts: (searchTerm, limit = 12) => {
    const term = searchTerm.toLowerCase();
    return mockData.products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.series.toLowerCase().includes(term)
    ).slice(0, limit);
  },

  // Get categories
  getCategories: () => {
    return mockData.categories.filter(c => c.is_active);
  },

  // Get product filters
  getProductFilters: () => {
    const products = mockData.products.filter(p => p.is_active);
    
    return {
      series: [...new Set(products.map(p => p.series).filter(Boolean))],
      rarityLevels: [...new Set(products.map(p => p.rarity_level).filter(Boolean))],
      years: [...new Set(products.map(p => p.year_released).filter(Boolean))].sort((a, b) => b - a),
      priceRange: {
        min: Math.min(...products.map(p => p.price)),
        max: Math.max(...products.map(p => p.price))
      }
    };
  },

  // Cart operations
  addToCart: (userId, sessionId, productId, quantity = 1) => {
    const product = mockData.products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');
    
    const existingItem = mockData.cartItems.find(item => 
      (userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
      return existingItem;
    } else {
      const newItem = {
        id: mockData.cartItems.length + 1,
        user_id: userId,
        session_id: sessionId,
        product_id: productId,
        quantity,
        price_at_time: product.price,
        created_at: new Date().toISOString()
      };
      mockData.cartItems.push(newItem);
      return newItem;
    }
  },

  getCartItems: (userId, sessionId) => {
    return mockData.cartItems.filter(item => 
      (userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)
    );
  },

  updateCartItem: (userId, sessionId, productId, quantity) => {
    const item = mockData.cartItems.find(item => 
      ((userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)) &&
      item.product_id === productId
    );
    
    if (item) {
      if (quantity <= 0) {
        const index = mockData.cartItems.indexOf(item);
        mockData.cartItems.splice(index, 1);
        return null;
      } else {
        item.quantity = quantity;
        return item;
      }
    }
    return null;
  },

  removeFromCart: (userId, sessionId, productId) => {
    const index = mockData.cartItems.findIndex(item => 
      ((userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)) &&
      item.product_id === productId
    );
    
    if (index !== -1) {
      return mockData.cartItems.splice(index, 1)[0];
    }
    return null;
  },

  clearCart: (userId, sessionId) => {
    mockData.cartItems = mockData.cartItems.filter(item => 
      !((userId && item.user_id === userId) || (sessionId && item.session_id === sessionId))
    );
  },

  getCartCount: (userId, sessionId) => {
    return mockData.cartItems
      .filter(item => (userId && item.user_id === userId) || (sessionId && item.session_id === sessionId))
      .reduce((total, item) => total + item.quantity, 0);
  },

  getCart: (userId, sessionId) => {
    const items = mockData.cartItems.filter(item => 
      (userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)
    );
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => {
      const product = mockData.products.find(p => p.id === item.product_id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);

    return {
      items: items.map(item => ({
        ...item,
        product: mockData.products.find(p => p.id === item.product_id)
      })),
      totalItems,
      totalPrice
    };
  },

  addToCart: (userId, sessionId, productId, quantity) => {
    const existingItem = mockData.cartItems.find(item => 
      ((userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)) &&
      item.product_id === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const newItem = {
        id: Date.now(),
        user_id: userId,
        session_id: sessionId,
        product_id: productId,
        quantity: quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockData.cartItems.push(newItem);
    }

    // Return cart summary directly
    const items = mockData.cartItems.filter(item => 
      (userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)
    );
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => {
      const product = mockData.products.find(p => p.id === item.product_id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);

    return {
      items: items.map(item => ({
        ...item,
        product: mockData.products.find(p => p.id === item.product_id)
      })),
      totalItems,
      totalPrice
    };
  },

  validateCart: (userId, sessionId) => {
    const items = mockData.cartItems.filter(item => 
      (userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)
    );
    const issues = [];
    
    items.forEach(item => {
      const product = mockData.products.find(p => p.id === item.product_id);
      if (!product) {
        issues.push(`Product ${item.product_id} not found`);
      } else if (!product.is_active) {
        issues.push(`Product ${product.name} is no longer available`);
      } else if (product.stock_quantity < item.quantity) {
        issues.push(`Insufficient stock for ${product.name}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      items: items.map(item => ({
        ...item,
        product: mockData.products.find(p => p.id === item.product_id)
      }))
    };
  },

  mergeCart: (userId, sessionId, guestCartItems) => {
    // Merge guest cart items with user cart
    guestCartItems.forEach(guestItem => {
      const existingItem = mockData.cartItems.find(item => 
        ((userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)) &&
        item.product_id === guestItem.productId
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        const newItem = {
          id: Date.now(),
          user_id: userId,
          session_id: sessionId,
          product_id: guestItem.productId,
          quantity: guestItem.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockData.cartItems.push(newItem);
      }
    });

    // Return cart summary directly
    const items = mockData.cartItems.filter(item => 
      (userId && item.user_id === userId) || (sessionId && item.session_id === sessionId)
    );
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => {
      const product = mockData.products.find(p => p.id === item.product_id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);

    return {
      items: items.map(item => ({
        ...item,
        product: mockData.products.find(p => p.id === item.product_id)
      })),
      totalItems,
      totalPrice
    };
  }
};

module.exports = { mockData, mockDataHelpers };
