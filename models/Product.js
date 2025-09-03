// Product model for Hot Wheels Velocity
const { query, getMockHelpers, isUsingMockData } = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description;
    this.shortDescription = data.short_description;
    this.sku = data.sku;
    this.price = parseFloat(data.price);
    this.comparePrice = data.compare_price ? parseFloat(data.compare_price) : null;
    this.costPrice = data.cost_price ? parseFloat(data.cost_price) : null;
    this.stockQuantity = data.stock_quantity;
    this.minStockLevel = data.min_stock_level;
    this.weight = data.weight ? parseFloat(data.weight) : null;
    this.dimensions = data.dimensions;
    this.material = data.material;
    this.color = data.color;
    this.yearReleased = data.year_released;
    this.series = data.series;
    this.collection = data.collection;
    this.rarityLevel = data.rarity_level;
    this.conditionRating = data.condition_rating ? parseFloat(data.condition_rating) : null;
    this.isFeatured = data.is_featured;
    this.isActive = data.is_active;
    this.metaTitle = data.meta_title;
    this.metaDescription = data.meta_description;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Get all products with pagination and filters
  static async findAll(options = {}) {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const result = mockHelpers.getProducts(options);
      return result.products.map(row => new Product(row));
    }

    const {
      page = 1,
      limit = 12,
      category = null,
      search = null,
      minPrice = null,
      maxPrice = null,
      rarity = null,
      series = null,
      year = null,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      featured = null
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = ['p.is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (category) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM product_categories pc 
        JOIN categories c ON pc.category_id = c.id 
        WHERE pc.product_id = p.id AND c.slug = $${paramCount}
      )`);
      queryParams.push(category);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.series ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (minPrice) {
      paramCount++;
      whereConditions.push(`p.price >= $${paramCount}`);
      queryParams.push(minPrice);
    }

    if (maxPrice) {
      paramCount++;
      whereConditions.push(`p.price <= $${paramCount}`);
      queryParams.push(maxPrice);
    }

    if (rarity) {
      paramCount++;
      whereConditions.push(`p.rarity_level = $${paramCount}`);
      queryParams.push(rarity);
    }

    if (series) {
      paramCount++;
      whereConditions.push(`p.series = $${paramCount}`);
      queryParams.push(series);
    }

    if (year) {
      paramCount++;
      whereConditions.push(`p.year_released = $${paramCount}`);
      queryParams.push(year);
    }

    if (featured !== null) {
      paramCount++;
      whereConditions.push(`p.is_featured = $${paramCount}`);
      queryParams.push(featured);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build query
    const sql = `
      SELECT p.*, 
             pi.image_url as primary_image,
             AVG(pr.rating) as average_rating,
             COUNT(pr.id) as review_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
      ${whereClause}
      GROUP BY p.id, pi.image_url
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const result = await query(sql, queryParams);
    return result.rows.map(row => new Product(row));
  }

  // Get product by ID
  static async findById(id) {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const product = mockHelpers.getProductById(id);
      return product ? new Product(product) : null;
    }

    const result = await query(
      `SELECT p.*, 
              AVG(pr.rating) as average_rating,
              COUNT(pr.id) as review_count
       FROM products p
       LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
       WHERE p.id = $1 AND p.is_active = true
       GROUP BY p.id`,
      [id]
    );

    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Get product by slug
  static async findBySlug(slug) {
    const result = await query(
      `SELECT p.*, 
              AVG(pr.rating) as average_rating,
              COUNT(pr.id) as review_count
       FROM products p
       LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
       WHERE p.slug = $1 AND p.is_active = true
       GROUP BY p.id`,
      [slug]
    );

    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Get product images
  async getImages() {
    const result = await query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order, created_at',
      [this.id]
    );
    return result.rows;
  }

  // Get product categories
  async getCategories() {
    const result = await query(
      `SELECT c.* FROM categories c
       JOIN product_categories pc ON c.id = pc.category_id
       WHERE pc.product_id = $1 AND c.is_active = true
       ORDER BY c.sort_order`,
      [this.id]
    );
    return result.rows;
  }

  // Get product reviews
  async getReviews(limit = 10, offset = 0) {
    const result = await query(
      `SELECT pr.*, u.first_name, u.last_name, u.profile_image_url
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.product_id = $1 AND pr.is_approved = true
       ORDER BY pr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [this.id, limit, offset]
    );
    return result.rows;
  }

  // Get related products
  async getRelatedProducts(limit = 4) {
    const result = await query(
      `SELECT DISTINCT p.*, pi.image_url as primary_image
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       JOIN product_categories pc1 ON p.id = pc1.product_id
       WHERE pc1.category_id IN (
         SELECT pc2.category_id FROM product_categories pc2 WHERE pc2.product_id = $1
       ) AND p.id != $1 AND p.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [this.id, limit]
    );
    return result.rows.map(row => new Product(row));
  }

  // Check if product is in stock
  isInStock() {
    return this.stockQuantity > 0;
  }

  // Check if product is low stock
  isLowStock() {
    return this.stockQuantity <= this.minStockLevel;
  }

  // Get discount percentage
  getDiscountPercentage() {
    if (!this.comparePrice || this.comparePrice <= this.price) return 0;
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }

  // Update stock quantity
  async updateStock(quantity) {
    await query(
      'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantity, this.id]
    );
    this.stockQuantity = quantity;
  }

  // Get featured products
  static async getFeatured(limit = 8) {
    if (isUsingMockData()) {
      const mockHelpers = getMockHelpers();
      const products = mockHelpers.getFeaturedProducts(limit);
      return products.map(row => new Product(row));
    }

    const result = await query(
      `SELECT p.*, pi.image_url as primary_image
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE p.is_featured = true AND p.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(row => new Product(row));
  }

  // Get products by category
  static async getByCategory(categorySlug, limit = 12) {
    const result = await query(
      `SELECT p.*, pi.image_url as primary_image
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       JOIN product_categories pc ON p.id = pc.product_id
       JOIN categories c ON pc.category_id = c.id
       WHERE c.slug = $1 AND p.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [categorySlug, limit]
    );
    return result.rows.map(row => new Product(row));
  }

  // Search products
  static async search(searchTerm, limit = 12) {
    const result = await query(
      `SELECT p.*, pi.image_url as primary_image
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE p.is_active = true AND (
         p.name ILIKE $1 OR 
         p.description ILIKE $1 OR 
         p.series ILIKE $1 OR 
         p.collection ILIKE $1
       )
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    return result.rows.map(row => new Product(row));
  }
}

module.exports = Product;
