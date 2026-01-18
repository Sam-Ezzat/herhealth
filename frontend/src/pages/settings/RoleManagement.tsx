import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  user_count: number;
  created_at: string;
}

interface PermissionsByModule {
  [module: string]: string[];
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionsByModule>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
    fetchAvailablePermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      const data = response.data?.data || response.data;
      setRoles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      alert(error.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await api.get('/roles/permissions/available');
      const data = response.data?.data || response.data;
      setAvailablePermissions(data.byModule || {});
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({ name: '', permissions: [] });
    setShowModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions || [],
    });
    setShowModal(true);
  };

  const handleSaveRole = async () => {
    try {
      if (editingRole) {
        // Update existing role
        await api.put(`/roles/${editingRole.id}`, formData);
        alert('Role updated successfully');
      } else {
        // Create new role
        await api.post('/roles', formData);
        alert('Role created successfully');
      }
      setShowModal(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      alert(error.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/roles/${roleId}`);
      alert('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      alert(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleModuleWildcardToggle = (module: string) => {
    const wildcardPermission = `${module}.*`;
    const modulePermissions = availablePermissions[module] || [];
    
    if (formData.permissions.includes(wildcardPermission)) {
      // Remove wildcard and all module permissions
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !p.startsWith(`${module}.`)),
      }));
    } else {
      // Add wildcard (remove individual permissions first)
      setFormData(prev => ({
        ...prev,
        permissions: [
          ...prev.permissions.filter(p => !p.startsWith(`${module}.`)),
          wildcardPermission,
        ],
      }));
    }
  };

  const hasModuleWildcard = (module: string) => {
    return formData.permissions.includes(`${module}.*`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <button
          onClick={handleCreateRole}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Create Role
        </button>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{role.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {role.user_count} users
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {role.permissions?.length || 0} permissions
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(role.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={role.user_count > 0}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
            </div>

            <div className="p-6">
              {/* Role Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Nurse, Lab Technician"
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Permissions ({formData.permissions.length} selected)
                </label>

                {Object.entries(availablePermissions).map(([module, permissions]) => (
                  <div key={module} className="mb-6 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">
                        {module}
                      </h3>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasModuleWildcard(module)}
                          onChange={() => handleModuleWildcardToggle(module)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">All ({module}.*)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {permissions
                        .filter(p => !p.endsWith('.*'))
                        .map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={
                                formData.permissions.includes(permission) ||
                                hasModuleWildcard(module)
                              }
                              onChange={() => handlePermissionToggle(permission)}
                              disabled={hasModuleWildcard(module)}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              {permission.split('.')[1]}
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!formData.name || formData.permissions.length === 0}
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
