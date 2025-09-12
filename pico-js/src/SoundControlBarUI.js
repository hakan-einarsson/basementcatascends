import UIElement from "./UIElement";
import ValueStepperUI from "./ValueStepperUI";
import { COLOR_PALETTE } from "./config/colors";
import { COL_SIZE, SCALE } from "./config/constants";
import { WAVE_MAP, getEmptySfx } from "./tools/soundTools";
import { saveSfx } from "./tools/localStorageHandler";

class SoundControlBarUI extends UIElement {
    constructor(x, y, width, height, sfxData, sfxIndex, onChangeParent = () => { }) {
        super(x, y, width, height);
        this.sfxData = sfxData;
        this.sfxIndex = sfxIndex;
        this.onChangeParent = onChangeParent;
        this.speed = sfxData[sfxIndex].speed ?? 8;
        this.wave = sfxData[sfxIndex].notes[0].wave ?? 0;
        this.indexButton = new ValueStepperUI(this.x + COL_SIZE / 3, this.y + COL_SIZE - SCALE, COL_SIZE * 2.5, COL_SIZE, {
            value: sfxIndex,
            min: 0,
            max: 63,
            step: 1,
            textWidth: COL_SIZE,
            formatter: (v) => v < 9 ? `0${v + 1}` : v + 1,
            onChange: (newValue) => {
                this.sfxIndex = newValue;
                if (this.sfxData[newValue] === undefined) {
                    this.sfxData[newValue] = getEmptySfx();
                }
                this.speed = this.sfxData[newValue].speed ?? 8;
                this.wave = this.sfxData[newValue].wave ?? 0;
                this.onChangeParent('index', newValue);
                saveSfx(this.sfxData);

            }
        });
        this.speedButton = new ValueStepperUI(this.x + COL_SIZE / 3 + COL_SIZE * 3, this.y + COL_SIZE - SCALE, COL_SIZE * 2.5, COL_SIZE, {
            value: this.speed,
            min: 0,
            max: 15,
            step: 1,
            textWidth: COL_SIZE,
            formatter: (v) => { return v < 10 ? `0${v}` : v; },
            onChange: (newValue) => {
                this.speed = newValue;
                // this.sfxData[this.sfxIndex].speed = newValue;
                this.onChangeParent('speed', newValue);
                saveSfx(this.sfxData);
            }
        });
        this.waveButton = new ValueStepperUI(this.x + COL_SIZE / 3 + COL_SIZE * 6, this.y + COL_SIZE - SCALE, COL_SIZE * 5, COL_SIZE, {
            value: this.wave,
            min: 0,
            max: 3,
            step: 1,
            textWidth: COL_SIZE * 3.5,
            formatter: (v) => WAVE_MAP[v],
            onChange: (newValue) => {
                this.wave = newValue;
                // this.sfxData[this.sfxIndex].wave = newValue;
                this.onChangeParent('wave', newValue);
                saveSfx(this.sfxData);
            }
        });
        //volume is handled in other component

    }

    draw(renderer) {
        // Rita bakgrunden för ljudkontrollpanelen
        renderer.drawRect(this.x, this.y, this.width, this.height, [0.5, 0.5, 0.5]);
        renderer.drawText(`SFX:`, this.x / SCALE + 8, this.y / SCALE + 1, 7, { scale: 0.5 });
        renderer.drawText(`Speed:`, this.x / SCALE + 8 * 3.5, this.y / SCALE + 1, 7, { scale: 0.5 });
        renderer.drawText(`Wave:`, this.x / SCALE + 8 * 7.75, this.y / SCALE + 1, 7, { scale: 0.5 });
        this.indexButton.draw(renderer);
        this.speedButton.draw(renderer);
        this.waveButton.draw(renderer);
    }

    updateValues() {
        // this.indexButton.setValue(this.sfxIndex);
        this.speedButton.setValue(this.speed);
        this.waveButton.setValue(this.wave);
    }

    handleClick(x, y, event) {
        if (event.type === 'mouseup' && event.button === 0) {
            if (this.indexButton.isHovered(x, y)) this.indexButton.handleClick(x, y, event);
            if (this.speedButton.isHovered(x, y)) this.speedButton.handleClick(x, y, event);
            if (this.waveButton.isHovered(x, y)) this.waveButton.handleClick(x, y, event);
        }
    }

}

export default SoundControlBarUI;
