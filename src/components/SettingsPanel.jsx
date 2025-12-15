/**
 * Settings Panel Component - V14
 * UPDATES:
 * - Debug toggle removed from non-admin users (admin only in AdminPanel)
 * - API model selection is admin-only
 * - Added profile editing section (display name, avatar)
 * - All users can adjust microphone settings
 * - Clean mobile-first responsive design
 */

import React, { useState, useRef } from 'react';
import { 
  Plus, CheckCircle, Server, Cloud, User, Camera, 
  Upload, X, Save, Mic, Volume2, Palette, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Preset avatar options
const PRESET_AVATARS = [
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'dragon', emoji: '🐉', label: 'Dragon' },
  { id: 'tiger', emoji: '🐅', label: 'Tiger' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
  { id: 'monkey', emoji: '🐵', label: 'Monkey' },
  { id: 'ox', emoji: '🐂', label: 'Ox' },
  { id: 'rooster', emoji: '🐓', label: 'Rooster' },
  { id: 'dog', emoji: '🐕', label: 'Dog' },
  { id: 'pig', emoji: '🐷', label: 'Pig' },
  { id: 'snake', emoji: '🐍', label: 'Snake' },
  { id: 'horse', emoji: '🐴', label: 'Horse' },
  { id: 'sheep', emoji: '🐑', label: 'Sheep' },
  { id: 'student', emoji: '👨‍🎓', label: 'Student' },
  { id: 'teacher', emoji: '👩‍🏫', label: 'Teacher' },
  { id: 'china', emoji: '🇨🇳', label: 'China' },
  { id: 'book', emoji: '📚', label: 'Scholar' },
];

export const SettingsPanel = ({
  show,
  aiProvider,
  setAiProvider,
  difficulty,
  setDifficulty,
  showTranslations,
  setShowTranslations,
  currentProvider,
  onSaveSettings,
  customProviders,
  onOpenCustomProviders,
  onAdjustNoiseGate,
  onAdjustMinSpeech,
  showDebugUI,
  setShowDebugUI,
  correctionMode,
  setCorrectionMode,
  theme,
  setTheme,
  voiceGender,
  setVoiceGender
}) => {
  const { profile, isAdmin, updateUserProfile } = useAuth();
  
  const [noiseGate, setNoiseGate] = useState(15);
  const [minSpeech, setMinSpeech] = useState(25);
  const [activeSection, setActiveSection] = useState('profile');
  
  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(profile?.display_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_type || 'panda');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(profile?.avatar_url || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  
  const fileInputRef = useRef(null);

  if (!show) return null;

  const handleNoiseGateChange = (value) => {
    setNoiseGate(value);
    onAdjustNoiseGate?.(value);
  };

  const handleMinSpeechChange = (value) => {
    setMinSpeech(value);
    onAdjustMinSpeech?.(value);
  };

  // Profile handlers
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      const updates = {
        display_name: newDisplayName.trim() || profile?.display_name,
        avatar_type: selectedAvatar,
        avatar_url: customAvatarUrl || null
      };
      
      const result = await updateUserProfile(updates);
      
      if (result.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditingProfile(false);
      } else {
        setProfileMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomAvatarUrl(e.target.result);
      setSelectedAvatar('custom');
    };
    reader.readAsDataURL(file);
  };

  const getCurrentAvatar = () => {
    if (selectedAvatar === 'custom' && customAvatarUrl) {
      return { type: 'image', src: customAvatarUrl };
    }
    const preset = PRESET_AVATARS.find(a => a.id === selectedAvatar);
    return { type: 'emoji', emoji: preset?.emoji || '🐼' };
  };

  const avatar = getCurrentAvatar();

  // Section tabs
  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'learning', label: 'Learning', icon: Globe },
    { id: 'display', label: 'Display', icon: Palette },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-lg">
      <div className="max-w-4xl mx-auto p-4">
        {/* Section Tabs */}
        <div className="flex space-x-1 mb-4 overflow-x-auto pb-2">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} className="mr-1.5" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <User size={20} className="mr-2 text-red-600" />
              Your Profile
            </h3>

            {/* Profile Message */}
            {profileMessage.text && (
              <div className={`p-3 rounded-lg text-sm ${
                profileMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {profileMessage.text}
              </div>
            )}

            {/* Current Profile Display */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    {avatar.type === 'image' ? (
                      <img src={avatar.src} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{avatar.emoji}</span>
                    )}
                  </div>
                  {editingProfile && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700"
                    >
                      <Camera size={14} />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Name and Email */}
                <div className="flex-1">
                  {editingProfile ? (
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  ) : (
                    <h4 className="font-semibold text-gray-900">
                      {profile?.display_name || 'User'}
                    </h4>
                  )}
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  <p className="text-xs text-gray-400 capitalize mt-1">
                    {profile?.role || 'Student'}
                  </p>
                </div>

                {/* Edit/Save Button */}
                <div>
                  {editingProfile ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingProfile(false);
                          setNewDisplayName(profile?.display_name || '');
                          setSelectedAvatar(profile?.avatar_type || 'panda');
                          setCustomAvatarUrl(profile?.avatar_url || '');
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700"
                      >
                        <X size={20} />
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {savingProfile ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Save size={20} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingProfile(true);
                        setNewDisplayName(profile?.display_name || '');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar Selection (when editing) */}
              {editingProfile && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Choose an avatar:</p>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_AVATARS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedAvatar(preset.id);
                          setCustomAvatarUrl('');
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                          selectedAvatar === preset.id
                            ? 'bg-red-100 ring-2 ring-red-500'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                        title={preset.label}
                      >
                        {preset.emoji}
                      </button>
                    ))}
                    {/* Custom upload option */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border-2 border-dashed ${
                        selectedAvatar === 'custom'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title="Upload custom image"
                    >
                      <Upload size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voice/Microphone Section - Available to ALL users */}
        {activeSection === 'voice' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Mic size={20} className="mr-2 text-blue-600" />
              Voice & Microphone Settings
            </h3>

            {/* Voice Gender */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Volume2 size={16} className="inline mr-1" />
                Voice Gender
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setVoiceGender('female')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    voiceGender === 'female'
                      ? 'bg-pink-100 text-pink-700 border-2 border-pink-300'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  👩 Female
                </button>
                <button
                  onClick={() => setVoiceGender('male')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    voiceGender === 'male'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  👨 Male
                </button>
              </div>
            </div>

            {/* Noise Gate */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Noise Gate Threshold: {noiseGate}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={noiseGate}
                onChange={(e) => handleNoiseGateChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values filter out more background noise
              </p>
            </div>

            {/* Minimum Speech Level */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Speech Level: {minSpeech}%
              </label>
              <input
                type="range"
                min="10"
                max="60"
                value={minSpeech}
                onChange={(e) => handleMinSpeechChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Adjust sensitivity for speech detection
              </p>
            </div>
          </div>
        )}

        {/* Learning Section */}
        {activeSection === 'learning' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Globe size={20} className="mr-2 text-green-600" />
              Learning Preferences
            </h3>

            {/* Difficulty Level */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="beginner">🌱 Beginner (HSK 1-2)</option>
                <option value="intermediate">🌿 Intermediate (HSK 3-4)</option>
                <option value="advanced">🌳 Advanced (HSK 5-6)</option>
                <option value="native">🎋 Native Level</option>
              </select>
            </div>

            {/* Show Translations */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Show Translations</p>
                <p className="text-sm text-gray-500">Display English translations</p>
              </div>
              <button
                onClick={() => setShowTranslations(!showTranslations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showTranslations ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showTranslations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Correction Mode */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Correction Mode</p>
                <p className="text-sm text-gray-500">AI will correct your Chinese</p>
              </div>
              <button
                onClick={() => setCorrectionMode(!correctionMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  correctionMode ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    correctionMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* AI Provider - ADMIN ONLY */}
            {isAdmin() && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center mb-2">
                  <Server size={16} className="mr-2 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Admin Only: AI Provider</span>
                </div>
                <select
                  value={aiProvider || 'claude'}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">GPT-4 (OpenAI)</option>
                  <option value="gemini">Gemini (Google)</option>
                  {Array.isArray(customProviders) && customProviders.map(p => (
                    <option key={p?.id || Math.random()} value={p?.id || ''}>
                      {p?.name || 'Custom Provider'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onOpenCustomProviders}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center"
                >
                  <Plus size={14} className="mr-1" />
                  Add Custom Provider
                </button>
              </div>
            )}
          </div>
        )}

        {/* Display Section */}
        {activeSection === 'display' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Palette size={20} className="mr-2 text-purple-600" />
              Display Settings
            </h3>

            {/* Theme */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['standard', 'dark', 'high-contrast'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                      theme === t
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'high-contrast' ? 'High Contrast' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Provider Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Cloud size={16} className="mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Current AI Provider: <span className="font-medium">
                    {typeof currentProvider === 'object' 
                      ? (currentProvider?.name || currentProvider?.model || 'Unknown')
                      : (currentProvider || aiProvider || 'Not set')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onSaveSettings}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle size={18} className="mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
