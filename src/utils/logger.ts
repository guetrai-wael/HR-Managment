// Logger utility for development and production environments
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  isDevelopment: boolean;
  enableConsole: boolean;
  enableRemoteLogging: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors
    if (!this.config.isDevelopment) {
      return level === 'error';
    }
    // In development, log everything if console is enabled
    return this.config.enableConsole;
  }

  private formatMessage(level: LogLevel, context: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
    return data ? `${prefix} ${message} - ${JSON.stringify(data)}` : `${prefix} ${message}`;
  }

  debug(context: string, message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', context, message, data));
    }
  }

  info(context: string, message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', context, message, data));
    }
  }

  warn(context: string, message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', context, message, data));
    }
  }

  error(context: string, message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', context, message, error));
    }
    
    // In production, you could send to remote logging service here
    if (this.config.enableRemoteLogging) {
      this.sendToRemoteLogging('error', context, message, error);
    }
  }

  private sendToRemoteLogging(_level: LogLevel, _context: string, _message: string, _data?: unknown): void {
    // Placeholder for remote logging service (Sentry, LogRocket, etc.)
    // This would only run in production
    if (!this.config.isDevelopment) {
      // Example: Send to Sentry or similar service
      // sentry.captureException(new Error(`${_context}: ${_message}`), { extra: _data });
    }
  }
}

// Create and export logger instance
const isDevelopment = import.meta.env.DEV;

export const logger = new Logger({
  isDevelopment,
  enableConsole: isDevelopment, // Only enable console in development
  enableRemoteLogging: !isDevelopment, // Only enable remote logging in production
});

// Helper functions for common use cases
export const logError = (context: string, message: string, error?: unknown) => {
  logger.error(context, message, error);
};

export const logInfo = (context: string, message: string, data?: unknown) => {
  logger.info(context, message, data);
};

export const logDebug = (context: string, message: string, data?: unknown) => {
  logger.debug(context, message, data);
};

export const logWarn = (context: string, message: string, data?: unknown) => {
  logger.warn(context, message, data);
};
