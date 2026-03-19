/**
 * Utility helpers for working with hex and byte arrays.
 */

/**
 * Convert an integer into a colon-delimited hex byte string.
 *
 * Example:
 *  intToHexByteString(0x01FF007A) // => "01:FF:00:7A"
 *  intToHexByteString(123, 4)     // => "00:00:00:7B"
 *
 * @param value The integer value to convert. Treated as an unsigned 32-bit integer.
 * @param byteCount Optional output length in bytes. If omitted, the function uses the
 *   minimum number of bytes needed to represent the value (at least 1).
 */
export function intToHexByteString(value: number, byteCount?: number): string {
    // Coerce to unsigned 32-bit to ensure predictable behavior for negative values
    const u32 = value >>> 0

    // If caller asked for a specific byte count, we respect it (but never less than 1).
    // If not, compute the minimum number of bytes needed to represent the value.
    const minNeededBytes = u32 === 0 ? 1 : Math.ceil(Math.log2(u32 + 1) / 8)
    const bytes = Math.max(1, byteCount ?? minNeededBytes)

    const parts: string[] = []
    for (let i = 0; i < bytes; i += 1) {
        const shift = (bytes - 1 - i) * 8
        const byte = (u32 >>> shift) & 0xff
        parts.push(byte.toString(16).padStart(2, '0').toUpperCase())
    }

    return parts.join(':')
}
