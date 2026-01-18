import { query } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

const runMigration = async () => {
  try {
    console.log('Starting migration: Add is_closed column to doctor_working_hours...');
    
    const sql = `
      ALTER TABLE doctor_working_hours 
      ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;
      
      UPDATE doctor_working_hours 
      SET is_closed = FALSE 
      WHERE is_closed IS NULL;
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
