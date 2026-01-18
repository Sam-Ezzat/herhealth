const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'herhealth_clinic',
  user: 'postgres',
  password: 'postgres123'
});

async function fixAdminPermissions() {
  try {
    // Update admin role with wildcard permission
    const result = await pool.query(
      "UPDATE roles SET permissions = $1 WHERE name = 'admin' RETURNING name, permissions",
      [JSON.stringify(['*'])]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Updated admin role with wildcard permission:', result.rows[0]);
    } else {
      console.log('⚠️  Admin role not found');
    }
    
    // Show all roles and their permissions
    const roles = await pool.query('SELECT name, permissions FROM roles ORDER BY name');
    console.log('\nAll roles:');
    roles.rows.forEach(role => {
      console.log(`  - ${role.name}: ${JSON.stringify(role.permissions)}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixAdminPermissions();
