import { query } from '../config/database';

const runMigration = async () => {
  try {
    console.log('Starting migration: Add reservation_type column to appointments...');
    
    const sql = `
      -- Add reservation_type column to appointments table
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(50) DEFAULT 'Clinic';

      -- Add a check constraint to ensure only valid reservation types
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'check_reservation_type'
        ) THEN
          ALTER TABLE appointments
          ADD CONSTRAINT check_reservation_type
          CHECK (reservation_type IN ('Clinic', 'phone', 'Doctor', 'website'));
        END IF;
      END $$;

      -- Update existing records to have default value
      UPDATE appointments
      SET reservation_type = 'Clinic'
      WHERE reservation_type IS NULL;
    `;
    
    await query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added reservation_type column with default "Clinic"');
    console.log('   - Added constraint for valid values: Clinic, phone, Doctor, website');
    console.log('   - Updated existing records');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
