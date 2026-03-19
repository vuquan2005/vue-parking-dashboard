/**
 * Time utilities.
 *
 * Provides helpers for working with Unix timestamps (seconds or milliseconds) and
 * formatting them into readable strings.
 */

/**
 * Converts a Unix timestamp (seconds or milliseconds) to a JavaScript Date.
 *
 * The helper detects whether the input is in seconds (10-digit) or milliseconds (13-digit)
 * and normalizes it to milliseconds.
 */
export function unixTimestampToDate(unixTimestamp: number): Date {
    const timestampMs =
        unixTimestamp < 1_000_000_000_000 ? unixTimestamp * 1000 : unixTimestamp
    return new Date(timestampMs)
}

/**
 * Formats a Unix timestamp into a human-readable date/time string.
 *
 * Defaults to UTC+7 and the format `dd/MM/yyyy HH:mm:ss`.
 */
export function formatUnixTimestamp(
    unixTimestamp: number,
    options?: { timeZoneOffsetHours?: number },
): string {
    const date = unixTimestampToDate(unixTimestamp)
    const offsetMs = (options?.timeZoneOffsetHours ?? 7) * 60 * 60 * 1000
    const utcDate = new Date(date.getTime() + offsetMs)

    const yyyy = utcDate.getUTCFullYear()
    const mm = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(utcDate.getUTCDate()).padStart(2, '0')
    const hh = String(utcDate.getUTCHours()).padStart(2, '0')
    const min = String(utcDate.getUTCMinutes()).padStart(2, '0')
    const ss = String(utcDate.getUTCSeconds()).padStart(2, '0')

    return `${hh}:${min}:${ss} ${dd}/${mm}/${yyyy}`
}
