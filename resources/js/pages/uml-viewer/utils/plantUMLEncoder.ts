/**
 * Encode PlantUML text to URL-safe format
 * Based on PlantUML's encoding algorithm
 */
export function encodePlantUML(plantUML: string): string {
    // Compress using deflate
    const compressed = deflate(plantUML);

    // Encode to base64-like format
    let encoded = '';
    for (let i = 0; i < compressed.length; i += 3) {
        const b1 = compressed.charCodeAt(i);
        const b2 = i + 1 < compressed.length ? compressed.charCodeAt(i + 1) : 0;
        const b3 = i + 2 < compressed.length ? compressed.charCodeAt(i + 2) : 0;

        encoded += encode6bit(b1 >> 2);
        encoded += encode6bit(((b1 & 0x3) << 4) | (b2 >> 4));
        encoded += encode6bit(((b2 & 0xf) << 2) | (b3 >> 6));
        encoded += encode6bit(b3 & 0x3f);
    }

    return encoded;
}

/**
 * Encode 6-bit value to PlantUML character
 */
function encode6bit(b: number): string {
    if (b < 10) {
        return String.fromCharCode(48 + b);
    }
    b -= 10;
    if (b < 26) {
        return String.fromCharCode(65 + b);
    }
    b -= 26;
    if (b < 26) {
        return String.fromCharCode(97 + b);
    }
    b -= 26;
    if (b === 0) {
        return '-';
    }
    if (b === 1) {
        return '_';
    }
    return '?';
}

/**
 * Simple deflate compression (simplified version)
 * For production, use a proper compression library like pako
 */
function deflate(text: string): string {
    // This is a simplified version
    // In production, you should use a proper deflate library
    try {
        // Convert to UTF-8 bytes
        const utf8 = unescape(encodeURIComponent(text));

        // Simple compression (this is not real deflate, just a placeholder)
        // You should use pako.js or similar for real deflate compression
        return utf8;
    } catch (e) {
        console.error('Error compressing PlantUML:', e);
        return text;
    }
}

/**
 * Alternative: Use this if you have pako installed
 * npm install pako
 *
 * import pako from 'pako';
 *
 * function deflate(text: string): string {
 *     const utf8 = new TextEncoder().encode(text);
 *     const compressed = pako.deflate(utf8, { level: 9 });
 *     return String.fromCharCode.apply(null, Array.from(compressed));
 * }
 */
