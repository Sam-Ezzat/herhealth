import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import authService from '../../services/auth.service';
import { FiUser, FiLock, FiHeart } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(formData.username, formData.password);
      
      setAuth(response.user, response.token);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all hover:scale-[1.02]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
              <FiHeart className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            HerHealth
          </h1>
          <p className="text-gray-600 font-medium">OBGYN Clinic Management System</p>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4">
                <FiUser className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4">
                <FiLock className="text-gray-400" size={18} />
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-purple-600 hover:text-purple-700 font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link 
              to="/register" 
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              Create new account →
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-xs text-gray-600 font-medium mb-1">Demo Credentials</p>
          <p className="text-sm font-mono text-gray-700">admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
