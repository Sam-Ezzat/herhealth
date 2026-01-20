// Cleanup script to delete all lab_orders, imaging, and prescriptions records
// This allows you to delete visits without foreign key constraint errors

const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'obgyn_clinic',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    };

const pool = new Pool(poolConfig);

async function cleanup() {
  console.log('==========================================');
  console.log('Cleanup: Lab Orders, Imaging, Prescriptions');
  console.log('==========================================\n');

  try {
    // Check counts before deletion
    console.log('📊 Current record counts:');
    const countResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM lab_results) as lab_results_count,
        (SELECT COUNT(*) FROM lab_orders) as lab_orders_count,
        (SELECT COUNT(*) FROM imaging) as imaging_count,
        (SELECT COUNT(*) FROM prescription_items) as prescription_items_count,
        (SELECT COUNT(*) FROM prescriptions) as prescriptions_count
    `);
    
    const counts = countResult.rows[0];
    console.log(`  - Lab Results: ${counts.lab_results_count}`);
    console.log(`  - Lab Orders: ${counts.lab_orders_count}`);
    console.log(`  - Imaging: ${counts.imaging_count}`);
    console.log(`  - Prescription Items: ${counts.prescription_items_count}`);
    console.log(`  - Prescriptions: ${counts.prescriptions_count}\n`);

    const totalRecords = parseInt(counts.lab_results_count) + 
                        parseInt(counts.lab_orders_count) + 
                        parseInt(counts.imaging_count) + 
                        parseInt(counts.prescription_items_count) + 
                        parseInt(counts.prescriptions_count);

    if (totalRecords === 0) {
      console.log('✓ No records to delete. Tables are already empty.\n');
      await pool.end();
      return;
    }

    console.log('⚠️  WARNING: This will delete ALL records from these tables!');
    console.log('Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🗑️  Deleting records...\n');

    // Delete in correct order (child tables first)
    const result1 = await pool.query('DELETE FROM lab_results');
    console.log(`✓ Deleted ${result1.rowCount} lab_results`);

    const result2 = await pool.query('DELETE FROM prescription_items');
    console.log(`✓ Deleted ${result2.rowCount} prescription_items`);

    const result3 = await pool.query('DELETE FROM lab_orders');
    console.log(`✓ Deleted ${result3.rowCount} lab_orders`);

    const result4 = await pool.query('DELETE FROM imaging');
    console.log(`✓ Deleted ${result4.rowCount} imaging records`);

    const result5 = await pool.query('DELETE FROM prescriptions');
    console.log(`✓ Deleted ${result5.rowCount} prescriptions\n`);

    // Verify cleanup
    const verifyResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM lab_results) as lab_results_remaining,
        (SELECT COUNT(*) FROM lab_orders) as lab_orders_remaining,
        (SELECT COUNT(*) FROM imaging) as imaging_remaining,
        (SELECT COUNT(*) FROM prescription_items) as prescription_items_remaining,
        (SELECT COUNT(*) FROM prescriptions) as prescriptions_remaining
    `);
    
    const remaining = verifyResult.rows[0];
    console.log('✅ Cleanup completed successfully!');
    console.log('Remaining records (should all be 0):');
    console.log(`  - Lab Results: ${remaining.lab_results_remaining}`);
    console.log(`  - Lab Orders: ${remaining.lab_orders_remaining}`);
    console.log(`  - Imaging: ${remaining.imaging_remaining}`);
    console.log(`  - Prescription Items: ${remaining.prescription_items_remaining}`);
    console.log(`  - Prescriptions: ${remaining.prescriptions_remaining}\n`);

    console.log('🎉 You can now delete visits without errors!\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanup();
