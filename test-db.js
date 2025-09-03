// Test database connection
const { Pool } = require('pg');

const dbConfig = {
  connectionString: 'postgresql://postgres:sfwTRoJAaNCFHsBhFVEzCszspZjLHoac@yamabiko.proxy.rlwy.net:49347/railway',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(dbConfig);

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📊 Current database time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    client.release();
    
    // Close the pool
    await pool.end();
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
