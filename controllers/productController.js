// Product Controller for Hot Wheels Velocity
const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { getMockHelpers, isUsingMockData } = require('../config/database');

// Get all products with filters and pagination
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      rarity,
      series,
      year,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      featured
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      rarity,
      series,
      year: year ? parseInt(year) : null,
      sortBy,
      sortOrder: sortOrder.toUpperCase(),
      featured: featured === 'true' ? true : featured === 'false' ? false : null
    };

    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const result = mockHelpers.getProducts(options);
      
      res.json({
        success: true,
        data: {
          products: result.products.map(p => new Product(p)),
          pagination: result.pagination
        }
      });
    } else {
      const products = await Product.findAll(options);

      // Get total count for pagination
      const { query } = require('../config/database');
      let countQuery = 'SELECT COUNT(*) FROM products p WHERE p.is_active = true';
      let countParams = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        countQuery += ` AND EXISTS (
          SELECT 1 FROM product_categories pc 
          JOIN categories c ON pc.category_id = c.id 
          WHERE pc.product_id = p.id AND c.slug = $${paramCount}
        )`;
        countParams.push(category);
      }

      if (search) {
        paramCount++;
        countQuery += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.series ILIKE $${paramCount})`;
        countParams.push(`%${search}%`);
      }

      if (minPrice) {
        paramCount++;
        countQuery += ` AND p.price >= $${paramCount}`;
        countParams.push(minPrice);
      }

      if (maxPrice) {
        paramCount++;
        countQuery += ` AND p.price <= $${paramCount}`;
        countParams.push(maxPrice);
      }

      if (rarity) {
        paramCount++;
        countQuery += ` AND p.rarity_level = $${paramCount}`;
        countParams.push(rarity);
      }

      if (series) {
        paramCount++;
        countQuery += ` AND p.series = $${paramCount}`;
        countParams.push(series);
      }

      if (year) {
        paramCount++;
        countQuery += ` AND p.year_released = $${paramCount}`;
        countParams.push(year);
      }

      if (featured !== null) {
        paramCount++;
        countQuery += ` AND p.is_featured = $${paramCount}`;
        countParams.push(featured);
      }

      const countResult = await query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / options.limit);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: options.page,
            totalPages,
            totalCount,
            limit: options.limit,
            hasNext: options.page < totalPages,
            hasPrev: options.page > 1
          }
        }
      });
    }
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message
    });
  }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get product images
    const images = await product.getImages();
    
    // Get product categories
    const categories = await product.getCategories();
    
    // Get product reviews
    const reviews = await product.getReviews(5, 0);
    
    // Get related products
    const relatedProducts = await product.getRelatedProducts(4);

    res.json({
      success: true,
      data: {
        product,
        images,
        categories,
        reviews,
        relatedProducts
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    });
  }
};

// Get single product by slug
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findBySlug(slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get product images
    const images = await product.getImages();
    
    // Get product categories
    const categories = await product.getCategories();
    
    // Get product reviews
    const reviews = await product.getReviews(5, 0);
    
    // Get related products
    const relatedProducts = await product.getRelatedProducts(4);

    res.json({
      success: true,
      data: {
        product,
        images,
        categories,
        reviews,
        relatedProducts
      }
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const products = await Product.getFeatured(parseInt(limit));

    res.json({
      success: true,
      data: {
        products
      }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured products',
      error: error.message
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { limit = 12 } = req.query;
    
    const products = await Product.getByCategory(categorySlug, parseInt(limit));

    res.json({
      success: true,
      data: {
        products
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products by category',
      error: error.message
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    const { limit = 12 } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    const products = await Product.search(searchTerm.trim(), parseInt(limit));

    res.json({
      success: true,
      data: {
        products,
        searchTerm: searchTerm.trim()
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await product.getReviews(parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        reviews
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product reviews',
      error: error.message
    });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const categories = mockHelpers.getCategories();
      
      res.json({
        success: true,
        data: {
          categories
        }
      });
    } else {
      const { query } = require('../config/database');
      const result = await query(
        'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order, name'
      );

      res.json({
        success: true,
        data: {
          categories: result.rows
        }
      });
    }
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
};

// Get product filters (for search/filter UI)
exports.getProductFilters = async (req, res) => {
  try {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const filters = mockHelpers.getProductFilters();
      
      res.json({
        success: true,
        data: filters
      });
    } else {
      const { query } = require('../config/database');
      
      // Get unique series
      const seriesResult = await query(
        'SELECT DISTINCT series FROM products WHERE series IS NOT NULL AND is_active = true ORDER BY series'
      );
      
      // Get unique rarity levels
      const rarityResult = await query(
        'SELECT DISTINCT rarity_level FROM products WHERE rarity_level IS NOT NULL AND is_active = true ORDER BY rarity_level'
      );
      
      // Get unique years
      const yearsResult = await query(
        'SELECT DISTINCT year_released FROM products WHERE year_released IS NOT NULL AND is_active = true ORDER BY year_released DESC'
      );
      
      // Get price range
      const priceResult = await query(
        'SELECT MIN(price) as min_price, MAX(price) as max_price FROM products WHERE is_active = true'
      );

      res.json({
        success: true,
        data: {
          series: seriesResult.rows.map(row => row.series),
          rarityLevels: rarityResult.rows.map(row => row.rarity_level),
          years: yearsResult.rows.map(row => row.year_released),
          priceRange: {
            min: parseFloat(priceResult.rows[0].min_price) || 0,
            max: parseFloat(priceResult.rows[0].max_price) || 1000
          }
        }
      });
    }
  } catch (error) {
    console.error('Get product filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product filters',
      error: error.message
    });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const productData = {
        ...req.body,
        id: Date.now(), // Simple ID generation for mock
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const product = new Product(productData);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });
    } else {
      const { query } = require('../config/database');
      
      const {
        name, sku, description, price, compare_price, cost_price,
        stock_quantity, min_stock_level, weight, dimensions, material,
        color, year_released, series, collection, rarity_level,
        condition_rating, is_featured, is_active, meta_title, meta_description,
        // New fields
        market_value, price_change_percentage, investment_grade, last_price_update,
        week_low, week_high, avg_sale_price, expert_authenticated, certificate_number,
        authenticated_by, production_year, casting, spectraflame_color, tampo,
        wheel_type, country_of_origin, condition_description, professional_grading,
        grading_price, custom_display_case, display_case_price, insurance_valuation,
        insurance_price, ultra_rare, mint_condition, investment_grade_tag,
        limited_edition, original_packaging, certified_authentic
      } = req.body;
      
      // Generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      const result = await query(`
        INSERT INTO products (
          name, slug, description, sku, price, compare_price, cost_price,
          stock_quantity, min_stock_level, weight, dimensions, material,
          color, year_released, series, collection, rarity_level,
          condition_rating, is_featured, is_active, meta_title, meta_description,
          market_value, price_change_percentage, investment_grade, last_price_update,
          week_low, week_high, avg_sale_price, expert_authenticated, certificate_number,
          authenticated_by, production_year, casting, spectraflame_color, tampo,
          wheel_type, country_of_origin, condition_description, professional_grading,
          grading_price, custom_display_case, display_case_price, insurance_valuation,
          insurance_price, ultra_rare, mint_condition, investment_grade_tag,
          limited_edition, original_packaging, certified_authentic
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47,
          $48, $49, $50, $51
        ) RETURNING *
      `, [
        name, slug, description, sku, price, compare_price, cost_price,
        stock_quantity, min_stock_level, weight, dimensions, material,
        color, year_released, series, collection, rarity_level,
        condition_rating, is_featured, is_active, meta_title, meta_description,
        market_value, price_change_percentage, investment_grade, last_price_update,
        week_low, week_high, avg_sale_price, expert_authenticated, certificate_number,
        authenticated_by, production_year, casting, spectraflame_color, tampo,
        wheel_type, country_of_origin, condition_description, professional_grading,
        grading_price, custom_display_case, display_case_price, insurance_valuation,
        insurance_price, ultra_rare, mint_condition, investment_grade_tag,
        limited_edition, original_packaging, certified_authentic
      ]);
      
      const product = new Product(result.rows[0]);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};
