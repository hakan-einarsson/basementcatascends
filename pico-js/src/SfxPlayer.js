// SfxPlayer.js
import { getAudioContext } from "./tools/audioContext";
import AudioChannel from "./AudioChannel";
import { WAVE_MAP } from "./tools/soundTools";

class SfxPlayer {
    constructor(getSfxFn) {
        this.audioCtx = getAudioContext();
        this.getSfx = getSfxFn; // callback, t.ex. från LocalStorageHandler
        this.channels = [
            new AudioChannel(this.audioCtx),
            new AudioChannel(this.audioCtx),
            new AudioChannel(this.audioCtx),
            new AudioChannel(this.audioCtx)
        ];
    }

    play(sfx, channelIndex = 0) {
        // const sfx = this.getSfx(id);
        if (!sfx) return;
        const stepDuration = sfx.speed * (1 / 60);
        const channel = this.channels[channelIndex];

        sfx.notes.forEach((note, i) => {
            if (note.pitch >= 0) {
                const freq = this.pitchToFreq(note.pitch);
                const waveform = this.mapWaveform(note.waveform);
                const vol = note.volume ?? 7;
                const startTime = this.audioCtx.currentTime + i * stepDuration;

                channel.playOscillator(freq, waveform, stepDuration, vol, startTime);
            }
        });
    }

    pitchToFreq(pitch) {
        return 440 * Math.pow(2, (pitch - 30) / 12); // pitch 30 ≈ A4
    }

    mapWaveform(w) {
        return WAVE_MAP[w % WAVE_MAP.length];
    }
}

export default SfxPlayer;
