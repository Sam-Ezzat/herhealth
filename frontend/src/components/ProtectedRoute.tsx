import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions: string | string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Component to protect content based on user permissions
 * 
 * @example
 * <ProtectedRoute permissions={[Permissions.PATIENTS_CREATE]}>
 *   <button>Create Patient</button>
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  permissions, 
  fallback = null,
  requireAll = false 
}) => {
  const { can, canAll } = usePermissions();
  
  const hasPermission = requireAll 
    ? canAll(Array.isArray(permissions) ? permissions : [permissions])
    : can(permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface CanProps {
  do: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Simplified permission check component
 * 
 * @example
 * <Can do={Permissions.PATIENTS_DELETE}>
 *   <button>Delete Patient</button>
 * </Can>
 */
export const Can: React.FC<CanProps> = ({ 
  do: permissions, 
  children, 
  fallback = null,
  requireAll = false 
}) => {
  const { can, canAll } = usePermissions();
  
  const hasPermission = requireAll 
    ? canAll(Array.isArray(permissions) ? permissions : [permissions])
    : can(permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface CannotProps {
  do: string | string[];
  children: React.ReactNode;
}

/**
 * Inverse permission check - render only if user CANNOT
 * 
 * @example
 * <Cannot do={Permissions.PATIENTS_DELETE}>
 *   <p>You don't have permission to delete patients</p>
 * </Cannot>
 */
export const Cannot: React.FC<CannotProps> = ({ 
  do: permissions, 
  children 
}) => {
  const { cannot } = usePermissions();

  if (!cannot(permissions)) {
    return null;
  }

  return <>{children}</>;
};
