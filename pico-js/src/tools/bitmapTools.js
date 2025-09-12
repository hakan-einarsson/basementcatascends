// --- Decode: 0..255 -> [aktiva lagerindex]
export function decodeFlags(value, bits = 8) {
    const v = value & ((1 << bits) - 1);
    const active = [];
    for (let n = 0; n < bits; n++) {
        if (v & (1 << n)) active.push(n);
    }
    return active; // ex: decodeFlags(138) -> [1,3,7]
}

// --- Encode: [lagerindex] -> 0..255
export function encodeFlags(indices, bits = 8) {
    let v = 0;
    for (const n of indices) {
        if (Number.isInteger(n) && n >= 0 && n < bits) v |= (1 << n);
    }
    return v & ((1 << bits) - 1);
}

// --- Helpers
export const hasLayer = (mask, n) => ((mask >>> 0) & (1 << n)) !== 0;
export const toggleLayer = (mask, n, bits = 8) => (mask ^ (1 << n)) & ((1 << bits) - 1);
export const setLayer = (mask, n, on = true, bits = 8) =>
    on ? ((mask | (1 << n)) & ((1 << bits) - 1)) : (mask & ~(1 << n)) & ((1 << bits) - 1);

// Valfritt: boolean-array (UI-bindning)
export function decodeToBools(value, bits = 8) {
    const v = value & ((1 << bits) - 1);
    const arr = new Array(bits).fill(false);
    for (let n = 0; n < bits; n++) arr[n] = !!(v & (1 << n));
    return arr; // t.ex. [false,true,false,true,false,false,false,true] för 138
}
