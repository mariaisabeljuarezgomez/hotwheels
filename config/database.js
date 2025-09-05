// Database configuration for Hot Wheels Velocity
const { Pool } = require('pg');

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 30000, // Return an error after 30 seconds if connection could not be established
  acquireTimeoutMillis: 30000, // Return an error after 30 seconds if a client could not be acquired
  createTimeoutMillis: 30000, // Return an error after 30 seconds if a client could not be created
  destroyTimeoutMillis: 5000, // Return an error after 5 seconds if a client could not be destroyed
  reapIntervalMillis: 1000, // How often to check for idle clients to destroy
  createRetryIntervalMillis: 200, // How long to idle before retrying creation
};

// Create connection pool
let pool = null;

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
    throw error;
  }
};

// Database query helper function
const query = async (text, params, retries = 3) => {
  const start = Date.now();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('📊 Database query executed:', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error(`❌ Database query error (attempt ${attempt}/${retries}):`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      
      // Try to reconnect if connection was lost
      if (error.message.includes('Connection terminated') || error.message.includes('timeout')) {
        try {
          await testConnection();
        } catch (reconnectError) {
          console.error('❌ Failed to reconnect:', reconnectError.message);
        }
      }
    }
  }
};

// Database transaction helper
const transaction = async (callback) => {
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

    await testConnection();

    console.log('🔄 Initializing database tables...');

    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await query(schema);
    console.log('✅ Database tables initialized successfully');

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase
};
