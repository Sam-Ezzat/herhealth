const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'herhealth_clinic',
  user: 'postgres',
  password: 'postgres123'
});

async function cleanupDuplicateRoles() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🧹 Cleaning up duplicate roles...\n');
    
    // Get the IDs of old and new roles
    const roles = await client.query('SELECT id, name, permissions FROM roles ORDER BY name');
    
    const roleMap = {
      admin: null,
      'Super Admin': null,
      doctor: null,
      'Doctor': null,
      receptionist: null,
      'Receptionist': null,
      nurse: null
    };
    
    roles.rows.forEach(role => {
      if (roleMap.hasOwnProperty(role.name)) {
        roleMap[role.name] = role.id;
      }
    });
    
    // Migrate users from old roles to new roles
    console.log('📝 Migrating users to new roles...');
    
    // admin -> Super Admin
    if (roleMap.admin && roleMap['Super Admin']) {
      const result = await client.query(
        'UPDATE users SET role_id = $1 WHERE role_id = $2 RETURNING username',
        [roleMap['Super Admin'], roleMap.admin]
      );
      if (result.rowCount > 0) {
        console.log(`  ✅ Migrated ${result.rowCount} user(s) from "admin" to "Super Admin"`);
        result.rows.forEach(u => console.log(`     - ${u.username}`));
      }
    }
    
    // doctor -> Doctor
    if (roleMap.doctor && roleMap['Doctor']) {
      const result = await client.query(
        'UPDATE users SET role_id = $1 WHERE role_id = $2 RETURNING username',
        [roleMap['Doctor'], roleMap.doctor]
      );
      if (result.rowCount > 0) {
        console.log(`  ✅ Migrated ${result.rowCount} user(s) from "doctor" to "Doctor"`);
        result.rows.forEach(u => console.log(`     - ${u.username}`));
      }
    }
    
    // receptionist -> Receptionist
    if (roleMap.receptionist && roleMap['Receptionist']) {
      const result = await client.query(
        'UPDATE users SET role_id = $1 WHERE role_id = $2 RETURNING username',
        [roleMap['Receptionist'], roleMap.receptionist]
      );
      if (result.rowCount > 0) {
        console.log(`  ✅ Migrated ${result.rowCount} user(s) from "receptionist" to "Receptionist"`);
        result.rows.forEach(u => console.log(`     - ${u.username}`));
      }
    }
    
    // Delete old duplicate roles
    console.log('\n🗑️  Deleting old duplicate roles...');
    
    const rolesToDelete = ['admin', 'doctor', 'nurse', 'receptionist'];
    for (const roleName of rolesToDelete) {
      if (roleMap[roleName]) {
        await client.query('DELETE FROM roles WHERE name = $1', [roleName]);
        console.log(`  ✅ Deleted role: "${roleName}"`);
      }
    }
    
    await client.query('COMMIT');
    
    // Show final roles
    console.log('\n✨ Final roles:');
    const finalRoles = await client.query('SELECT name, permissions FROM roles ORDER BY name');
    finalRoles.rows.forEach(role => {
      const permCount = Array.isArray(role.permissions) ? role.permissions.length : 'N/A';
      console.log(`  - ${role.name} (${permCount} permissions)`);
    });
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDuplicateRoles();
