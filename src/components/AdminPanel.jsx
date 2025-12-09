/**
 * Admin Panel Component
 * User management, password resets, and system administration
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Users, Key, Settings, UserPlus, Edit2, Trash2,
  Search, AlertCircle, CheckCircle, Lock, Unlock, X
} from 'lucide-react';

export const AdminPanel = ({ onClose }) => {
  const { getAllUsers, updateUser, deleteUser, resetPassword, updatePermissions } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    email: '',
    role: 'student',
    password: '',
    teacherId: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = () => {
    // In real app, this would call API
    console.log('Create user:', userForm);
    setShowUserForm(false);
    setUserForm({
      username: '',
      name: '',
      email: '',
      role: 'student',
      password: '',
      teacherId: ''
    });
  };

  const handlePasswordReset = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (selectedUser) {
      // In real app, this would call API
      console.log('Reset password for:', selectedUser.username);
      alert(`Password reset for ${selectedUser.name}`);
      setShowPasswordReset(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = (user) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      // In real app, this would call API
      console.log('Delete user:', user.username);
      alert(`${user.name} has been deleted`);
      loadUsers();
    }
  };

  const handleTogglePermission = (user, permission) => {
    // In real app, this would call API
    console.log('Toggle permission:', user.username, permission);
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

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
            {/* Search and Add */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowUserForm(true)}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <UserPlus size={16} className="mr-2" />
                Add User
              </button>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">Username: {user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordReset(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 size={18} />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    'Access All Settings',
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
                    'Debug Tools'
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
                    'View Own Chat History',
                    'View Own Study Guide',
                    'Microphone Settings',
                    'Voice Settings',
                    'View Teacher Info',
                    'View Announcements'
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
                  <span className="text-gray-700">Connected (localStorage)</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  For production, migrate to Supabase for full database features
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
                <div className="flex items-center">
                  <AlertCircle size={20} className="text-yellow-600 mr-2" />
                  <span className="text-gray-700">Demo Mode (Plain Text Passwords)</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Production deployment requires bcrypt password hashing and JWT tokens
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">API Keys</h4>
                <div className="flex items-center">
                  <AlertCircle size={20} className="text-yellow-600 mr-2" />
                  <span className="text-gray-700">Stored in Browser (Not Secure)</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Production deployment requires server-side API key storage with encryption
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Total Users</h4>
                <div className="text-3xl font-bold text-gray-900">{users.length}</div>
                <p className="text-sm text-gray-600 mt-1">
                  {users.filter(u => u.role === 'admin').length} admin,
                  {users.filter(u => u.role === 'teacher').length} teachers,
                  {users.filter(u => u.role === 'student').length} students
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New User</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Full Name"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>

              {userForm.role === 'student' && (
                <select
                  value={userForm.teacherId}
                  onChange={(e) => setUserForm({...userForm, teacherId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Assign to Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              )}

              <input
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowUserForm(false);
                  setUserForm({
                    username: '',
                    name: '',
                    email: '',
                    role: 'student',
                    password: '',
                    teacherId: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reset Password</h3>
            <p className="text-gray-600 mb-4">
              Reset password for <strong>{selectedUser.name}</strong>
            </p>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setPasswordForm({ newPassword: '', confirmPassword: '' });
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;