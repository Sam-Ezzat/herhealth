/**
 * Permission Constants for Role-Based Access Control (RBAC)
 * 
 * Format: MODULE.ACTION
 * Example: patients.create, appointments.view
 */

export const Permissions = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ALL: 'users.*',

  // Role Management
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN_PERMISSIONS: 'roles.assignPermissions',
  ROLES_ALL: 'roles.*',

  // Patient Management
  PATIENTS_VIEW: 'patients.view',
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_UPDATE: 'patients.update',
  PATIENTS_DELETE: 'patients.delete',
  PATIENTS_ALL: 'patients.*',

  // Doctor Management
  DOCTORS_VIEW: 'doctors.view',
  DOCTORS_CREATE: 'doctors.create',
  DOCTORS_UPDATE: 'doctors.update',
  DOCTORS_DELETE: 'doctors.delete',
  DOCTORS_ALL: 'doctors.*',

  // Appointment Management
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_VIEW_OWN: 'appointments.viewOwn',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_UPDATE: 'appointments.update',
  APPOINTMENTS_UPDATE_OWN: 'appointments.updateOwn',
  APPOINTMENTS_DELETE: 'appointments.delete',
  APPOINTMENTS_ALL: 'appointments.*',

  // Visit Management (Clinical Records)
  VISITS_VIEW: 'visits.view',
  VISITS_VIEW_OWN: 'visits.viewOwn',
  VISITS_CREATE: 'visits.create',
  VISITS_UPDATE: 'visits.update',
  VISITS_DELETE: 'visits.delete',
  VISITS_ALL: 'visits.*',

  // Pregnancy Tracking
  PREGNANCY_VIEW: 'pregnancy.view',
  PREGNANCY_UPDATE: 'pregnancy.update',
  PREGNANCY_ALL: 'pregnancy.*',

  // Calendar Management
  CALENDARS_VIEW: 'calendars.view',
  CALENDARS_VIEW_OWN: 'calendars.viewOwn',
  CALENDARS_CREATE: 'calendars.create',
  CALENDARS_UPDATE: 'calendars.update',
  CALENDARS_UPDATE_OWN: 'calendars.updateOwn',
  CALENDARS_DELETE: 'calendars.delete',
  CALENDARS_MANAGE_WORKING_HOURS: 'calendars.manageWorkingHours',
  CALENDARS_MANAGE_TIME_SLOTS: 'calendars.manageTimeSlots',
  CALENDARS_MANAGE_EXCEPTIONS: 'calendars.manageExceptions',
  CALENDARS_VIEW_AVAILABLE_SLOTS: 'calendars.viewAvailableSlots',
  CALENDARS_BLOCK_TIME: 'calendars.blockTime',
  CALENDARS_EMERGENCY_CANCEL: 'calendars.emergencyCancel',
  CALENDARS_ALL: 'calendars.*',

  // WhatsApp Notifications
  WHATSAPP_SEND: 'whatsapp.send',
  WHATSAPP_VIEW_MESSAGES: 'whatsapp.viewMessages',
  WHATSAPP_MANAGE_TEMPLATES: 'whatsapp.manageTemplates',
  WHATSAPP_MANAGE_CONFIG: 'whatsapp.manageConfig',
  WHATSAPP_VIEW_STATS: 'whatsapp.viewStats',
  WHATSAPP_ALL: 'whatsapp.*',

  // Color Code Management
  COLORCODES_VIEW: 'colorcodes.view',
  COLORCODES_CREATE: 'colorcodes.create',
  COLORCODES_UPDATE: 'colorcodes.update',
  COLORCODES_DELETE: 'colorcodes.delete',
  COLORCODES_ALL: 'colorcodes.*',

  // Statistics & Reports
  STATS_VIEW_ALL: 'stats.viewAll',
  STATS_VIEW_OWN: 'stats.viewOwn',
  STATS_VIEW_BASIC: 'stats.viewBasic',
  STATS_ALL: 'stats.*',

  // System Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_ALL: 'settings.*',
} as const;

export type PermissionKey = keyof typeof Permissions;
export type PermissionValue = typeof Permissions[PermissionKey];

/**
 * Default Role Permission Sets
 */
export const DefaultRolePermissions = {
  SUPER_ADMIN: [
    Permissions.USERS_ALL,
    Permissions.ROLES_ALL,
    Permissions.PATIENTS_ALL,
    Permissions.DOCTORS_ALL,
    Permissions.APPOINTMENTS_ALL,
    Permissions.VISITS_ALL,
    Permissions.PREGNANCY_ALL,
    Permissions.CALENDARS_ALL,
    Permissions.WHATSAPP_ALL,
    Permissions.COLORCODES_ALL,
    Permissions.STATS_ALL,
    Permissions.SETTINGS_ALL,
  ],

  DOCTOR: [
    Permissions.PATIENTS_VIEW,
    Permissions.PATIENTS_CREATE,
    Permissions.PATIENTS_UPDATE,
    Permissions.APPOINTMENTS_VIEW,
    Permissions.APPOINTMENTS_VIEW_OWN,
    Permissions.APPOINTMENTS_UPDATE_OWN,
    Permissions.VISITS_ALL,
    Permissions.PREGNANCY_ALL,
    Permissions.CALENDARS_VIEW_OWN,
    Permissions.CALENDARS_UPDATE_OWN,
    Permissions.CALENDARS_MANAGE_WORKING_HOURS,
    Permissions.CALENDARS_MANAGE_TIME_SLOTS,
    Permissions.CALENDARS_MANAGE_EXCEPTIONS,
    Permissions.STATS_VIEW_OWN,
    Permissions.COLORCODES_VIEW,
  ],

  RECEPTIONIST: [
    Permissions.PATIENTS_ALL,
    Permissions.DOCTORS_VIEW,
    Permissions.APPOINTMENTS_ALL,
    Permissions.VISITS_VIEW,
    Permissions.CALENDARS_VIEW,
    Permissions.CALENDARS_VIEW_AVAILABLE_SLOTS,
    Permissions.WHATSAPP_SEND,
    Permissions.WHATSAPP_VIEW_MESSAGES,
    Permissions.COLORCODES_VIEW,
    Permissions.COLORCODES_UPDATE,
    Permissions.STATS_VIEW_BASIC,
  ],
} as const;

/**
 * Helper function to check if a permission matches a wildcard pattern
 * Example: "patients.*" matches "patients.view", "patients.create", etc.
 */
export function matchesPermission(userPermission: string, requiredPermission: string): boolean {
  // Exact match
  if (userPermission === requiredPermission) {
    return true;
  }

  // Wildcard match (e.g., "patients.*" matches "patients.view")
  if (userPermission.endsWith('.*')) {
    const module = userPermission.slice(0, -2);
    return requiredPermission.startsWith(module + '.');
  }

  return false;
}

/**
 * Helper function to check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(required =>
    userPermissions.some(userPerm => matchesPermission(userPerm, required))
  );
}

/**
 * Helper function to check if user has all of the required permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(required =>
    userPermissions.some(userPerm => matchesPermission(userPerm, required))
  );
}
