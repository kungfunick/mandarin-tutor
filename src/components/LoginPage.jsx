/**
 * Login Page Component - V14
 * UPDATES:
 * - Better error messages for wrong password
 * - Proper registration enabled/disabled from global settings
 * - Shows clear error message when login fails
 * - Mobile-first responsive design
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginFailed } from './LoginFailed';
import { 
  Eye, EyeOff, Loader, User, Lock, Mail, ArrowRight, 
  AlertTriangle, AlertCircle
} from 'lucide-react';

export const LoginPage = () => {
  const { login, register, loading: authLoading, error: authError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFailedScreen, setShowFailedScreen] = useState(false);
  const [lastAttemptEmail, setLastAttemptEmail] = useState('');
  
  // Registration enabled state - from global admin settings
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // Check if registration is enabled from global settings
  useEffect(() => {
    const checkRegistration = () => {
      // Check system_settings first (set by admin)
      const systemSettings = localStorage.getItem('system_settings');
      if (systemSettings) {
        try {
          const parsed = JSON.parse(systemSettings);
          if (parsed.registrationEnabled !== undefined) {
            setRegistrationEnabled(parsed.registrationEnabled);
            return;
          }
        } catch (e) {
          console.log('Could not parse system settings');
        }
      }
      
      // Fallback to individual setting
      const stored = localStorage.getItem('registrationEnabled');
      if (stored !== null) {
        setRegistrationEnabled(stored === 'true');
      }
    };
    
    checkRegistration();
    
    // Listen for storage changes (in case admin changes setting in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'system_settings' || e.key === 'registrationEnabled') {
        checkRegistration();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkRegistration, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLastAttemptEmail(email);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (!result.success) {
          // Show inline error for login failures
          setError({ 
            message: result.error || 'Invalid email or password', 
            code: 'invalid_credentials' 
          });
        }
      } else {
        // Check if registration is allowed
        if (!registrationEnabled) {
          setError({ 
            message: 'Registration is currently disabled. Please contact an administrator.', 
            code: 'registration_disabled' 
          });
          setLoading(false);
          return;
        }
        
        if (!displayName.trim()) {
          setError({ message: 'Please enter your name', code: 'validation' });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError({ message: 'Password must be at least 6 characters', code: 'validation' });
          setLoading(false);
          return;
        }
        const result = await register(email, password, displayName);
        if (!result.success) {
          setError({ message: result.error || 'Registration failed', code: 'registration_failed' });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError({ 
        message: err.message || 'An unexpected error occurred', 
        code: err.code || 'unknown' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setShowFailedScreen(false);
    setError(null);
  };

  const handleBackToLogin = () => {
    setShowFailedScreen(false);
    setError(null);
    setPassword('');
  };

  const handleForgotPassword = () => {
    alert('Password reset functionality coming soon. Please contact your administrator.');
  };

  // Show failed login screen for severe failures
  if (showFailedScreen && error) {
    return (
      <LoginFailed
        error={error}
        email={lastAttemptEmail}
        onRetry={handleRetry}
        onBack={handleBackToLogin}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🇨🇳</div>
          <h1 className="text-2xl font-bold text-gray-900">Mandarin Tutor</h1>
          <p className="text-gray-600">Learn Chinese with AI</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs - Only show Register tab if registration is enabled */}
          <div className="flex border-b">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                isLogin
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            {registrationEnabled ? (
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  !isLogin
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Register
              </button>
            ) : (
              <div 
                className="flex-1 py-4 text-center font-medium text-gray-300 cursor-not-allowed" 
                title="Registration is disabled by administrator"
              >
                Register
              </div>
            )}
          </div>

          {/* Registration Disabled Notice */}
          {!registrationEnabled && !isLogin && (
            <div className="p-4 bg-orange-50 border-b border-orange-100">
              <div className="flex items-center text-orange-700">
                <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                <span className="text-sm">Registration is currently disabled by administrator</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message - Always visible when there's an error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">
                      {isLogin ? 'Login Failed' : 'Error'}
                    </p>
                    <p className="text-red-600 text-sm mt-1">
                      {error.message}
                    </p>
                    {isLogin && error.code === 'invalid_credentials' && (
                      <p className="text-red-500 text-xs mt-2">
                        Please check your email and password are correct.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Name Field (Register only) */}
            {!isLogin && registrationEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                    error?.code === 'invalid_credentials' ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={isLogin ? 'Enter password' : 'Min 6 characters'}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                    error?.code === 'invalid_credentials' ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  minLength={isLogin ? undefined : 6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || authLoading || (!isLogin && !registrationEnabled)}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {loading || authLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? (
                registrationEnabled ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setIsLogin(false);
                        setError(null);
                      }}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400">
                    Contact your administrator to get an account
                  </span>
                )
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setError(null);
                    }}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center mt-6 text-xs text-gray-400">
          Mandarin Tutor v14.0
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
