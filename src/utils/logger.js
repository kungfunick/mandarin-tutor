/**
 * Enhanced Logger utility for comprehensive debugging
 * Captures all console output and provides downloadable log files
 * Supports multiple log file rotation
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 5000; // Increased from 1000 to 5000 for more comprehensive logging
    this.sessionStart = new Date().toISOString();
    this.consoleEnabled = true;
    this.fileEnabled = false;
    this.maxLogFiles = 3; // Default to 3 log files
    this.logFileHistory = []; // Track created log files
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console)
    };

    // Don't hijack console by default - only when file logging is enabled
    this.consoleHijacked = false;

    // Load settings from localStorage
    this.loadSettings();
  }

  loadSettings() {
    try {
      const savedMaxFiles = localStorage.getItem('loggerMaxFiles');
      if (savedMaxFiles) {
        this.maxLogFiles = parseInt(savedMaxFiles);
      }
      const savedHistory = localStorage.getItem('logFileHistory');
      if (savedHistory) {
        this.logFileHistory = JSON.parse(savedHistory);
      }
    } catch (e) {
      console.error('Error loading logger settings:', e);
    }
  }

  setMaxLogFiles(count) {
    this.maxLogFiles = Math.min(Math.max(1, count), 10); // Clamp between 1 and 10
    localStorage.setItem('loggerMaxFiles', this.maxLogFiles.toString());
    this.originalConsole.info(`Max log files set to: ${this.maxLogFiles}`);

    // Clean up old files if we reduced the limit
    this.cleanupOldLogFiles();
  }

  cleanupOldLogFiles() {
    if (this.logFileHistory.length > this.maxLogFiles) {
      const toRemove = this.logFileHistory.length - this.maxLogFiles;
      this.logFileHistory = this.logFileHistory.slice(toRemove);
      localStorage.setItem('logFileHistory', JSON.stringify(this.logFileHistory));
    }
  }

  setConsoleLogging(enabled) {
    this.consoleEnabled = enabled;

    if (!enabled && this.consoleHijacked) {
      // Restore original console if we're turning off console logging
      this.restoreConsole();
    }

    this.log('info', `Console logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  setFileLogging(enabled) {
    this.fileEnabled = enabled;

    if (enabled && !this.consoleHijacked) {
      // Hijack console to capture everything
      this.hijackConsole();
      this.log('info', 'File logging enabled - capturing all console output');
    } else if (!enabled && this.consoleHijacked) {
      this.restoreConsole();
      this.log('info', 'File logging disabled');
    }

    if (enabled) {
      // Clear previous session logs when enabling
      this.logs = [];
      this.sessionStart = new Date().toISOString();
    }
  }

  hijackConsole() {
    if (this.consoleHijacked) return;

    const self = this;

    // Hijack all console methods
    ['log', 'error', 'warn', 'info', 'debug'].forEach(method => {
      console[method] = function(...args) {
        // Call original console method
        self.originalConsole[method](...args);

        // Add to log file
        if (self.fileEnabled) {
          const timestamp = new Date().toISOString();
          const message = args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch (e) {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' ');

          const logEntry = {
            timestamp,
            level: method,
            message
          };

          self.logs.push(logEntry);
          if (self.logs.length > self.maxLogs) {
            self.logs.shift(); // Remove oldest
          }
        }
      };
    });

    this.consoleHijacked = true;
    this.originalConsole.info('✅ Console hijacking enabled - all output will be captured in log file');
  }

  restoreConsole() {
    if (!this.consoleHijacked) return;

    ['log', 'error', 'warn', 'info', 'debug'].forEach(method => {
      console[method] = this.originalConsole[method];
    });

    this.consoleHijacked = false;
    this.originalConsole.info('Console restored to normal');
  }

  log(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logEntry = {
      timestamp,
      level,
      message
    };

    // Add to memory if file logging enabled
    if (this.fileEnabled) {
      this.logs.push(logEntry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    }

    // Console output if enabled
    if (this.consoleEnabled) {
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      switch (level) {
        case 'error':
          this.originalConsole.error(prefix, ...args);
          break;
        case 'warn':
          this.originalConsole.warn(prefix, ...args);
          break;
        case 'info':
          this.originalConsole.info(prefix, ...args);
          break;
        case 'debug':
          this.originalConsole.debug(prefix, ...args);
          break;
        default:
          this.originalConsole.log(prefix, ...args);
      }
    }
  }

  error(...args) {
    this.log('error', ...args);
  }

  warn(...args) {
    this.log('warn', ...args);
  }

  info(...args) {
    this.log('info', ...args);
  }

  debug(...args) {
    this.log('debug', ...args);
  }

  downloadLogFile() {
    if (!this.fileEnabled || this.logs.length === 0) {
      alert('No logs to download. Enable file logging in Advanced Settings first and use the app.');
      return;
    }

    const logContent = this.logs.map(entry =>
      `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    ).join('\n');

    const header = `Mandarin Tutor Debug Log
Session Started: ${this.sessionStart}
Session Duration: ${this.getSessionDuration()}
Total Entries: ${this.logs.length}
Max Entries: ${this.maxLogs}
${'='.repeat(100)}

`;
    const fullContent = header + logContent;

    // Create blob and download
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `mandarin-tutor-debug-${Date.now()}.log`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Add to history
    const logEntry = {
      filename,
      timestamp: new Date().toISOString(),
      entryCount: this.logs.length
    };
    this.logFileHistory.unshift(logEntry);

    // Rotate if needed
    if (this.logFileHistory.length > this.maxLogFiles) {
      this.logFileHistory = this.logFileHistory.slice(0, this.maxLogFiles);
    }

    // Save history
    localStorage.setItem('logFileHistory', JSON.stringify(this.logFileHistory));

    this.originalConsole.log('✅ Debug log file downloaded:', `${this.logs.length} entries`);
    this.originalConsole.log(`📁 Log history: ${this.logFileHistory.length}/${this.maxLogFiles} files`);
  }

  getLogFileHistory() {
    return this.logFileHistory;
  }

  clearLogHistory() {
    this.logFileHistory = [];
    localStorage.removeItem('logFileHistory');
    this.originalConsole.log('Log file history cleared');
  }

  getSessionDuration() {
    const start = new Date(this.sessionStart);
    const now = new Date();
    const diff = now - start;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  clearLogs() {
    this.logs = [];
    this.sessionStart = new Date().toISOString();
    this.log('info', 'Logs cleared - new session started');
  }

  getLogCount() {
    return this.logs.length;
  }

  cleanup() {
    this.restoreConsole();
  }
}

// Create singleton instance
const logger = new Logger();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.cleanup();
  });
}

export default logger;