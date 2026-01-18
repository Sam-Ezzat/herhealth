import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiHome, FiUsers, FiCalendar, FiFileText, FiSettings, FiLogOut, FiMenu, FiUserPlus, FiClock, FiMessageSquare, FiUser, FiShield } from 'react-icons/fi';
import { useState } from 'react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/patients', icon: FiUsers, label: 'Patients' },
    { 
      path: '/doctors', 
      icon: FiUserPlus, 
      label: 'Doctors',
      submenu: [
        { path: '/doctors', label: 'All Doctors' },
        { path: '/settings/calendars', label: 'Schedules & Calendar' }
      ]
    },
    { 
      path: '/appointments', 
      icon: FiCalendar, 
      label: 'Appointments',
      submenu: [
        { path: '/appointments', label: 'List View' },
        { path: '/appointments/calendar', label: 'Calendar View' }
      ]
    },
    { path: '/visits', icon: FiFileText, label: 'Visits' },
    { 
      path: '/whatsapp', 
      icon: FiMessageSquare, 
      label: 'WhatsApp',
      submenu: [
        { path: '/settings/whatsapp/messages', label: 'Messages' },
        { path: '/settings/whatsapp/templates', label: 'Templates' },
        { path: '/settings/whatsapp', label: 'API Settings' }
      ]
    },
    { 
      path: '/administration', 
      icon: FiShield, 
      label: 'Administration',
      submenu: [
        { path: '/settings/users', label: 'Users' },
        { path: '/settings/roles', label: 'Roles & Permissions' }
      ]
    },
    { 
      path: '/settings', 
      icon: FiSettings, 
      label: 'Settings',
      submenu: [
        { path: '/settings/color-codes', label: 'Color Codes' }
      ]
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiMenu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-blue-600">HerHealth</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-800">{user?.fullName}</p>
              <p className="text-sm text-gray-500">{user?.roleName}</p>
            </div>
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <FiUser /> Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus.includes(item.path) || isActive(item.path);
              
              return (
                <div key={item.path}>
                  {hasSubmenu ? (
                    <button
                      onClick={() => toggleMenu(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  )}
                  {hasSubmenu && isExpanded && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.submenu!.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`block px-4 py-2 text-sm rounded-lg transition ${
                            location.pathname === subItem.path
                              ? 'bg-blue-100 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
