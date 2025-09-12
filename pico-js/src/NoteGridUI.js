import UIElement from "./UIElement";
import { COLOR_PALETTE } from "./config/colors";
import { SCALE } from "./config/constants";
import NoteSlider from "./NoteSlider";
import { saveSfx } from "./tools/localStorageHandler";

class NoteGridUI extends UIElement {
    constructor(x, y, width, height, sfxData, sfxIndex, onSelect = () => { }) {
        super(x, y, width, height);
        this.sfxData = sfxData;
        this.sfxIndex = sfxIndex;
        this.notes = sfxData[sfxIndex()].notes;
        this.onSelect = onSelect;
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.ctrlDown = false;
        // this.bars = Array(32).fill(0).map((_, i) => {
        //     return new NoteSlider(
        //         this.x + SCALE / 2 + SCALE * 4 * i,
        //         this.y,
        //         SCALE * 3,
        //         this.height,
        //         this.notes[i].pitch,
        //         0,
        //         63,
        //         (note) => {
        //             this.notes[i].pitch = this.ctrlDown ? this.snapToScale(note) : note;
        //             if (note >= 0 && this.notes[i].volume == 0) {
        //                 this.notes[i].volume = 1; // sätt volym till 1 om den är 0
        //             }
        //             this.onSelect(i);
        //         },
        //         (note) => {
        //             if (note >= 0 && this.notes[i].volume == 0) {
        //                 this.notes[i].volume = 1; // sätt volym till 1 om den är 0
        //             }
        //             this.notes[i].pitch = this.ctrlDown ? this.snapToScale(note) : note;
        //             saveSfx(this.sfxData);
        //         }
        //     );
        // }); // 32 bars
        this.setUpBars();
    }

    setUpBars() {
        this.bars = Array(32).fill(0).map((_, i) => {
            return new NoteSlider(
                this.x + SCALE / 2 + SCALE * 4 * i,
                this.y,
                SCALE * 3,
                this.height,
                this.notes[i].pitch,
                0,
                63,
                (note) => {
                    this.notes[i].pitch = this.ctrlDown ? this.snapToScale(note) : note;
                    if (note >= 0 && this.notes[i].volume == 0) {
                        this.notes[i].volume = 1; // sätt volym till 1 om den är 0
                    }
                    this.onSelect(i);
                },
                (note) => {
                    if (note >= 0 && this.notes[i].volume == 0) {
                        this.notes[i].volume = 1; // sätt volym till 1 om den är 0
                    }
                    this.notes[i].pitch = this.ctrlDown ? this.snapToScale(note) : note;
                    saveSfx(this.sfxData);
                }
            );
        }); // 32 bars
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y, this.width, this.height, COLOR_PALETTE[0]);

        this.bars.forEach(bar => bar.draw(renderer));
    }

    snapToScale(pitch, scale = [0, 2, 4, 5, 7, 9, 11]) {
        const octave = Math.floor(pitch / 12);
        const noteInOctave = pitch % 12;

        // hitta närmaste ton i skalan
        let nearest = scale[0];
        let diff = Infinity;
        for (const n of scale) {
            const d = Math.abs(noteInOctave - n);
            if (d < diff) {
                diff = d;
                nearest = n;
            }
        }
        let note = octave * 12 + nearest;
        return note;
    }

    handleClick(x, y, event) {
        if (event.type === 'mousedown') {
            if (event.button === 0) {
                this.leftMouseDown = true;
                this.bars.forEach((bar, index) => {
                    if (!bar.isHovered(x, y)) {
                        bar.selected = false;
                        return;
                    }
                    bar.selected = true;
                    this.onSelect(index);
                });
            }
            if (event.button === 2) this.rightMouseDown = true;
        }
        if (event.type === 'mouseup') {
            if (event.button === 0) this.leftMouseDown = false;
            if (event.button === 2) this.rightMouseDown = false;
        }
        if (event.type === 'mousemove') {
            if (this.leftMouseDown) {
                this.bars.forEach((bar, index) => {
                    if (!bar.isHovered(x, y)) {
                        bar.selected = false;
                        return;
                    }
                    bar.selected = true;
                    this.onSelect(index);
                    bar.handleClick(x, y, event);
                });
            }
            if (this.rightMouseDown) {
                this.bars.forEach(bar => {
                    if (!bar.isHovered(x, y)) return;
                    bar.handleRightClick(x, y, event);
                });
            }
        }
    }

    handleClickGlobal(event) {
        this.bars.forEach(bar => bar.handleClickGlobal(event));
    }

    handleKeyDown(event) {
        this.ctrlDown = true;
    }

    handleKeyUp(event) {
        this.ctrlDown = false;
    }

}

export default NoteGridUI;
