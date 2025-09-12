import UIElement from "./UIElement";
import { COLOR_PALETTE } from "./config/colors";
import { SCALE } from "./config/constants";

class NoteSlider extends UIElement {
    constructor(x, y, width, height, noteRef, min, max, onSelect = () => { }, onUpdate = () => { }) {
        super(x, y, width, height);
        this.noteRef = noteRef; // { pitch, waveform, volume, effect }
        this.min = min;
        this.max = max;
        this.onSelect = onSelect;
        this.onUpdate = onUpdate;
        this.dragging = false;
        this.selected = false;
    }

    draw(renderer) {
        const controlBarHeight = 3 * SCALE;
        const noteRef = this.noteRef >= 0 ? this.noteRef : 0;
        const normalized = (noteRef - this.min) / (this.max - this.min);
        const H = this.height;
        const barHeight = H * normalized;
        const barTop = this.y + H - barHeight;
        if (noteRef >= 0) {
            renderer.drawRect(this.x, barTop, this.width, barHeight, this.selected ? COLOR_PALETTE[12] : COLOR_PALETTE[1]);   // stapel
            const color = this.noteRef >= 0 ? COLOR_PALETTE[2] : [0.5, 0.5, 0.5, 0.5];
            renderer.drawRect(this.x, barTop - controlBarHeight, this.width, controlBarHeight, color); // handtag
        }
    }

    handleClick(mouseX, mouseY, event) {
        this.onSelect(this.noteRef);
        this.updateValue(mouseY);
    }

    handleRightClick(x, y, event) {
        this.noteRef = -1;
        this.onUpdate(-1);
    }

    handleClickGlobal(event) {
        if (event.type === "mouseup" && this.dragging) {
            this.dragging = false;
        }
    }

    handleMouseMove(mouseX, mouseY) {
        if (this.dragging) {
            this.updateValue(mouseY);
        }
    }

    updateValue(mouseY) {
        const H = this.height;
        const relY = mouseY - this.y;
        const clamped = Math.max(0, Math.min(H, relY));

        const t = 1 - (clamped / H);                     // 0 = botten, 1 = toppen
        const newValue = Math.floor(this.min + t * (this.max - this.min));

        this.noteRef = newValue;
        this.onUpdate(newValue);
    }
}

export default NoteSlider;
