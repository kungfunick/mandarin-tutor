import React, { useState, useEffect } from 'react';
import { Download, Trash2, Eye, EyeOff } from 'lucide-react';
import logger from '../utils/logger';

export const DebugPanel = ({ show, onClose }) => {
  const [consoleLogging, setConsoleLogging] = useState(true);
  const [fileLogging, setFileLogging] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const [showDebugUI, setShowDebugUI] = useState(true);

  useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setLogCount(logger.getLogCount());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [show]);

  const handleConsoleToggle = (enabled) => {
    setConsoleLogging(enabled);
    logger.setConsoleLogging(enabled);
  };

  const handleFileToggle = (enabled) => {
    setFileLogging(enabled);
    logger.setFileLogging(enabled);
  };

  const handleDownload = () => {
    logger.downloadLogFile();
  };

  const handleClear = () => {
    if (confirm('Clear all debug logs?')) {
      logger.clearLogs();
      setLogCount(0);
    }
  };

  const handleToggleDebugUI = () => {
    const newValue = !showDebugUI;
    setShowDebugUI(newValue);
    localStorage.setItem('showDebugUI', newValue.toString());

    // Toggle visibility of debug info panels
    const debugElements = document.querySelectorAll('[data-debug-ui]');
    debugElements.forEach(el => {
      el.style.display = newValue ? '' : 'none';
    });
  };

  if (!show) return null;

  return (
    <div className="bg-purple-50 border-b border-purple-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">🐛 Debug Settings</h3>
          <button
            onClick={onClose}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {/* Console Logging */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Console Logging</p>
              <p className="text-xs text-gray-600">Show debug output in browser console (F12)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consoleLogging}
                onChange={(e) => handleConsoleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* File Logging */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div>
              <p className="font-medium text-gray-800">File Logging</p>
              <p className="text-xs text-gray-600">Save logs to downloadable file ({logCount} entries)</p>
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

          {/* Debug UI Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Debug UI Panels</p>
              <p className="text-xs text-gray-600">Show blue debug info boxes in main UI</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDebugUI}
                onChange={handleToggleDebugUI}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Actions */}
          {fileLogging && (
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={logCount === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={18} />
                Download Log File
              </button>
              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} />
                Clear Logs
              </button>
            </div>
          )}

          <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 text-sm text-purple-900">
            <p className="font-medium mb-1">Debug Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Console logging</strong>: View real-time debug output (F12)</li>
              <li>• <strong>File logging</strong>: Save logs to file for sharing/analysis</li>
              <li>• <strong>Debug UI</strong>: Hide blue info boxes for cleaner interface</li>
              <li>• Logs are cleared when you reload the page</li>
              <li>• File logs limited to last 1000 entries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};