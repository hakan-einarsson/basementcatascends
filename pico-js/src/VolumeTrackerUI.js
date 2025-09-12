import UIElement from "./UIElement";
import NoteSlider from "./NoteSlider";
import { SCALE } from "./config/constants";
import { saveSfx } from "./tools/localStorageHandler";

class VolumeTrackerUI extends UIElement {
    constructor(x, y, width, height, sfxData, sfxIndex, noteIndex) {
        super(x, y, width, height);
        this.sfxData = sfxData;
        this.sfxIndex = sfxIndex;
        this.noteIndex = noteIndex;
        this.leftButtonDown = false;
        this.rightButtonDown = false;
        // this.bars = Array(32).fill(0).map((_, i) => {
        //     return new NoteSlider(
        //         this.x + SCALE / 2 + SCALE * 4 * i,
        //         this.y,
        //         SCALE * 3,
        //         this.height,
        //         this.sfxData[this.sfxIndex].notes[i].volume,
        //         0,
        //         7,
        //         (volume) => {
        //             this.sfxData[this.sfxIndex].notes[i].volume = volume;
        //             saveSfx(this.sfxData);
        //         }
        //     );
        // });
        this.setUpBars();
    }

    setUpBars() {
        this.bars = Array(32).fill(0).map((_, i) => {
            return new NoteSlider(
                this.x + SCALE / 2 + SCALE * 4 * i,
                this.y,
                SCALE * 3,
                this.height,
                this.sfxData[this.sfxIndex].notes[i].volume,
                0,
                7,
                (volume) => {
                    this.sfxData[this.sfxIndex].notes[i].volume = volume;
                    saveSfx(this.sfxData);
                }
            );
        });
    }

    draw(renderer) {
        // Rita volymindikatorn
        renderer.drawRect(this.x, this.y, this.width, this.height, [0, 0, 0]);

        this.bars.forEach(bar => bar.draw(renderer));
    }

    handleClick(x, y, event) {
        if (event.type === 'mousedown') {
            this.leftButtonDown = true;
        }
        if (event.type === 'mouseup') {
            this.leftButtonDown = false;
        }
        if (event.type === 'mousemove') {
            if (!this.leftButtonDown) return;
            this.bars.forEach(bar => {
                if (!bar.isHovered(x, y)) return;
                bar.handleClick(x, y, event);
            });
        }
    }

}

export default VolumeTrackerUI;
