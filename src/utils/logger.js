/**
 * Logger utility for debugging
 * Logs to console and/or file based on settings
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 log entries
    this.sessionStart = new Date().toISOString();
    this.consoleEnabled = true;
    this.fileEnabled = false;
  }

  setConsoleLogging(enabled) {
    this.consoleEnabled = enabled;
    this.log('info', `Console logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  setFileLogging(enabled) {
    this.fileEnabled = enabled;
    this.log('info', `File logging ${enabled ? 'enabled' : 'disabled'}`);
    if (enabled) {
      // Clear previous session logs when enabling
      this.logs = [];
    }
  }

  log(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    const logEntry = {
      timestamp,
      level,
      message
    };

    // Add to memory
    if (this.fileEnabled) {
      this.logs.push(logEntry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift(); // Remove oldest
      }
    }

    // Console output
    if (this.consoleEnabled) {
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      switch (level) {
        case 'error':
          console.error(prefix, ...args);
          break;
        case 'warn':
          console.warn(prefix, ...args);
          break;
        case 'info':
          console.info(prefix, ...args);
          break;
        default:
          console.log(prefix, ...args);
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
    if (!this.fileEnabled) {
      console.warn('File logging is not enabled. Enable it in settings first.');
      return;
    }

    const logContent = this.logs.map(entry =>
      `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    ).join('\n');

    const header = `Mandarin Tutor Debug Log\nSession Started: ${this.sessionStart}\nTotal Entries: ${this.logs.length}\n${'='.repeat(80)}\n\n`;
    const fullContent = header + logContent;

    // Create blob and download
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandarin-tutor-debug-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Debug log file downloaded');
  }

  clearLogs() {
    this.logs = [];
    this.log('info', 'Logs cleared');
  }

  getLogCount() {
    return this.logs.length;
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;