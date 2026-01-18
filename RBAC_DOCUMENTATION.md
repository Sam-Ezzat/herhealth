# Role-Based Access Control (RBAC) System

## Overview
The HerHealth OBGYN Clinic System implements a comprehensive Role-Based Access Control system with three default roles and flexible permission management.

---

## 🎭 Default Roles

### 1. **Super Admin**
Full system access + user and role management capabilities

**Default Permissions:**
- ✅ All user management (`users.*`)
- ✅ All role management (`roles.*`)
- ✅ All patient operations (`patients.*`)
- ✅ All doctor operations (`doctors.*`)
- ✅ All appointment operations (`appointments.*`)
- ✅ All visit/clinical records (`visits.*`)
- ✅ All pregnancy tracking (`pregnancy.*`)
- ✅ All calendar management (`calendars.*`)
- ✅ All WhatsApp notifications (`whatsapp.*`)
- ✅ All color code management (`colorcodes.*`)
- ✅ All statistics and reports (`stats.*`)
- ✅ All system settings (`settings.*`)

---

### 2. **Doctor**
Clinical focus with own schedule management

**Default Permissions:**
- ✅ View, create, update patients (`patients.view`, `patients.create`, `patients.update`)
- ✅ View all appointments, manage own appointments (`appointments.view`, `appointments.viewOwn`, `appointments.updateOwn`)
- ✅ Full clinical records access (`visits.*`)
- ✅ Full pregnancy tracking (`pregnancy.*`)
- ✅ View and manage own calendar (`calendars.viewOwn`, `calendars.updateOwn`)
- ✅ Manage own working hours, time slots, exceptions
- ✅ View own statistics (`stats.viewOwn`)
- ✅ View color codes (`colorcodes.view`)

**Restrictions:**
- ❌ Cannot delete patients
- ❌ Cannot manage other doctors' calendars
- ❌ Cannot access system settings
- ❌ Cannot manage users or roles

---

### 3. **Receptionist**
Administrative focus - patient registration and scheduling

**Default Permissions:**
- ✅ Full patient management (`patients.*`)
- ✅ View doctors list (`doctors.view`)
- ✅ Full appointment management (`appointments.*`)
- ✅ View visits (read-only) (`visits.view`)
- ✅ View calendars and available slots (`calendars.view`, `calendars.viewAvailableSlots`)
- ✅ Send WhatsApp notifications (`whatsapp.send`, `whatsapp.viewMessages`)
- ✅ View and update color codes (`colorcodes.view`, `colorcodes.update`)
- ✅ View basic statistics (`stats.viewBasic`)

**Restrictions:**
- ❌ Cannot edit clinical notes or diagnoses
- ❌ Cannot manage doctor calendars (working hours, time slots)
- ❌ Cannot access detailed pregnancy tracking
- ❌ Cannot manage users or roles

---

## 📋 Permission Structure

Permissions follow the format: `module.action`

### Available Modules:
- `users` - User account management
- `roles` - Role and permission management
- `patients` - Patient records
- `doctors` - Doctor profiles
- `appointments` - Appointment scheduling
- `visits` - Clinical visit records
- `pregnancy` - Pregnancy tracking
- `calendars` - Doctor calendar and availability
- `whatsapp` - WhatsApp notifications
- `colorcodes` - Patient color coding system
- `stats` - Statistics and reporting
- `settings` - System configuration

### Common Actions:
- `view` - Read access
- `viewOwn` - Read own records only
- `create` - Create new records
- `update` - Modify existing records
- `updateOwn` - Modify own records only
- `delete` - Delete records
- `*` - All actions (wildcard)

---

## 🚀 Setup Instructions

### 1. Run the Role Seeder
```bash
cd backend
npx ts-node src/scripts/seed-roles.ts
```

This will create:
- 3 default roles (Super Admin, Doctor, Receptionist)
- Default Super Admin user:
  - **Username:** `superadmin`
  - **Password:** `admin123`
  - **⚠️ IMPORTANT:** Change this password immediately after first login!

### 2. Applying Permissions to Routes

Example from `patient.routes.ts`:

```typescript
import { authorize } from '../middleware/authorize';
import { Permissions } from '../constants/permissions';

// Require PATIENTS_VIEW permission
router.get(
  '/',
  authenticate,
  authorize([Permissions.PATIENTS_VIEW]),
  patientController.getAllPatients
);

// Require PATIENTS_CREATE permission
router.post(
  '/',
  authenticate,
  authorize([Permissions.PATIENTS_CREATE]),
  patientController.createPatient
);

// Multiple permissions (OR logic - user needs at least one)
router.get(
  '/stats',
  authenticate,
  authorize([Permissions.STATS_VIEW_BASIC, Permissions.STATS_VIEW_ALL]),
  patientController.getPatientStats
);
```

---

## 🛠️ API Endpoints

