/**
 * Logger Utility - Fast and beautiful logging
 * Supports log level setting and source location display (line number)
 *
 * Uses bind trick so DevTools displays correct line number where log is called
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none'

// Priority order: debug < info < warn < error < none
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4,
}

/**
 * Configuration options for creating a new Logger instance.
 */
export interface LoggerOptions {
    /** Prefix to display before log messages (e.g. [Storage]) */
    prefix?: string
    /** Minimum log level to display for this specific logger instance. If not set, uses global level. */
    minLevel?: LogLevel
}

// Chỉ dùng icon để phân biệt các loại log
const LEVEL_ICONS: Record<Exclude<LogLevel, 'none'>, string> = {
    debug: '👾',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
}

// Mảng màu dùng để quay vòng cho các prefix
const PREFIX_COLORS = [
    '#20b2aa', // LightSeaGreen
    '#9370db', // MediumPurple
    '#3cb371', // MediumSeaGreen
    '#ff69b4', // HotPink
    '#1e90ff', // DodgerBlue
    '#ba55d3', // MediumOrchid
    '#00ced1', // DarkTurquoise
    '#7fffd4', // Aquamarine
    '#ffa07a', // LightSalmon
    '#20b2aa', // LightSeaGreen
    '#ffb6c1', // LightPink
    '#ffdab9', // PeachPuff
    '#add8e6', // LightBlue
    '#98fb98', // PaleGreen
    '#fafad2', // LemonChiffon
    '#e6e6fa', // Lavender
    '#d8bfd8', // Thistle
]

// Global log level - can be changed from settings
let globalMinLevel: LogLevel = 'debug'

export function setGlobalLogLevel(level: LogLevel): void {
    globalMinLevel = level
}

export function getGlobalLogLevel(): LogLevel {
    return globalMinLevel
}

// No-op function when log is disabled
const noop = () => {}

export class Logger {
    private prefix: string
    private minLevel: LogLevel | null
    private prefixColor: string
    private static colorIndex = 0

    constructor(options: LoggerOptions = {}) {
        this.prefix = options.prefix || ''
        this.minLevel = options.minLevel || null

        this.prefixColor = PREFIX_COLORS[Logger.colorIndex] || 'gray'
        Logger.colorIndex = (Logger.colorIndex + 1) % PREFIX_COLORS.length
    }

    private getEffectiveLevel(): LogLevel {
        return this.minLevel || globalMinLevel
    }

    private shouldLog(level: Exclude<LogLevel, 'none'>): boolean {
        const effectiveLevel = this.getEffectiveLevel()
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[effectiveLevel]
    }

    private getPrefixStyle(): string {
        return `color: ${this.prefixColor}; font-weight: bold;`
    }

    /**
     * Debug log - for development
     * Usage: log.d('message', data)
     * Line number will display correctly in DevTools
     */
    get d() {
        if (!this.shouldLog('debug')) return noop
        return console.log.bind(
            console,
            `%c${LEVEL_ICONS.debug}[${this.prefix}]`,
            this.getPrefixStyle(),
        )
    }

    /**
     * Info log
     */
    get i() {
        if (!this.shouldLog('info')) return noop
        return console.info.bind(
            console,
            `%c${LEVEL_ICONS.info}[${this.prefix}]`,
            this.getPrefixStyle(),
        )
    }

    /**
     * Warning log
     */
    get w() {
        if (!this.shouldLog('warn')) return noop
        return console.warn.bind(
            console,
            `%c${LEVEL_ICONS.warn}[${this.prefix}]`,
            this.getPrefixStyle(),
        )
    }

    /**
     * Error log
     */
    get e() {
        if (!this.shouldLog('error')) return noop
        return console.error.bind(
            console,
            `%c${LEVEL_ICONS.error}[${this.prefix}]`,
            this.getPrefixStyle(),
        )
    }

    /** Create child logger with sub-prefix */
    child(name: string): Logger {
        const options: LoggerOptions = {
            prefix: `${this.prefix}:${name}`,
        }
        if (this.minLevel) {
            options.minLevel = this.minLevel
        }
        // Gọi new Logger sẽ tự động lấy màu tiếp theo trong mảng
        return new Logger(options)
    }

    /** Set minimum log level for this logger */
    setLevel(level: LogLevel): void {
        this.minLevel = level
    }
}

// Main app logger
export const log = new Logger({ prefix: '' })

// Factory to create logger for each module
export function createLogger(name: string): Logger {
    return log.child(name)
}

// Test logging (Bạn có thể bỏ comment ra để test)
/*
const authLog = createLogger('Auth');
const userLog = createLogger('User');
const cartLog = createLogger('Cart');

log.i('Main app started');
authLog.d('Login attempt');
userLog.w('User profile not complete');
cartLog.e('Failed to checkout');
*/
