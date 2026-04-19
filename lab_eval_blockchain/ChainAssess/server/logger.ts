// Structured logging utility — replaces console.log spam
// Levels: error > warn > info > debug

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, context: string, message: string, data?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
  if (data && Object.keys(data).length > 0) {
    return `${base} ${JSON.stringify(data)}`;
  }
  return base;
}

function createLogger(context: string) {
  return {
    error(message: string, data?: Record<string, unknown>) {
      if (shouldLog('error')) console.error(formatMessage('error', context, message, data));
    },
    warn(message: string, data?: Record<string, unknown>) {
      if (shouldLog('warn')) console.warn(formatMessage('warn', context, message, data));
    },
    info(message: string, data?: Record<string, unknown>) {
      if (shouldLog('info')) console.log(formatMessage('info', context, message, data));
    },
    debug(message: string, data?: Record<string, unknown>) {
      if (shouldLog('debug')) console.log(formatMessage('debug', context, message, data));
    },
  };
}

export { createLogger };
export type { LogLevel };
