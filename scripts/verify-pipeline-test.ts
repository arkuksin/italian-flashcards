import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || '6543'),
  database: process.env.SUPABASE_DB_DATABASE,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: process.env.SUPABASE_DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.SUPABASE_DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false
});

async function verify() {
  try {
    const result = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'pipeline_test'
    `);
    console.log('✅ Table exists:', result.rows);
    
    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'pipeline_test'
    `);
    console.log('✅ Indexes:', indexes.rows);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', (err as Error).message);
    process.exit(1);
  }
}

verify();
