// User model for Hot Wheels Velocity
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.phone = data.phone;
    this.dateOfBirth = data.date_of_birth;
    this.address = {
      line1: data.address_line1,
      line2: data.address_line2,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country
    };
    this.profileImageUrl = data.profile_image_url;
    this.isVerified = data.is_verified;
    this.isAdmin = data.is_admin;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address
    } = userData;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, 
       address_line1, address_line2, city, state, zip_code, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        address?.line1,
        address?.line2,
        address?.city,
        address?.state,
        address?.zipCode,
        address?.country || 'USA'
      ]
    );

    return new User(result.rows[0]);
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by ID
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Verify password
  async verifyPassword(password) {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [this.id]);
    if (result.rows.length === 0) return false;
    return await bcrypt.compare(password, result.rows[0].password_hash);
  }

  // Update user profile
  async update(updateData) {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      profileImageUrl
    } = updateData;

    const result = await query(
      `UPDATE users SET 
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       phone = COALESCE($3, phone),
       date_of_birth = COALESCE($4, date_of_birth),
       address_line1 = COALESCE($5, address_line1),
       address_line2 = COALESCE($6, address_line2),
       city = COALESCE($7, city),
       state = COALESCE($8, state),
       zip_code = COALESCE($9, zip_code),
       country = COALESCE($10, country),
       profile_image_url = COALESCE($11, profile_image_url),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        firstName,
        lastName,
        phone,
        dateOfBirth,
        address?.line1,
        address?.line2,
        address?.city,
        address?.state,
        address?.zipCode,
        address?.country,
        profileImageUrl,
        this.id
      ]
    );

    return new User(result.rows[0]);
  }

  // Change password
  async changePassword(newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, this.id]
    );
  }

  // Get user's cart items
  async getCartItems() {
    const result = await query(
      `SELECT ci.*, p.name, p.slug, p.price, pi.image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [this.id]
    );
    return result.rows;
  }

  // Get user's orders
  async getOrders(limit = 10, offset = 0) {
    const result = await query(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [this.id, limit, offset]
    );
    return result.rows;
  }

  // Get user's collections
  async getCollections() {
    const result = await query(
      'SELECT * FROM user_collections WHERE user_id = $1 ORDER BY created_at DESC',
      [this.id]
    );
    return result.rows;
  }

  // Convert to safe object (without password)
  toSafeObject() {
    const { password, ...safeUser } = this;
    return safeUser;
  }

  // Get full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = User;
