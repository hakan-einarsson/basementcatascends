class AudioChannel {
    constructor(audioCtx) {
        this.audioCtx = audioCtx;
        this.gain = this.audioCtx.createGain();
        this.gain.connect(audioCtx.destination);
        this.currentSource = null;
    }

    playOscillator(freq, waveform, duration, volume, startTime) {
        const osc = this.audioCtx.createOscillator();
        osc.type = waveform; // "square", "triangle", "sawtooth", "noise" (fake senare)
        osc.frequency.value = freq;

        const g = this.audioCtx.createGain();
        g.gain.value = volume / 7; // pico volym 0–7 → gain 0–1
        osc.connect(g).connect(this.gain);

        osc.start(startTime);
        osc.stop(startTime + duration);
        this.currentSource = osc;
    }
}

export default AudioChannel;