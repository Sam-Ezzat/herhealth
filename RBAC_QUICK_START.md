# RBAC Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Step 1: Seed the Database with Default Roles
```bash
cd backend
npx ts-node src/scripts/seed-roles.ts
```

**This creates:**
- Super Admin role with full permissions
- Doctor role with clinical permissions
- Receptionist role with administrative permissions
- Default admin user (username: `superadmin`, password: `admin123`)

**⚠️ Important:** Change the default password after first login!

---

### Step 2: Test the System

**Login as Super Admin:**
```
Username: superadmin
Password: admin123
```

**Access Role Management:**
- Navigate to Settings → Role Management (or `/settings/roles`)
- View the 3 default roles
- See permissions for each role

---

## 📋 Role Summary

### 🔴 Super Admin
**Purpose:** System administrator
**Can do:** Everything
**Cannot do:** Nothing (full access)
**Default Users:** 1 (superadmin)

### 🔵 Doctor  
**Purpose:** Medical staff - clinical operations
**Can do:**
- Manage patient records (view, create, update)
- Manage own appointments
- Full access to clinical visits and pregnancy tracking
- Manage own calendar and working hours
**Cannot do:**
- Delete patients
- Manage other doctors' calendars
- Access system settings
- Manage users/roles

### 🟢 Receptionist
**Purpose:** Front desk - scheduling and registration
**Can do:**
- Full patient management
- Full appointment scheduling
- View doctor calendars for booking
- Send WhatsApp notifications
**Cannot do:**
- Edit clinical notes or diagnoses
- Manage calendar working hours
- Access pregnancy tracking details
- Manage users/roles

---

## 🎯 Common Tasks

### Create a Custom Role (e.g., "Nurse")

**Via Frontend:**
1. Login as Super Admin
2. Go to Settings → Role Management
3. Click "Create Role"
4. Enter name: "Nurse"
5. Select permissions:
   - ✅ patients.view
   - ✅ patients.update
   - ✅ visits.view
   - ✅ visits.create
   - ✅ appointments.view
6. Click "Create Role"

**Via API:**
```bash
POST /api/v1/roles
{
  "name": "Nurse",
  "permissions": [
    "patients.view",
    "patients.update",
    "visits.view",
    "visits.create",
    "appointments.view"
  ]
}
```

---

### Add Extra Permissions to Doctor Role

**Scenario:** Doctors should be able to send WhatsApp messages

**Via Frontend:**
1. Go to Role Management
2. Click "Edit" on Doctor role
3. Check these permissions:
   - ✅ whatsapp.send
   - ✅ whatsapp.viewMessages
4. Click "Update Role"

**Via API:**
```bash
POST /api/v1/roles/{doctorRoleId}/permissions/add
{
  "permissions": [
    "whatsapp.send",
    "whatsapp.viewMessages"
  ]
}
```

---

### Assign Role to New User

**When creating a user:**
```typescript
POST /api/v1/auth/register
{
  "username": "dr.smith",
  "password": "secure_password",
  "full_name": "Dr. John Smith",
  "email": "john.smith@clinic.com",
  "role_id": "{doctor_role_id}" // Get from /api/v1/roles
}
```

---

## 🔒 Protecting Routes

### Backend (TypeScript)

```typescript
import { authorize } from '../middleware/authorize';
import { Permissions } from '../constants/permissions';

// Single permission
router.get(
  '/patients',
  authenticate,
  authorize([Permissions.PATIENTS_VIEW]),
  controller.getAll
);

// Multiple permissions (OR logic - user needs at least one)
router.get(
  '/stats',
  authenticate,
  authorize([Permissions.STATS_VIEW_BASIC, Permissions.STATS_VIEW_ALL]),
  controller.getStats
);
```

### Frontend (React)

```typescript
// Get user permissions from auth context
const { user } = useAuth();
const permissions = user?.permissions || [];

// Check permission
const canCreatePatient = permissions.some(p => 
  p === 'patients.create' || p === 'patients.*'
);

// Conditional rendering
{canCreatePatient && (
  <button onClick={handleCreate}>Create Patient</button>
)}

// Protect entire page
if (!permissions.some(p => p.includes('patients.'))) {
  return <div>Access Denied</div>;
}
```

---

## 📊 Permission Patterns

### Wildcard Permissions
```
patients.*  → Grants all patient permissions
            → Matches: patients.view, patients.create, patients.update, etc.
```

### Own vs All Access
```
appointments.view     → View ALL appointments
appointments.viewOwn  → View only OWN appointments

calendars.update      → Update ALL calendars (admin)
calendars.updateOwn   → Update only OWN calendar (doctor)
```

### Hierarchical Permissions
```
stats.viewAll   → View all statistics (admin)
stats.viewOwn   → View own statistics (doctor)
stats.viewBasic → View basic statistics (receptionist)
```

---

## ⚡ Quick Commands

```bash
# Seed roles
npx ts-node src/scripts/seed-roles.ts

# Check existing roles (SQL)
psql your_db -c "SELECT name, permissions FROM roles;"

# Count users per role (SQL)
psql your_db -c "
  SELECT r.name, COUNT(u.id) as user_count 
  FROM roles r 
  LEFT JOIN users u ON r.id = u.role_id 
  GROUP BY r.name;
"

# Get user's permissions (SQL)
psql your_db -c "
  SELECT u.username, r.name as role, r.permissions 
  FROM users u 
  JOIN roles r ON u.role_id = r.id 
  WHERE u.username = 'superadmin';
"
```

---

## 🐛 Troubleshooting

### "Insufficient permissions" Error
**Problem:** User cannot access a feature
**Solutions:**
1. Check user's role: `GET /api/v1/auth/me`
2. Check role permissions: `GET /api/v1/roles/{roleId}`
3. Verify permission string matches exactly
4. Check for wildcard match (e.g., `patients.*`)

### Cannot Delete Role
**Problem:** "Cannot delete role - users are assigned"
**Solutions:**
1. Reassign users to different role
2. Or delete/deactivate users first
3. Then delete the role

### User Locked Out
**Problem:** User lost access after role change
**Solutions:**
1. Login as Super Admin
2. Check user's role_id in database
3. Update role permissions or reassign role
4. Alternatively, create new Super Admin: run seed script again with different username

---

## 📝 Best Practices

1. **Start Minimal:** Assign minimum required permissions
2. **Test Each Role:** Login as each role to verify access
3. **Document Changes:** Log permission modifications
4. **Regular Audits:** Review role assignments monthly
5. **Avoid Wildcards:** Use specific permissions for custom roles
6. **Backup Roles:** Export role configs before major changes

---

## 🔗 Resources

- **Full Documentation:** [RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md)
- **Permissions List:** [backend/src/constants/permissions.ts](./backend/src/constants/permissions.ts)
- **Middleware:** [backend/src/middleware/authorize.ts](./backend/src/middleware/authorize.ts)
- **Frontend Component:** [frontend/src/pages/settings/RoleManagement.tsx](./frontend/src/pages/settings/RoleManagement.tsx)

---

## 📞 Support

If you encounter issues:
1. Check console for error details
2. Verify database connection
3. Ensure migrations are up to date
4. Check [RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md) for detailed examples
