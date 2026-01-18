import { query } from '../config/database';

const runMigration = async () => {
  try {
    console.log('Starting migration: Add columns to color_code table...');
    
    const sql = `
      ALTER TABLE color_code 
      ADD COLUMN IF NOT EXISTS notes TEXT;

      ALTER TABLE color_code 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

      ALTER TABLE color_code 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      UPDATE color_code 
      SET is_active = TRUE 
      WHERE is_active IS NULL;
    `;
    
    await query(sql);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
