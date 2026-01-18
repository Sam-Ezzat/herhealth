import pool from '../config/database';
import { DefaultRolePermissions } from '../constants/permissions';

/**
 * Seeds the database with default roles and permissions
 */
async function seedRoles() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Starting role seeding...');

    // Upsert Super Admin Role
    const superAdminResult = await client.query(
      `INSERT INTO roles (name, permissions, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name) 
       DO UPDATE SET permissions = $2
       RETURNING id`,
      ['Super Admin', JSON.stringify(DefaultRolePermissions.SUPER_ADMIN)]
    );
    console.log('✅ Upserted Super Admin role:', superAdminResult.rows[0].id);

    // Upsert Doctor Role
    const doctorResult = await client.query(
      `INSERT INTO roles (name, permissions, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name)
       DO UPDATE SET permissions = $2
       RETURNING id`,
      ['Doctor', JSON.stringify(DefaultRolePermissions.DOCTOR)]
    );
    console.log('✅ Upserted Doctor role:', doctorResult.rows[0].id);

    // Upsert Receptionist Role
    const receptionistResult = await client.query(
      `INSERT INTO roles (name, permissions, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name)
       DO UPDATE SET permissions = $2
       RETURNING id`,
      ['Receptionist', JSON.stringify(DefaultRolePermissions.RECEPTIONIST)]
    );
    console.log('✅ Upserted Receptionist role:', receptionistResult.rows[0].id);

    // Create a default Super Admin user (optional)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10); // Change this password!

    await client.query(
      `INSERT INTO users (username, password_hash, full_name, role_id, email, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (username) DO NOTHING`,
      [
        'superadmin',
        hashedPassword,
        'System Administrator',
        superAdminResult.rows[0].id,
        'admin@herhealth.clinic'
      ]
    );
    console.log('✅ Created default Super Admin user (username: superadmin, password: admin123)');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

    await client.query('COMMIT');
    console.log('🎉 Role seeding completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding roles:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedRoles()
    .then(() => {
      console.log('Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedRoles;
