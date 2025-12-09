import React from 'react';
import { MessageSquare, Save, History, RotateCcw, Settings, Zap, Sliders, BookOpen, LogOut, User, Users, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Header = ({
  currentProvider,
  onSave,
  onToggleHistory,
  onReset,
  onToggleSettings,
  onToggleAdvanced,
  onToggleStudyGuide,
  onToggleTeacherDashboard,
  onToggleAdminPanel,
  showDebugButton,
  theme
}) => {
  const { user, logout, getTeacher } = useAuth();
  const isDark = theme === 'dark';
  const teacher = user?.role === 'student' ? getTeacher(user.teacherId) : null;

  return (
    <div className={`shadow-sm border-b p-4 ${
      isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-red-100'
    }`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className={isDark ? 'text-red-400' : 'text-red-600'} size={28} />
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              中文对话 Mandarin Tutor
            </h1>
            <div className="flex items-center gap-2">
              <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Zap size={14} />
                {currentProvider.name}
              </p>
              {teacher && (
                <p className="text-xs text-gray-500">
                  • Teacher: <span className="font-medium">{teacher.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* User Badge */}
          <div className="hidden sm:flex items-center px-3 py-1.5 bg-gray-100 rounded-lg mr-2">
            <User size={14} className="text-gray-600 mr-2" />
            <div className="text-xs">
              <div className="font-medium text-gray-900">{user?.name}</div>
              <div className="text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>

          {/* Role-specific button */}
          {user?.role === 'student' && onToggleStudyGuide && (
            <button
              onClick={onToggleStudyGuide}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-indigo-900' : 'hover:bg-indigo-100'
              }`}
              title="Study Guide"
            >
              <BookOpen size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            </button>
          )}

          {user?.role === 'teacher' && onToggleTeacherDashboard && (
            <button
              onClick={onToggleTeacherDashboard}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-blue-900' : 'hover:bg-blue-100'
              }`}
              title="Teacher Dashboard"
            >
              <Users size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
            </button>
          )}

          {user?.role === 'admin' && onToggleAdminPanel && (
            <button
              onClick={onToggleAdminPanel}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-red-900' : 'hover:bg-red-100'
              }`}
              title="Administration"
            >
              <Shield size={20} className={isDark ? 'text-red-400' : 'text-red-600'} />
            </button>
          )}

          {/* Advanced Settings - Admin only */}
          {showDebugButton && (
            <button
              onClick={onToggleAdvanced}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-purple-900'
                  : 'hover:bg-purple-100'
              }`}
              title="Advanced settings"
            >
              <Sliders size={20} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
            </button>
          )}

          {/* Save */}
          <button
            onClick={onSave}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-green-900'
                : 'hover:bg-green-100'
            }`}
            title="Save conversation"
          >
            <Save size={20} className={isDark ? 'text-green-400' : 'text-green-600'} />
          </button>

          {/* History */}
          <button
            onClick={onToggleHistory}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-blue-900'
                : 'hover:bg-blue-100'
            }`}
            title="View history"
          >
            <History size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
            }`}
            title="New conversation"
          >
            <RotateCcw size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>

          {/* Settings */}
          <button
            onClick={onToggleSettings}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
            }`}
            title="Settings"
          >
            <Settings size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-red-900'
                : 'hover:bg-red-100'
            }`}
            title="Logout"
          >
            <LogOut size={20} className={isDark ? 'text-red-400' : 'text-red-600'} />
          </button>
        </div>
      </div>
    </div>
  );
};