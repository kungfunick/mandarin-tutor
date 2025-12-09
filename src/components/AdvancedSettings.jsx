import React, { useState } from 'react';
import { Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

export const AdvancedSettings = ({ show, onClose }) => {
  const { hasPermission } = useAuth();

  // Only render if user has permission
  if (!hasPermission('canAccessDebug')) {
    return null;
  }

  const [fileLogging, setFileLogging] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);
  const [maxLogFiles, setMaxLogFiles] = useState(3);
  const [logHistory, setLogHistory] = useState([]);

  // Speech Recognition Advanced Settings
  const [speechSettings, setSpeechSettings] = useState({
    continuous: true,
    interimResults: true,
    maxAlternatives: 5,
    lang: 'zh-CN'
  });

  React.useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setLogCount(logger.getLogCount());
        setLogHistory(logger.getLogFileHistory());
      }, 1000);

      // Load max log files setting
      const savedMaxFiles = localStorage.getItem('loggerMaxFiles');
      if (savedMaxFiles) {
        setMaxLogFiles(parseInt(savedMaxFiles));
      }

      return () => clearInterval(interval);
    }
  }, [show]);

  const handleFileToggle = (enabled) => {
    setFileLogging(enabled);
    logger.setFileLogging(enabled);
  };

  const handleDownload = () => {
    logger.downloadLogFile();
    setLogHistory(logger.getLogFileHistory());
  };

  const handleClear = () => {
    if (confirm('Clear all debug logs? This cannot be undone.')) {
      logger.clearLogs();
      setLogCount(0);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear log file history? This will not delete the actual downloaded files.')) {
      logger.clearLogHistory();
      setLogHistory([]);
    }
  };

  const handleMaxLogFilesChange = (value) => {
    const newValue = parseInt(value);
    setMaxLogFiles(newValue);
    logger.setMaxLogFiles(newValue);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSpeechSettingChange = (key, value) => {
    const newSettings = { ...speechSettings, [key]: value };
    setSpeechSettings(newSettings);

    // Save to localStorage so it persists
    localStorage.setItem('speechRecognitionSettings', JSON.stringify(newSettings));

    console.log(`🎤 Speech setting updated: ${key} = ${value}`);
    logger.info(`Speech recognition setting changed: ${key} = ${value}`);
  };

  if (!show) return null;

  return (
    <div className="bg-purple-50 border-b border-purple-200 p-4 max-h-[70vh] overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">⚙️ Advanced Settings</h3>
          <button
            onClick={onClose}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {/* Logging Section */}
          <div className="bg-white rounded-lg border border-purple-200">
            <button
              onClick={() => toggleSection('logging')}
              className="w-full flex items-center justify-between p-4 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <h4 className="font-bold text-gray-800">Debug Logging</h4>
              </div>
              {expandedSection === 'logging' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === 'logging' && (
              <div className="p-4 border-t border-purple-100 space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">File Logging</p>
                    <p className="text-xs text-gray-600">Capture all console output to downloadable file ({logCount} entries)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fileLogging}
                      onChange={(e) => handleFileToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Max Log Files Setting */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="block font-medium text-gray-800 mb-2">
                    Max Log Files: {maxLogFiles} {maxLogFiles === 1 ? 'file' : 'files'}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxLogFiles}
                    onChange={(e) => handleMaxLogFilesChange(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Keep up to {maxLogFiles} log files. When limit reached, oldest will be overwritten.
                  </p>
                </div>

                {/* Log File History */}
                {logHistory.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-800">Log File History ({logHistory.length}/{maxLogFiles})</p>
                      <button
                        onClick={handleClearHistory}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear History
                      </button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {logHistory.map((log, idx) => (
                        <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                          <div className="font-medium">{log.filename}</div>
                          <div className="text-gray-500">
                            {new Date(log.timestamp).toLocaleString()} • {log.entryCount} entries
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fileLogging && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      disabled={logCount === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download size={18} />
                      Download Log ({logCount})
                    </button>
                    <button
                      onClick={handleClear}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                      Clear
                    </button>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  <p className="font-medium mb-1">About Logging:</p>
                  <ul className="space-y-1 text-xs text-blue-700">
                    <li>• When enabled, captures ALL console output (up to 5000 entries)</li>
                    <li>• Includes timestamps and log levels</li>
                    <li>• Download logs to share with support or for your own analysis</li>
                    <li>• Logs are cleared when you reload the page</li>
                    <li>• History tracks your last {maxLogFiles} downloaded log files</li>
                    <li>• When you reach the max, oldest history entry is removed (files not deleted)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Speech Recognition Section */}
          <div className="bg-white rounded-lg border border-purple-200">
            <button
              onClick={() => toggleSection('speech')}
              className="w-full flex items-center justify-between p-4 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎤</span>
                <h4 className="font-bold text-gray-800">Speech Recognition Settings</h4>
              </div>
              {expandedSection === 'speech' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === 'speech' && (
              <div className="p-4 border-t border-purple-100 space-y-4">
                <div className="space-y-3">
                  {/* Continuous Mode */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Continuous Mode</p>
                      <p className="text-xs text-gray-600">Keep listening until manually stopped</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={speechSettings.continuous}
                        onChange={(e) => handleSpeechSettingChange('continuous', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Interim Results */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Interim Results</p>
                      <p className="text-xs text-gray-600">Show text as you speak (live transcription)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={speechSettings.interimResults}
                        onChange={(e) => handleSpeechSettingChange('interimResults', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Max Alternatives */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block font-medium text-gray-800 mb-2">
                      Max Alternatives: {speechSettings.maxAlternatives}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={speechSettings.maxAlternatives}
                      onChange={(e) => handleSpeechSettingChange('maxAlternatives', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Number of alternative transcriptions to consider (1-10)
                    </p>
                  </div>

                  {/* Language Selection */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block font-medium text-gray-800 mb-2">
                      Recognition Language
                    </label>
                    <select
                      value={speechSettings.lang}
                      onChange={(e) => handleSpeechSettingChange('lang', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="zh-CN">Mandarin Chinese (Simplified)</option>
                      <option value="zh-TW">Mandarin Chinese (Traditional)</option>
                      <option value="zh-HK">Cantonese (Hong Kong)</option>
                      <option value="en-US">English (US) - for testing</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      Change only if having language detection issues
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
                  <p className="font-medium text-yellow-900 mb-1">⚠️ Advanced Options:</p>
                  <ul className="space-y-1 text-xs text-yellow-800">
                    <li>• Changes take effect on next microphone use</li>
                    <li>• Continuous mode with interim results recommended for best experience</li>
                    <li>• Higher max alternatives may improve accuracy but use more resources</li>
                    <li>• Settings are saved in your browser</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Browser Info Section */}
          <div className="bg-white rounded-lg border border-purple-200">
            <button
              onClick={() => toggleSection('browser')}
              className="w-full flex items-center justify-between p-4 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <h4 className="font-bold text-gray-800">Browser Information</h4>
              </div>
              {expandedSection === 'browser' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === 'browser' && (
              <div className="p-4 border-t border-purple-100">
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">User Agent:</span>
                    <span className="text-xs text-gray-600">{navigator.userAgent.split(' ').slice(0, 3).join(' ')}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Speech Recognition:</span>
                    <span className="text-xs text-gray-600">
                      {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Speech Synthesis:</span>
                    <span className="text-xs text-gray-600">
                      {'speechSynthesis' in window ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Language:</span>
                    <span className="text-xs text-gray-600">{navigator.language}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
