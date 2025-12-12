/**
 * Login Failed Component
 * Mobile-first error screen for authentication failures
 */

import { useState } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Wifi, 
  Lock, 
  Server,
  HelpCircle,
  Mail
} from 'lucide-react';

// Error type configurations
const errorConfigs = {
  invalid_credentials: {
    icon: Lock,
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect.',
    suggestions: [
      'Check that your email is spelled correctly',
      'Make sure Caps Lock is off',
      'Try resetting your password'
    ],
    color: 'red'
  },
  network_error: {
    icon: Wifi,
    title: 'Connection Failed',
    message: 'Unable to connect to the server. Please check your internet connection.',
    suggestions: [
      'Check your WiFi or mobile data connection',
      'Try refreshing the page',
      'Wait a moment and try again'
    ],
    color: 'orange'
  },
  server_error: {
    icon: Server,
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified.',
    suggestions: [
      'Wait a few minutes and try again',
      'Clear your browser cache',
      'Try using a different browser'
    ],
    color: 'purple'
  },
  account_disabled: {
    icon: Lock,
    title: 'Account Disabled',
    message: 'Your account has been temporarily disabled. Please contact your administrator.',
    suggestions: [
      'Contact your teacher or administrator',
      'Check your email for any notifications',
      'Wait for account review'
    ],
    color: 'gray'
  },
  session_expired: {
    icon: RefreshCw,
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    suggestions: [
      'Your session timed out for security',
      'Simply log in again to continue',
      'Enable "Remember me" next time'
    ],
    color: 'blue'
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Login Failed',
    message: 'An unexpected error occurred. Please try again.',
    suggestions: [
      'Refresh the page and try again',
      'Clear your browser cache',
      'Contact support if the problem persists'
    ],
    color: 'red'
  }
};

// Determine error type from error object
const getErrorType = (error) => {
  if (!error) return 'unknown';
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  if (errorMessage.includes('invalid') || 
      errorMessage.includes('credential') || 
      errorMessage.includes('password') ||
      errorCode.includes('invalid')) {
    return 'invalid_credentials';
  }
  
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('offline')) {
    return 'network_error';
  }
  
  if (errorMessage.includes('500') || 
      errorMessage.includes('server') ||
      errorMessage.includes('internal')) {
    return 'server_error';
  }
  
  if (errorMessage.includes('disabled') || 
      errorMessage.includes('blocked') ||
      errorMessage.includes('suspended')) {
    return 'account_disabled';
  }
  
  if (errorMessage.includes('session') || 
      errorMessage.includes('expired') ||
      errorMessage.includes('token')) {
    return 'session_expired';
  }
  
  return 'unknown';
};

export const LoginFailed = ({ 
  error, 
  onRetry, 
  onBack, 
  onForgotPassword,
  onContactSupport,
  email = '' 
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const errorType = getErrorType(error);
  const config = errorConfigs[errorType];
  const IconComponent = config.icon;
  
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      icon: 'text-red-600',
      border: 'border-red-200',
      button: 'bg-red-600 hover:bg-red-700',
      link: 'text-red-600 hover:text-red-700'
    },
    orange: {
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      icon: 'text-orange-600',
      border: 'border-orange-200',
      button: 'bg-orange-600 hover:bg-orange-700',
      link: 'text-orange-600 hover:text-orange-700'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      icon: 'text-purple-600',
      border: 'border-purple-200',
      button: 'bg-purple-600 hover:bg-purple-700',
      link: 'text-purple-600 hover:text-purple-700'
    },
    gray: {
      bg: 'bg-gray-50',
      iconBg: 'bg-gray-100',
      icon: 'text-gray-600',
      border: 'border-gray-200',
      button: 'bg-gray-600 hover:bg-gray-700',
      link: 'text-gray-600 hover:text-gray-700'
    },
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      icon: 'text-blue-600',
      border: 'border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700',
      link: 'text-blue-600 hover:text-blue-700'
    }
  };
  
  const colors = colorClasses[config.color];
  
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className={`${colors.bg} rounded-2xl border ${colors.border} shadow-lg overflow-hidden`}>
          {/* Header */}
          <div className="p-6 text-center">
            {/* Icon */}
            <div className={`w-16 h-16 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <IconComponent size={32} className={colors.icon} />
            </div>
            
            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {config.title}
            </h1>
            
            {/* Message */}
            <p className="text-gray-600 text-sm">
              {config.message}
            </p>
            
            {/* Email display if available */}
            {email && errorType === 'invalid_credentials' && (
              <p className="mt-2 text-sm text-gray-500 bg-white rounded-lg px-3 py-2 inline-block">
                {email}
              </p>
            )}
          </div>
          
          {/* Suggestions */}
          <div className="px-6 pb-4">
            <div className="bg-white rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                What you can try
              </p>
              {config.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start text-sm text-gray-600">
                  <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-xs font-medium text-gray-500">
                    {index + 1}
                  </span>
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 pt-2 space-y-3">
            {/* Primary Action - Try Again */}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`w-full ${colors.button} text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50`}
            >
              {isRetrying ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Try Again</span>
                </>
              )}
            </button>
            
            {/* Secondary Action - Back to Login */}
            <button
              onClick={onBack}
              className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
        
        {/* Footer Links */}
        <div className="mt-6 flex justify-center space-x-6 text-sm">
          {errorType === 'invalid_credentials' && onForgotPassword && (
            <button
              onClick={onForgotPassword}
              className={`${colors.link} flex items-center space-x-1`}
            >
              <Lock size={14} />
              <span>Reset Password</span>
            </button>
          )}
          
          {onContactSupport && (
            <button
              onClick={onContactSupport}
              className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <HelpCircle size={14} />
              <span>Get Help</span>
            </button>
          )}
        </div>
        
        {/* Technical Details (collapsed by default) */}
        {error?.message && (
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 text-center">
              Technical Details
            </summary>
            <div className="mt-2 bg-gray-100 rounded-lg p-3 text-xs font-mono text-gray-600 break-all">
              {error.message}
              {error.code && <div className="mt-1 text-gray-500">Code: {error.code}</div>}
            </div>
          </details>
        )}
        
        {/* Brand Footer */}
        <div className="mt-6 text-center">
          <span className="text-2xl">🇨🇳</span>
          <p className="text-xs text-gray-400 mt-1">Mandarin Tutor</p>
        </div>
      </div>
    </div>
  );
};

export default LoginFailed;