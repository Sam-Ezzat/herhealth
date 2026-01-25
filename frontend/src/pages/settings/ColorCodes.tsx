import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import { toast } from 'react-toastify';

interface ColorCode {
  id: string;
  color_name: string;
  color_hex: string;
  notes?: string;
  is_active: boolean;
}

const ColorCodes = () => {
  const [colorCodes, setColorCodes] = useState<ColorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingColor, setEditingColor] = useState<ColorCode | null>(null);
  const [formData, setFormData] = useState({
    color_name: '',
    color_hex: '#3B82F6',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    fetchColorCodes();
  }, []);

  const fetchColorCodes = async () => {
    try {
      const response = await api.get('/color-codes');
      const data = response.data?.data || response.data || [];
      setColorCodes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load color codes');
      setColorCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingColor(null);
    setFormData({
      color_name: '',
      color_hex: '#3B82F6',
      notes: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (color: ColorCode) => {
    setEditingColor(color);
    setFormData({
      color_name: color.color_name,
      color_hex: color.color_hex,
      notes: color.notes || '',
      is_active: color.is_active
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.color_name.trim()) {
      toast.error('Color name is required');
      return;
    }

    try {
      if (editingColor) {
        await api.put(`/color-codes/${editingColor.id}`, formData);
        toast.success('Color code updated successfully');
      } else {
        await api.post('/color-codes', formData);
        toast.success('Color code created successfully');
      }
      setShowModal(false);
      fetchColorCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save color code');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this color code?')) return;

    try {
      await api.delete(`/color-codes/${id}`);
      toast.success('Color code deleted successfully');
      fetchColorCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete color code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Color Codes</h1>
          <p className="text-gray-600 mt-2">Customize patient color codes with custom notes</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
        >
          <FiPlus size={20} />
          Add Color Code
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colorCodes.map((color) => (
          <div
            key={color.id}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition"
            style={{ borderLeftColor: color.color_hex }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg shadow-md"
                  style={{ backgroundColor: color.color_hex }}
                />
                <div>
                  <h3 className="font-semibold text-gray-800">{color.color_name}</h3>
                  <p className="text-sm text-gray-500">{color.color_hex}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                color.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {color.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {color.notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{color.notes}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(color)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <FiEdit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(color.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {colorCodes.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
            <FiAlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Color Codes Found</h3>
            <p className="text-gray-500 mb-4">Create your first color code to get started</p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
            >
              <FiPlus size={20} />
              Add Color Code
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingColor ? 'Edit Color Code' : 'Add Color Code'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.color_name}
                  onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., High Risk, VIP, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.color_hex}
                    onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                    className="h-12 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color_hex}
                    onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about this color code..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 flex items-center gap-2"
              >
                <FiSave size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorCodes;
