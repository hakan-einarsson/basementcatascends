import UIElement from "./UIElement";
import { SPRITE_TRUE_SIZE, SPRITE_SIZE, SCALE } from "./config/constants";
import { COLOR_PALETTE } from "./config/colors";

class LayerPicker extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        // this.layers = [2, 4, 8, 16, 32, 64, 128];
        this.layers = [1, 2, 3, 4, 5, 6, 7];
        this.selectedLayer = 0;
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y, SPRITE_TRUE_SIZE / 2, SPRITE_TRUE_SIZE - SCALE, COLOR_PALETTE[5]);
        renderer.drawLinedRect(this.x + SPRITE_TRUE_SIZE / 2, this.y, SPRITE_TRUE_SIZE * 1.5, SPRITE_TRUE_SIZE - SCALE, COLOR_PALETTE[5]);
        renderer.drawRect(this.x + SPRITE_TRUE_SIZE * 2, this.y, SPRITE_TRUE_SIZE / 2, SPRITE_TRUE_SIZE - SCALE, COLOR_PALETTE[5]);
        renderer.drawText('-', this.x / SCALE + 1, this.y / SCALE + 1, 7, { scale: 0.5 });
        renderer.drawText(this.getLayerText(), this.x / SCALE + SPRITE_SIZE / 2 + 1.5, this.y / SCALE + 1, 7, { scale: 0.5 });
        renderer.drawText('+', this.x / SCALE + SPRITE_SIZE * 2, this.y / SCALE + 1, 7, { scale: 0.5 });


    }

    handleClick(x, y) {
        if (x < this.x + SPRITE_TRUE_SIZE / 2) {
            // Clicked on the '-' button
            this.selectedLayer = Math.max(0, this.selectedLayer - 1);
        } else if (x > this.x + SPRITE_TRUE_SIZE * 2) {
            // Clicked on the '+' button
            this.selectedLayer = Math.min(this.layers.length - 1, this.selectedLayer + 1);
        }
        return this.layers[this.selectedLayer];
    }

    getLayerText() {
        // if single digit return 00digit, if double digit return 0digit
        const layer = this.layers[this.selectedLayer];
        if (layer < 10) {
            return `00${layer}`;
        } else if (layer < 100) {
            return `0${layer}`;
        }
        return `${layer}`;
    }
}

export default LayerPicker;