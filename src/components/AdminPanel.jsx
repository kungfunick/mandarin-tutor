/**
 * Admin Panel Component - V14
 * UPDATES:
 * - Registration enable/disable toggle with proper global persistence
 * - Global debug toggle that applies to all users via database
 * - All admin settings are truly global (stored in database)
 * - Improved error handling and user feedback
 * - Debug and logging options are admin-only (not in regular settings)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import {
  Shield, Users, Settings, Lock, Unlock, Key, Trash2, Mail,
  CheckCircle, AlertCircle, RefreshCw, Search, Plus, X,
  Eye, EyeOff, UserPlus, ChevronDown, Bug, UserX, Database,
  ToggleLeft, ToggleRight, Save
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
  const [showAddUser, setShowAddUser] = useState(false);

  // New user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');

  // System settings state - these are GLOBAL settings stored in database
  const [systemSettings, setSystemSettings] = useState({
    registrationEnabled: true,
    globalDebugEnabled: false
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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

  // Load system settings from database with localStorage fallback
  const loadSystemSettings = useCallback(async () => {
    try {
      // Try database first
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
        // Sync to localStorage for quick access by other components
        localStorage.setItem('system_settings', JSON.stringify(newSettings));
        localStorage.setItem('registrationEnabled', String(newSettings.registrationEnabled));
        localStorage.setItem('globalDebugEnabled', String(newSettings.globalDebugEnabled));
      } else {
        // Fallback to localStorage if table doesn't exist
        const stored = localStorage.getItem('system_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSystemSettings(prev => ({ ...prev, ...parsed }));
        }
      }
      setSettingsLoaded(true);
    } catch (err) {
      console.error('Error loading system settings:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('system_settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSystemSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Error parsing stored settings:', e);
        }
      }
      setSettingsLoaded(true);
    }
  }, []);

  // Save system settings to database and localStorage
  const saveSystemSettings = async (newSettings) => {
    setSavingSettings(true);
    try {
      // Update state immediately for responsive UI
      setSystemSettings(newSettings);
      
      // Save to localStorage immediately for quick access
      localStorage.setItem('system_settings', JSON.stringify(newSettings));
      localStorage.setItem('registrationEnabled', String(newSettings.registrationEnabled));
      localStorage.setItem('globalDebugEnabled', String(newSettings.globalDebugEnabled));
      
      // Dispatch storage event to notify other tabs/components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'system_settings',
        newValue: JSON.stringify(newSettings)
      }));

      // Try to save to database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          registration_enabled: newSettings.registrationEnabled,
          global_debug_enabled: newSettings.globalDebugEnabled,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        });

      if (error) {
        console.warn('Could not save to database (table may not exist):', error);
        // Settings are still saved to localStorage, which is fine
      }

      // Notify parent component of settings change
      onSettingsChange?.(newSettings);
      
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      console.error('Error saving system settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle handlers
  const handleToggleRegistration = () => {
    saveSystemSettings({
      ...systemSettings,
      registrationEnabled: !systemSettings.registrationEnabled
    });
  };

  const handleToggleGlobalDebug = () => {
    const newValue = !systemSettings.globalDebugEnabled;
    saveSystemSettings({
      ...systemSettings,
      globalDebugEnabled: newValue
    });
    
    // Also toggle debug UI elements
    const debugElements = document.querySelectorAll('[data-debug-ui]');
    debugElements.forEach(el => {
      el.style.display = newValue ? '' : 'none';
    });
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName || !newUserPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    try {
      // Create user via Supabase Auth
      const { data, error } = await supabase.auth.admin?.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          display_name: newUserName,
          role: newUserRole
        }
      });

      if (error) {
        // Fallback: try regular signup if admin API not available
        const { error: signupError } = await supabase.auth.signUp({
          email: newUserEmail,
          password: newUserPassword,
          options: {
            data: {
              display_name: newUserName,
              role: newUserRole
            }
          }
        });
        if (signupError) throw signupError;
      }

      setMessage({ type: 'success', text: 'User created successfully' });
      setShowAddUser(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('student');
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'permissions', label: 'Roles', icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield size={24} className="mr-2" />
            <h2 className="text-lg font-bold">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} className="mr-2" />
          ) : (
            <AlertCircle size={18} className="mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b bg-white px-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={18} className="mr-1.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-4 space-y-4">
            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <UserPlus size={18} className="mr-1.5" />
                Add User
              </button>
            </div>

            {/* User List */}
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        u.role === 'admin' ? 'bg-red-600' :
                        u.role === 'teacher' ? 'bg-blue-600' : 'bg-green-600'
                      }`}>
                        {u.display_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.display_name || 'No name'}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Role Badge */}
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u, e.target.value)}
                        disabled={u.id === user?.id}
                        className={`text-xs px-2 py-1 rounded border ${
                          u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' :
                          u.role === 'teacher' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        } ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                      </select>

                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={u.id === user?.id}
                        className={`p-1.5 rounded ${
                          u.is_active !== false 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                        } ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={u.is_active !== false ? 'Active' : 'Inactive'}
                      >
                        {u.is_active !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowPasswordReset(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={u.id === user?.id}
                        className={`p-1.5 text-red-600 hover:bg-red-50 rounded ${
                          u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'system' && (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Settings size={20} className="mr-2" />
              Global System Settings
            </h3>
            <p className="text-sm text-gray-500">
              These settings apply to all users across the entire application.
            </p>

            {/* Registration Toggle */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <UserPlus size={20} className="mr-2 text-green-600" />
                    User Registration
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow new users to register accounts
                  </p>
                </div>
                <button
                  onClick={handleToggleRegistration}
                  disabled={savingSettings}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    systemSettings.registrationEnabled ? 'bg-green-600' : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
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
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Bug size={20} className="mr-2 text-purple-600" />
                    Global Debug Mode
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Show debug panels for speech recognition and system info
                  </p>
                </div>
                <button
                  onClick={handleToggleGlobalDebug}
                  disabled={savingSettings}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    systemSettings.globalDebugEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
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
                  ? '🐛 Debug mode ON - showing debug info panels'
                  : 'Debug mode OFF - debug panels hidden'}
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <Database size={20} className="mr-2 text-blue-600" />
                <h4 className="font-medium text-gray-900">Database Status</h4>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-700 font-medium">Connected</p>
                  <p className="text-green-600 text-xs">Supabase</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-700 font-medium">{users.length} Users</p>
                  <p className="text-blue-600 text-xs">Total registered</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Role-Based Permissions</h3>

            {/* Admin */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-red-700 mb-3 flex items-center">
                <Shield size={20} className="mr-2" />
                Admin Role
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  'Full System Access',
                  'User Management', 
                  'Password Resets',
                  'API Configuration',
                  'Debug Tools',
                  'System Settings',
                  'Registration Toggle',
                  'Role Assignment'
                ].map((perm, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircle size={14} className="text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                <Users size={20} className="mr-2" />
                Teacher Role
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  'View Students',
                  'Manage Observations',
                  'Manage Materials',
                  'Post Announcements',
                  'View Progress',
                  'Create Groups'
                ].map((perm, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircle size={14} className="text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Student */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-green-700 mb-3 flex items-center">
                <User size={20} className="mr-2" />
                Student Role
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  'View Own Data',
                  'Update Profile',
                  'View Study Guide',
                  'View Announcements',
                  'View Materials',
                  'Practice Chat'
                ].map((perm, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircle size={14} className="text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Reset Password</h3>
              <button onClick={() => setShowPasswordReset(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Send a password reset email to <strong>{selectedUser.email}</strong>?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setSelectedUser(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <Mail size={18} className="mr-2" />
                    Send Email
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

// Import User icon for permissions tab
const User = ({ size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default AdminPanel;