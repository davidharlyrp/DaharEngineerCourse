import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-army-600 mb-4">
              <span className="text-white font-bold">DE</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400">
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Form */}
          <div className="card p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field w-full"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field w-full pr-10"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-army-400 hover:text-army-300 font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-dark-800/50 border border-gray-800 text-center">
            <p className="text-xs text-gray-500 mb-2">Demo Credentials</p>
            <p className="text-sm text-gray-400">Email: demo@dahar.engineer</p>
            <p className="text-sm text-gray-400">Password: demo123</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
