import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function Layout({ children, hideNav = false }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {!hideNav && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-army-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DE</span>
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  <span className="text-white">DAHAR</span>
                  <span className="text-gray-500">ENGINEER</span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/"
                      className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                      My Courses
                    </Link>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 bg-dark-800 border border-gray-700 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm">{user?.name}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Logout"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="btn-primary text-sm"
                  >
                    Sign In
                  </Link>
                )}
              </nav>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-dark-900 border-t border-gray-800">
              <div className="px-4 py-4 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/"
                      className="flex items-center gap-3 text-gray-300 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <BookOpen className="w-5 h-5" />
                      My Courses
                    </Link>
                    <div className="border-t border-gray-800 pt-3">
                      <div className="flex items-center gap-2 text-gray-300 mb-3">
                        <User className="w-5 h-5" />
                        <span>{user?.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 text-gray-400 py-2"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="btn-primary text-sm block text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      <main className={hideNav ? '' : 'pt-16'}>
        {children}
      </main>
    </div>
  );
}
