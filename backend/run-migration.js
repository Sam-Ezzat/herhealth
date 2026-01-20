// Quick migration script using pg directly
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Starting calendar color migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '008_add_color_code_to_calendars.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...\n');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Restart your backend server (Ctrl+C then npm run dev)');
    console.log('  2. Go to Settings → Doctor Calendars');
    console.log('  3. Create calendars with colors\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nPlease run the SQL manually using pgAdmin or Neon Console.');
    console.error('See MANUAL_MIGRATION.sql for the SQL to run.\n');
    await pool.end();
    process.exit(1);
  }
}

runMigration();
