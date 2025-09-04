// Database configuration for Hot Wheels Velocity
const { Pool } = require('pg');
const { mockDataHelpers } = require('../data/mockData');

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
};

// Create connection pool
let pool = null;
let useMockData = false;

// Test database connection
const testConnection = async () => {
  try {
    pool = new Pool(dbConfig);
    
    pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
      console.error('❌ Database connection error:', err);
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('🔄 Falling back to mock data...');
    useMockData = true;
    return false;
  }
};

// Database query helper function
const query = async (text, params) => {
  if (useMockData) {
    console.log('📊 Using mock data for query:', text.substring(0, 50) + '...');
    // Return mock response structure
    return { rows: [], rowCount: 0 };
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Database query executed:', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Database transaction helper
const transaction = async (callback) => {
  if (useMockData) {
    console.log('📊 Using mock data for transaction');
    return await callback({ query: () => ({ rows: [], rowCount: 0 }) });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('🔄 Testing database connection...');
    
    const connected = await testConnection();
    
    if (connected) {
      console.log('🔄 Initializing database tables...');
      
      // Read and execute schema
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await query(schema);
      console.log('✅ Database tables initialized successfully');
      
      // Initialize homepage listings with default data
      try {
        const { initializeHomepageListings } = require('../scripts/init-homepage-listings');
        await initializeHomepageListings();
      } catch (error) {
        console.log('⚠️ Homepage listings initialization skipped:', error.message);
      }

      // Initialize product details with default data
      try {
        const { initializeProductDetails } = require('../scripts/init-product-details');
        await initializeProductDetails();
      } catch (error) {
        console.log('⚠️ Product details initialization skipped:', error.message);
      }
    } else {
      console.log('✅ Using mock data - no database initialization needed');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('🔄 Continuing with mock data...');
    useMockData = true;
  }
};

// Get mock data helpers
const getMockHelpers = () => {
  return mockDataHelpers;
};

// Check if using mock data
const isUsingMockData = () => {
  return useMockData;
};

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase,
  getMockHelpers,
  isUsingMockData
};
