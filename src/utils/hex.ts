/**
 * Generate a random colon-delimited hex byte string of the specified length.
 *
 * @param byteCount The number of random bytes to generate.
 * @returns A random colon-delimited hex string.
 */
export function randomHexString(byteCount: number): string {
    const parts: string[] = []
    for (let i = 0; i < byteCount; i++) {
        parts.push(
            Math.floor(Math.random() * 256)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase(),
        )
    }
    return parts.join(':')
}
