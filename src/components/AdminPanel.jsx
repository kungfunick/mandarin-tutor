/**
 * Admin Panel Component
 * User management, password resets, and system administration
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Users, Key, Settings, UserPlus, Edit2, Trash2,
  Search, AlertCircle, CheckCircle, Lock, Unlock, X, Mail, RefreshCw
} from 'lucide-react';

export const AdminPanel = ({ onClose }) => {
  const { getAllUsers, updateUser, deleteUser, resetPassword, updatePermissions, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    email: '',
    role: 'student',
    teacherId: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const allUsers = getAllUsers();
      setUsers(allUsers || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setMessage({ type: 'error', text: 'Failed to load users' });
    }
  };

  const filteredUsers = users.filter(user =>
    (user.display_name || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePasswordReset = async () => {
    if (!selectedUser?.email) {
      setMessage({ type: 'error', text: 'User email not found' });
      return;
    }

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

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.display_name || user.email}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteUser(user.id);
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

  const handleUpdateRole = async (user, newRole) => {
    setLoading(true);
    try {
      const result = await updatePermissions(user.id, newRole);
      if (result.success) {
        setMessage({ type: 'success', text: `Updated ${user.display_name || user.email} to ${newRole}` });
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

  const handleToggleActive = async (user) => {
    setLoading(true);
    try {
      const result = await updateUser(user.id, { is_active: !user.is_active });
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `${user.display_name || user.email} is now ${!user.is_active ? 'active' : 'inactive'}` 
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
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'teacher':
        return 'bg-blue-100 text-blue-700';
      case 'student':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const teachers = users.filter(u => u.role === 'teacher');

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
              ? 'bg-white text-red-600 border-b-2 border-red-600'
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
              ? 'bg-white text-red-600 border-b-2 border-red-600'
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
              ? 'bg-white text-red-600 border-b-2 border-red-600'
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
          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className={`border rounded-lg p-4 transition-shadow hover:shadow-md ${
                  !user.is_active ? 'bg-gray-50 opacity-75' : 'bg-white'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-red-100' :
                        user.role === 'teacher' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Users size={24} className={
                          user.role === 'admin' ? 'text-red-600' :
                          user.role === 'teacher' ? 'text-blue-600' : 'text-green-600'
                        } />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {user.display_name || user.email?.split('@')[0]}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                          {!user.is_active && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.last_login && (
                          <p className="text-xs text-gray-500">
                            Last login: {new Date(user.last_login).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={loading || user.role === 'admin'}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={user.is_active ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.is_active ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>

                      {/* Password Reset */}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordReset(true);
                        }}
                        disabled={loading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Send Password Reset Email"
                      >
                        <Key size={18} />
                      </button>

                      {/* Role Dropdown */}
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user, e.target.value)}
                        disabled={loading || user.role === 'admin'}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Delete */}
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete User"
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
              {/* Admin Permissions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-red-700 mb-3 flex items-center">
                  <Shield size={20} className="mr-2" />
                  Admin Role
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Full System Access',
                    'User Management',
                    'Password Resets',
                    'API Configuration',
                    'Debug Tools',
                    'View All Data',
                    'System Settings'
                  ].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span className="text-gray-700">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Permissions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                  <Users size={20} className="mr-2" />
                  Teacher Role
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'View Assigned Students',
                    'Add Observations',
                    'Create Lesson Plans',
                    'Post Announcements',
                    'Manage Learning Materials',
                    'View Student Progress'
                  ].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span className="text-gray-700">{perm}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  {[
                    'API Configuration',
                    'Debug Tools',
                    'User Management'
                  ].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <AlertCircle size={16} className="text-red-600 mr-2" />
                      <span className="text-gray-500 line-through">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Permissions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-700 mb-3 flex items-center">
                  <Users size={20} className="mr-2" />
                  Student Role
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'View Own Study Guide',
                    'View Own Chat History',
                    'Voice & Mic Settings',
                    'View Teacher Info',
                    'View Announcements',
                    'View Learning Materials'
                  ].map((perm, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span className="text-gray-700">{perm}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  {[
                    'API Configuration',
                    'Debug Tools',
                    'Change Difficulty',
                    'View Other Students'
                  ].map((perm, idx) => (
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

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">System Settings</h3>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Database Status</h4>
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-green-600 mr-2" />
                  <span className="text-gray-700">Connected to Supabase</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Real-time database with Row Level Security enabled
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-green-600 mr-2" />
                  <span className="text-gray-700">Supabase Auth (Secure)</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  JWT tokens with automatic refresh and session validation
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">API Keys</h4>
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-green-600 mr-2" />
                  <span className="text-gray-700">Server-side Storage (Vercel)</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  API keys stored securely in Vercel environment variables
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Total Users</h4>
                <div className="text-3xl font-bold text-gray-900">{users.length}</div>
                <p className="text-sm text-gray-600 mt-1">
                  {users.filter(u => u.role === 'admin').length} admin,{' '}
                  {users.filter(u => u.role === 'teacher').length} teachers,{' '}
                  {users.filter(u => u.role === 'student').length} students
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {users.filter(u => u.is_active).length} active,{' '}
                  {users.filter(u => !u.is_active).length} inactive
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Mail className="mr-2 text-blue-600" size={24} />
              Send Password Reset
            </h3>
            <p className="text-gray-600 mb-4">
              Send a password reset email to <strong>{selectedUser.display_name || selectedUser.email}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Email: {selectedUser.email}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              <p>The user will receive an email with a link to reset their password.</p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setSelectedUser(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
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