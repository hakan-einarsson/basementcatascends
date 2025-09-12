import UIElement from "./UIElement";
import { CANVAS_WIDTH, COL_SIZE } from "./config/constants";
import SoundControlBarUI from "./SoundControlBarUI";
import NoteGridUI from "./NoteGridUI";
import VolumeTrackerUI from "./VolumeTrackerUI";
import SfxPlayer from "./SfxPlayer";
import { loadSfx, saveSfx } from "./tools/localStorageHandler";

class SoundUI extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        // this.sfxData = loadSfx() || this.populateFirstSfxWithEmptyData();
        // this.sfxPlayer = new SfxPlayer((id) => this.sfxData[id]);
        // this.currentSfx = 0;
        // this.currentNote = 0;
        // this.wave = 0;
        // this.speed = 8;
        // this.volume = 1;
        // this.soundControlBarUI = new SoundControlBarUI(0, COL_SIZE, CANVAS_WIDTH, COL_SIZE * 2, this.sfxData, this.currentSfx, (type, value) => { this[type] = value; this.updateNote(type, value); });
        // this.noteGridUI = new NoteGridUI(0, COL_SIZE * 3, CANVAS_WIDTH, COL_SIZE * 9, this.sfxData, () => this.currentSfx, (note) => this.updateSelectedNote(note));
        // this.volumeTrackerUI = new VolumeTrackerUI(0, height - COL_SIZE * 2, CANVAS_WIDTH, COL_SIZE * 3, this.sfxData, this.currentSfx, this.currentNote);
    }

    init() {

    }

    populateFirstSfxWithEmptyData() {
        const sfxData = [];
        const sfx = []
        sfx.notes[0] = { pitch: 60, waveform: 0, volume: 1, effect: 0 }; // Lägg till en C4-note för testning
        sfxData.push(sfx);
        saveSfx(sfxData);
        return sfxData;
    }

    updateSelectedNote(note) {
        this.currentNote = note;
        const sfx = this.sfxData[this.currentSfx];
        this.soundControlBarUI.wave = sfx.notes[this.currentNote].waveform;
        this.soundControlBarUI.updateValues();
    }

    updateNote(type, value) {
        const sfx = this.sfxData[this.currentSfx];
        if (type === 'speed') {
            sfx.speed = value;
        }
        if (type === 'wave') {
            if (this.shiftPressed) {
                for (let i = sfx.notes.length - 1; i >= 0; i--) {
                    if (sfx.notes[i].pitch < 0) continue;
                    sfx.notes[i].waveform = value;
                }
            } else {
                sfx.notes[this.currentNote].waveform = value;
            }

        }
        if (type === 'volume') {
            sfx.notes[this.currentNote].volume = value;
        }
        if (type === 'index') {
            this.currentSfx = value;
            this.noteGridUI.sfxIndex = value;
            this.noteGridUI.notes = this.sfxData[value].notes;
            this.noteGridUI.setUpBars();
            this.soundControlBarUI.wave = this.sfxData[value].notes[0].wave ?? 0;
            this.soundControlBarUI.speed = this.sfxData[value].speed ?? 8;
            this.soundControlBarUI.index = value;
            this.soundControlBarUI.updateValues();
            this.volumeTrackerUI.sfxIndex = value;
            this.volumeTrackerUI.setUpBars();

        }
    }

    draw(renderer) {
        // Här kan du rita UI-element för ljudinställningar, t.ex. en volymkontroll
        this.soundControlBarUI.draw(renderer);
        this.noteGridUI.draw(renderer);
        this.volumeTrackerUI.draw(renderer);
    }

    handleClick(x, y, event) {
        if (this.soundControlBarUI.isHovered(x, y)) {
            this.soundControlBarUI.handleClick(x, y, event);
        }
        if (this.noteGridUI.isHovered(x, y)) {
            this.noteGridUI.handleClick(x, y, event);
        }
        if (this.volumeTrackerUI.isHovered(x, y)) {
            this.volumeTrackerUI.handleClick(x, y, event);
        }
    }

    handleClickGlobal(event) {
        this.noteGridUI.handleClickGlobal(event);
    }

    handleKeyUp(event) {
        if (event.code === "Space") {
            this.sfxPlayer.play(this.sfxData[this.currentSfx]);
        }
        if (event.key === "Shift") {
            this.shiftPressed = false;
        }
        if (event.key === "Control") {
            this.noteGridUI.handleKeyUp(event);
        }
    }

    handleKeyDown(event) {
        if (event.key === "Shift") {
            this.shiftPressed = true;
        }
        if (event.key === "Control") {
            this.noteGridUI.handleKeyDown(event);
        }
    }

}

export default SoundUI;
