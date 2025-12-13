/**
 * Login Page Component - V13
 * UPDATES:
 * - Respects registration enabled/disabled setting from admin
 * - Removed demo accounts section
 * - Shows message when registration is disabled
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginFailed } from './LoginFailed';
import { Eye, EyeOff, Loader, User, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';

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
  
  // Registration enabled state
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // Check if registration is enabled
  useEffect(() => {
    const checkRegistration = () => {
      // Check localStorage for the setting
      const stored = localStorage.getItem('registrationEnabled');
      if (stored !== null) {
        setRegistrationEnabled(stored === 'true');
      }
      
      // Also check system_settings
      const systemSettings = localStorage.getItem('system_settings');
      if (systemSettings) {
        try {
          const parsed = JSON.parse(systemSettings);
          if (parsed.registrationEnabled !== undefined) {
            setRegistrationEnabled(parsed.registrationEnabled);
          }
        } catch (e) {
          console.log('Could not parse system settings');
        }
      }
    };
    
    checkRegistration();
    
    // Listen for storage changes (in case admin changes setting in another tab)
    window.addEventListener('storage', checkRegistration);
    return () => window.removeEventListener('storage', checkRegistration);
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
          setError({ message: result.error || 'Login failed', code: 'invalid_credentials' });
          setShowFailedScreen(true);
        }
      } else {
        // Check if registration is allowed
        if (!registrationEnabled) {
          setError({ message: 'Registration is currently disabled. Please contact an administrator.', code: 'registration_disabled' });
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
      if (isLogin) {
        setShowFailedScreen(true);
      }
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

  // Show failed login screen
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
              <div className="flex-1 py-4 text-center font-medium text-gray-300 cursor-not-allowed" title="Registration is disabled">
                Register
              </div>
            )}
          </div>

          {/* Registration Disabled Notice */}
          {!registrationEnabled && !isLogin && (
            <div className="p-4 bg-orange-50 border-b border-orange-100">
              <div className="flex items-center text-orange-700">
                <AlertTriangle size={18} className="mr-2" />
                <span className="text-sm">Registration is currently disabled by administrator</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message */}
            {error && !showFailedScreen && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error.message}
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Enter password' : 'Min 6 characters'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default LoginPage;