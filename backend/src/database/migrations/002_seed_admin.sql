-- Create a default admin user
-- Password: admin123 (hashed with bcrypt)

DO $$
DECLARE
    admin_role_id uuid;
BEGIN
    -- Get admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Insert admin user if not exists
    INSERT INTO users (username, password_hash, full_name, role_id, email, phone)
    VALUES (
        'admin',
        '$2b$10$7PPZ6v1WIF6f1iN./zqWzO32299MWEfTHgrowxNFONwB9SQVUOs7m',  -- password: admin123
        'System Administrator',
        admin_role_id,
        'admin@herhealth.com',
        '555-0100'
    )
    ON CONFLICT (username) DO NOTHING;
END $$;
