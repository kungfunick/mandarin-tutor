/**
 * Admin Panel Component - V13
 * UPDATES:
 * - Added registration enable/disable toggle in System Settings
 * - Added global debug toggle that applies to all users
 * - Debug option only available to admins
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import {
  Shield, Users, Settings, Lock, Unlock, Key, Trash2, Mail,
  CheckCircle, AlertCircle, RefreshCw, Search, Plus, X,
  Eye, EyeOff, UserPlus, ChevronDown, Bug, UserX
} from 'lucide-react';

export const AdminPanel = ({ onClose, onSettingsChange }) => {
  const { user, profile, getAllUsers, updateUser, deleteUser, resetPassword, updatePermissions } = useAuth();
  
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    registrationEnabled: true,
    globalDebugEnabled: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load system settings from localStorage (fallback) or database
  const loadSystemSettings = useCallback(async () => {
    try {
      // First try localStorage for quick access
      const stored = localStorage.getItem('system_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSystemSettings(parsed);
      }

      // Then try database (if table exists)
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        const newSettings = {
          registrationEnabled: data.registration_enabled ?? true,
          globalDebugEnabled: data.global_debug_enabled ?? false
        };
        setSystemSettings(newSettings);
        localStorage.setItem('system_settings', JSON.stringify(newSettings));
      }
    } catch (err) {
      console.log('Using localStorage for system settings');
    }
  }, []);

  // Save system settings
  const saveSystemSettings = async (newSettings) => {
    setSavingSettings(true);
    try {
      // Always save to localStorage for immediate access
      localStorage.setItem('system_settings', JSON.stringify(newSettings));
      
      // Also save global debug to a separate key for easy access
      localStorage.setItem('globalDebugEnabled', newSettings.globalDebugEnabled.toString());
      localStorage.setItem('registrationEnabled', newSettings.registrationEnabled.toString());

      // Try to save to database
      try {
        await supabase
          .from('system_settings')
          .upsert([{
            id: 1,
            registration_enabled: newSettings.registrationEnabled,
            global_debug_enabled: newSettings.globalDebugEnabled,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          }], { onConflict: 'id' });
      } catch (dbErr) {
        console.log('Database save skipped (table may not exist)');
      }

      setSystemSettings(newSettings);
      
      // Notify parent component of settings change
      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle registration
  const handleToggleRegistration = () => {
    const newSettings = {
      ...systemSettings,
      registrationEnabled: !systemSettings.registrationEnabled
    };
    saveSystemSettings(newSettings);
  };

  // Toggle global debug
  const handleToggleGlobalDebug = () => {
    const newSettings = {
      ...systemSettings,
      globalDebugEnabled: !systemSettings.globalDebugEnabled
    };
    saveSystemSettings(newSettings);
  };

  useEffect(() => {
    loadUsers();
    loadSystemSettings();
  }, [loadUsers, loadSystemSettings]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter users
  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.display_name?.toLowerCase().includes(search) ||
      u.role?.toLowerCase().includes(search)
    );
  });

  const handlePasswordReset = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const result = await resetPassword(selectedUser.email);
      if (result.success) {
        setMessage({ type: 'success', text: `Password reset email sent to ${selectedUser.email}` });
        setShowPasswordReset(false);
        setSelectedUser(null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send reset email' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send reset email' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!confirm(`Delete user ${userToDelete.display_name || userToDelete.email}?\n\nThis cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteUser(userToDelete.id);
      if (result.success) {
        setMessage({ type: 'success', text: 'User deleted successfully' });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete user' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete user' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userToUpdate, newRole) => {
    setLoading(true);
    try {
      const result = await updatePermissions(userToUpdate.id, newRole);
      if (result.success) {
        setMessage({ type: 'success', text: `Updated ${userToUpdate.display_name || userToUpdate.email} to ${newRole}` });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update role' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update role' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userToToggle) => {
    setLoading(true);
    try {
      const result = await updateUser(userToToggle.id, { is_active: !userToToggle.is_active });
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `${userToToggle.display_name || userToToggle.email} is now ${!userToToggle.is_active ? 'active' : 'inactive'}` 
        });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update user' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'teacher': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="mr-2 text-red-600" size={28} />
              Administration
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              System management and user administration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className="text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-3 flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-red-600 border-b-2 border-red-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'permissions'
              ? 'text-red-600 border-b-2 border-red-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lock size={16} className="inline mr-2" />
          Permissions
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-red-600 border-b-2 border-red-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          System Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-4">
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`border rounded-xl p-4 transition-colors ${
                    !u.is_active ? 'bg-gray-50 opacity-75' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        u.role === 'admin' ? 'bg-red-100' :
                        u.role === 'teacher' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Users size={24} className={
                          u.role === 'admin' ? 'text-red-600' :
                          u.role === 'teacher' ? 'text-blue-600' : 'text-green-600'
                        } />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {u.display_name || u.email?.split('@')[0]}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(u.role)}`}>
                            {u.role}
                          </span>
                          {!u.is_active && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        {u.last_login && (
                          <p className="text-xs text-gray-500">
                            Last login: {new Date(u.last_login).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={loading || u.role === 'admin'}
                        className={`p-2 rounded-lg transition-colors ${
                          u.is_active 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                        } disabled:opacity-50`}
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {u.is_active ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowPasswordReset(true);
                        }}
                        disabled={loading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>

                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u, e.target.value)}
                        disabled={loading || u.role === 'admin'}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Role-Based Permissions</h3>

            <div className="space-y-6">
              {/* Admin */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-red-700 mb-3 flex items-center">
                  <Shield size={20} className="mr-2" />
                  Admin Role
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {['Full System Access', 'User Management', 'Password Resets', 'API Configuration', 'Debug Tools', 'System Settings', 'Registration Toggle'].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span className="text-gray-700">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                  <Users size={20} className="mr-2" />
                  Teacher Role
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {['View Students', 'Add Observations', 'Share Materials', 'Post Announcements', 'View Progress', 'Create Groups'].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span className="text-gray-700">{perm}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  {['Debug Tools', 'User Management'].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <AlertCircle size={16} className="text-red-600 mr-2" />
                      <span className="text-gray-500 line-through">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-700 mb-3 flex items-center">
                  <Users size={20} className="mr-2" />
                  Student Role
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {['Chat with AI', 'View Study Guide', 'Track Progress', 'View Materials'].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span className="text-gray-700">{perm}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  {['Debug Tools', 'API Config'].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <AlertCircle size={16} className="text-red-600 mr-2" />
                      <span className="text-gray-500 line-through">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">System Settings</h3>

            {/* Registration Toggle */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <UserPlus size={20} className="mr-2 text-blue-600" />
                    User Registration
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow new users to register on the login page
                  </p>
                </div>
                <button
                  onClick={handleToggleRegistration}
                  disabled={savingSettings}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    systemSettings.registrationEnabled ? 'bg-green-600' : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className={`mt-3 p-2 rounded-lg text-sm ${
                systemSettings.registrationEnabled 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-orange-50 text-orange-700'
              }`}>
                {systemSettings.registrationEnabled 
                  ? '✓ Registration enabled - new users can sign up'
                  : '⚠ Registration disabled - only admins can add users'}
              </div>
            </div>

            {/* Global Debug Toggle */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Bug size={20} className="mr-2 text-purple-600" />
                    Global Debug Mode
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Show debug UI for all users (speech recognition info)
                  </p>
                </div>
                <button
                  onClick={handleToggleGlobalDebug}
                  disabled={savingSettings}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    systemSettings.globalDebugEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.globalDebugEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className={`mt-3 p-2 rounded-lg text-sm ${
                systemSettings.globalDebugEnabled 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'bg-gray-50 text-gray-600'
              }`}>
                {systemSettings.globalDebugEnabled 
                  ? '✓ Debug mode enabled for all users'
                  : 'Debug mode is off'}
              </div>
            </div>

            {/* Database Status */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Database Status</h4>
              <div className="flex items-center">
                <CheckCircle size={20} className="text-green-600 mr-2" />
                <span className="text-gray-700">Connected to Supabase</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Real-time database with Row Level Security
              </p>
            </div>

            {/* Auth Status */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
              <div className="flex items-center">
                <CheckCircle size={20} className="text-green-600 mr-2" />
                <span className="text-gray-700">Supabase Auth (Secure)</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                JWT tokens with automatic refresh
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-1">
              Send password reset email to:
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">
              {selectedUser.email}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              The user will receive an email with a reset link.
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setSelectedUser(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} className="mr-2" />
                    Send Reset Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;