### Role Management

| Method | Endpoint | Permission Required | Description |
|--------|----------|---------------------|-------------|
| GET | `/api/v1/roles` | `roles.view` | Get all roles with user counts |
| GET | `/api/v1/roles/:id` | `roles.view` | Get role by ID |
| POST | `/api/v1/roles` | `roles.create` | Create new role |
| PUT | `/api/v1/roles/:id` | `roles.update` | Update role |
| DELETE | `/api/v1/roles/:id` | `roles.delete` | Delete role |
| GET | `/api/v1/roles/permissions/available` | `roles.view` | Get all available permissions |
| POST | `/api/v1/roles/:id/permissions/add` | `roles.assignPermissions` | Add permissions to role |
| POST | `/api/v1/roles/:id/permissions/remove` | `roles.assignPermissions` | Remove permissions from role |

---

## 📝 Usage Examples

### Creating a Custom Role

```typescript
POST /api/v1/roles
{
  "name": "Nurse",
  "permissions": [
    "patients.view",
    "patients.update",
    "visits.view",
    "appointments.view"
  ]
}
```

### Adding Extra Permissions to Doctor Role

```typescript
POST /api/v1/roles/:doctorRoleId/permissions/add
{
  "permissions": [
    "whatsapp.send",
    "appointments.delete"
  ]
}
```

### Checking User Permissions in Frontend

```typescript
// Store user permissions in context/state after login
const userPermissions = user.permissions; // e.g., ["patients.*", "visits.view"]

// Check if user can create patients
const canCreatePatient = userPermissions.some(p => 
  p === "patients.create" || p === "patients.*"
);

// Conditionally render UI
{canCreatePatient && (
  <button onClick={handleCreatePatient}>Create Patient</button>
)}
```

---

## 🔒 Security Best Practices

1. **Always authenticate first**: Use `authenticate` middleware before `authorize`
2. **Principle of least privilege**: Assign minimum required permissions
3. **Regular audits**: Review role assignments periodically
4. **Avoid wildcards for custom roles**: Use specific permissions instead of `module.*`
5. **Change default passwords**: Immediately update the default super admin password
6. **Monitor permission changes**: Log all role and permission modifications

---

## 🧪 Testing Permissions

### Test Cases:

1. **Super Admin Access**
   - ✅ Can manage all users and roles
   - ✅ Can access all system features
   - ✅ Can assign permissions to roles

2. **Doctor Access**
   - ✅ Can view and manage own calendar
   - ✅ Can create/update patient records
   - ✅ Can manage clinical visits
   - ❌ Cannot delete patients
   - ❌ Cannot access system settings

3. **Receptionist Access**
   - ✅ Can create patients and appointments
   - ✅ Can view doctor calendars for scheduling
   - ✅ Can send WhatsApp notifications
   - ❌ Cannot edit clinical notes
   - ❌ Cannot manage calendar working hours

---

## 🔄 Migration Path

To apply permissions to all existing routes:

1. Import authorization middleware:
```typescript
import { authorize } from '../middleware/authorize';
import { Permissions } from '../constants/permissions';
```

2. Replace `authenticate` with both middlewares:
```typescript
// Before
router.get('/', authenticate, controller.getAll);

// After
router.get(
  '/',
  authenticate,
  authorize([Permissions.RESOURCE_VIEW]),
  controller.getAll
);
```

3. Test each endpoint with different roles

---

## 📊 Permission Matrix

| Feature | Super Admin | Doctor | Receptionist |
|---------|-------------|--------|--------------|
| Manage Users | ✅ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ |
| Create Patients | ✅ | ✅ | ✅ |
| Delete Patients | ✅ | ❌ | ✅ |
| View Appointments | ✅ | ✅ (Own) | ✅ |
| Create Appointments | ✅ | ❌ | ✅ |
| Edit Clinical Notes | ✅ | ✅ | ❌ |
| Manage Calendars | ✅ | ✅ (Own) | ❌ |
| View Statistics | ✅ (All) | ✅ (Own) | ✅ (Basic) |
| WhatsApp Config | ✅ | ❌ | ❌ |
| Send WhatsApp | ✅ | ❌ | ✅ |

---

## 🆘 Troubleshooting

### "Insufficient permissions" error
- Check user's role has the required permission
- Verify permission string matches exactly
- Check for wildcard permissions (`module.*`)

### User locked out after role change
- Super Admin can restore access
- Check role assignment in database
- Verify role has necessary permissions

### Cannot delete role
- Ensure no users are assigned to the role
- Reassign users to different role first
- Then delete the role

---

## 📚 Additional Resources

- [Permissions Constants](../constants/permissions.ts)
- [Authorization Middleware](../middleware/authorize.ts)
- [Role Service](../services/role.service.ts)
- [Role Controller](../controllers/role.controller.ts)
