import { useAuthStore } from '../store/authStore';
import { hasAnyPermission, hasAllPermissions } from '../constants/permissions';

/**
 * Custom hook for checking user permissions
 */
export function usePermissions() {
  const { user } = useAuthStore();
  const userPermissions = (user as any)?.permissions || [];

  /**
   * Check if user has any of the required permissions
   * @param permissions - Array of permission strings
   * @returns boolean
   */
  const can = (permissions: string | string[]): boolean => {
    const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
    return hasAnyPermission(userPermissions, permissionsArray);
  };

  /**
   * Check if user has all of the required permissions
   * @param permissions - Array of permission strings
   * @returns boolean
   */
  const canAll = (permissions: string[]): boolean => {
    return hasAllPermissions(userPermissions, permissions);
  };

  /**
   * Check if user cannot perform an action
   * @param permissions - Array of permission strings
   * @returns boolean
   */
  const cannot = (permissions: string | string[]): boolean => {
    return !can(permissions);
  };

  /**
   * Check if user is Super Admin
   * @returns boolean
   */
  const isSuperAdmin = (): boolean => {
    return user?.roleName === 'Super Admin' || can('users.*');
  };

  /**
   * Check if user is Doctor
   * @returns boolean
   */
  const isDoctor = (): boolean => {
    return user?.roleName === 'Doctor';
  };

  /**
   * Check if user is Receptionist
   * @returns boolean
   */
  const isReceptionist = (): boolean => {
    return user?.roleName === 'Receptionist';
  };

  return {
    can,
    canAll,
    cannot,
    isSuperAdmin,
    isDoctor,
    isReceptionist,
    permissions: userPermissions,
    user,
  };
}
