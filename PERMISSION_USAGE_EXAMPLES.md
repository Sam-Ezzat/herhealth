# Permission Usage Examples

## Quick Reference

### 1. Using the `usePermissions` Hook

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { Permissions } from '../constants/permissions';

function MyComponent() {
  const { can, cannot, isSuperAdmin } = usePermissions();

  return (
    <div>
      {/* Show button only if user can create patients */}
      {can(Permissions.PATIENTS_CREATE) && (
        <button>Create Patient</button>
      )}

      {/* Show message if user cannot delete */}
      {cannot(Permissions.PATIENTS_DELETE) && (
        <p>You don't have permission to delete</p>
      )}

      {/* Check for Super Admin */}
      {isSuperAdmin() && (
        <button>Admin Only Feature</button>
      )}
    </div>
  );
}
```

### 2. Using the `<Can>` Component

```tsx
import { Can } from '../components/ProtectedRoute';
import { Permissions } from '../constants/permissions';

function PatientList() {
  return (
    <div>
      {/* Show create button only if permitted */}
      <Can do={Permissions.PATIENTS_CREATE}>
        <button onClick={handleCreate}>Create Patient</button>
      </Can>

      {/* Show delete button with fallback */}
      <Can 
        do={Permissions.PATIENTS_DELETE}
        fallback={<span className="text-gray-400">Delete (No permission)</span>}
      >
        <button onClick={handleDelete}>Delete</button>
      </Can>

      {/* Require multiple permissions (OR logic) */}
      <Can do={[Permissions.STATS_VIEW_ALL, Permissions.STATS_VIEW_BASIC]}>
        <StatisticsPanel />
      </Can>

      {/* Require ALL permissions (AND logic) */}
      <Can 
        do={[Permissions.PATIENTS_UPDATE, Permissions.VISITS_CREATE]} 
        requireAll={true}
      >
        <AdvancedFeature />
      </Can>
    </div>
  );
}
```

### 3. Protecting Entire Pages

```tsx
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Permissions } from '../constants/permissions';

// In App.tsx or routing file
<Route 
  path="/settings/roles" 
  element={
    <ProtectedRoute 
      permissions={Permissions.ROLES_VIEW}
      fallback={<div>Access Denied</div>}
    >
      <RoleManagement />
    </ProtectedRoute>
  } 
/>
```

### 4. Conditional Navigation

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { Permissions } from '../constants/permissions';

function Dashboard() {
  const { can } = usePermissions();
  const navigate = useNavigate();

  const handleQuickAction = () => {
    if (can(Permissions.PATIENTS_CREATE)) {
      navigate('/patients/new');
    } else {
      alert('You don't have permission to create patients');
    }
  };

  return (
    <button onClick={handleQuickAction}>
      Quick Create Patient
    </button>
  );
}
```

### 5. Disabling Elements Based on Permissions

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { Permissions } from '../constants/permissions';

function EditForm() {
  const { can } = usePermissions();
  const canEdit = can(Permissions.PATIENTS_UPDATE);
  const canDelete = can(Permissions.PATIENTS_DELETE);

  return (
    <form>
      <input 
        type="text" 
        disabled={!canEdit}
        placeholder="Patient Name"
      />
      
      <button 
        type="submit" 
        disabled={!canEdit}
        className={!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
      >
        {canEdit ? 'Save' : 'View Only'}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={!canDelete}
        className={!canDelete ? 'hidden' : 'bg-red-500'}
      >
        Delete
      </button>
    </form>
  );
}
```

### 6. Dynamic Menu Items

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { Permissions } from '../constants/permissions';

function Navigation() {
  const { can } = usePermissions();

  const menuItems = [
    { 
      path: '/patients', 
      label: 'Patients', 
      permission: Permissions.PATIENTS_VIEW 
    },
    { 
      path: '/doctors', 
      label: 'Doctors', 
      permission: Permissions.DOCTORS_VIEW 
    },
    { 
      path: '/settings/roles', 
      label: 'Roles', 
      permission: Permissions.ROLES_VIEW 
    },
  ];

  return (
    <nav>
      {menuItems
        .filter(item => can(item.permission))
        .map(item => (
          <Link key={item.path} to={item.path}>
            {item.label}
          </Link>
        ))
      }
    </nav>
  );
}
```

### 7. API Call Protection

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { Permissions } from '../constants/permissions';
import api from '../services/api';

function PatientActions() {
  const { can } = usePermissions();

  const deletePatient = async (id: string) => {
    // Check permission before API call
    if (!can(Permissions.PATIENTS_DELETE)) {
      alert('You don't have permission to delete patients');
      return;
    }

    try {
      await api.delete(`/patients/${id}`);
      alert('Patient deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <button onClick={() => deletePatient('123')}>
      Delete Patient
    </button>
  );
}
```

### 8. Role-Specific UI

```tsx
import { usePermissions } from '../hooks/usePermissions';

function DashboardStats() {
  const { isSuperAdmin, isDoctor, isReceptionist } = usePermissions();

  return (
    <div>
      {isSuperAdmin() && (
        <div>
          <h2>Admin Dashboard</h2>
          <AllSystemStats />
          <UserManagement />
        </div>
      )}

      {isDoctor() && (
        <div>
          <h2>Doctor Dashboard</h2>
          <MyAppointments />
          <MyPatients />
        </div>
      )}

      {isReceptionist() && (
        <div>
          <h2>Reception Dashboard</h2>
          <TodayAppointments />
          <PatientRegistration />
        </div>
      )}
    </div>
  );
}
```

## Permission Constants Reference

All available permissions are in `src/constants/permissions.ts`:

```typescript
import { Permissions } from '../constants/permissions';

// Examples:
Permissions.PATIENTS_VIEW
Permissions.PATIENTS_CREATE
Permissions.PATIENTS_UPDATE
Permissions.PATIENTS_DELETE
Permissions.PATIENTS_ALL  // Wildcard

Permissions.APPOINTMENTS_VIEW
Permissions.APPOINTMENTS_VIEW_OWN  // Only own appointments
Permissions.APPOINTMENTS_CREATE
// ... and many more
```

## Best Practices

1. **Check permissions before actions**: Always verify permissions before making API calls or navigation
2. **Use granular permissions**: Prefer specific permissions over wildcards
3. **Provide feedback**: Show disabled states or messages when users lack permissions
4. **Fail gracefully**: Handle unauthorized access with proper UI feedback
5. **Cache permission checks**: Use the hook result for multiple checks instead of recalling

## Common Patterns

### Table Row Actions
```tsx
<Can do={Permissions.PATIENTS_UPDATE}>
  <button onClick={() => handleEdit(patient.id)}>Edit</button>
</Can>
<Can do={Permissions.PATIENTS_DELETE}>
  <button onClick={() => handleDelete(patient.id)}>Delete</button>
</Can>
```

### Form Submit Protection
```tsx
const handleSubmit = (e) => {
  e.preventDefault();
  if (!can(Permissions.PATIENTS_CREATE)) {
    alert('No permission');
    return;
  }
  // Submit form
};
```

### Conditional Rendering in Lists
```tsx
{patients.map(patient => (
  <div key={patient.id}>
    <h3>{patient.name}</h3>
    <Can do={Permissions.PATIENTS_UPDATE}>
      <EditButton patientId={patient.id} />
    </Can>
  </div>
))}
```
