export const WAVE_MAP = ["triangle", "sawtooth", "square", "sine"];

export function getEmptySfx() {
    return {
        speed: 8,
        loopStart: -1,
        loopEnd: -1,
        notes: Array(32).fill().map(() => ({ pitch: -1, waveform: 0, volume: 0, effect: 0 }))
    };
}