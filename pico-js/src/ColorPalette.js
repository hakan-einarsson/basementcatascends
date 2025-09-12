import UIElement from "./UIElement";
import { COLOR_PALETTE } from "./config/colors";
import { SCALE, SPRITE_TRUE_SIZE } from "./config/constants";


class ColorPalette extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.backgroundColor = [0, 0, 0];
        this.selectedColor = null;
        this.cellSize = 9 * SCALE; // Adjust cell size based on constants
    }

    draw(renderer) {
        renderer.drawRect(this.x - SCALE, this.y - SCALE, this.width + SCALE * 2, this.height + SCALE * 2, this.backgroundColor); // Svart
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                renderer.drawRect(this.x + x * this.cellSize, this.y + y * this.cellSize, this.cellSize, this.cellSize, COLOR_PALETTE[x + y * 4]);
            }
        }
        if (this.selectedColor !== null) {
            let cellX = this.selectedColor % 4;
            let cellY = Math.floor(this.selectedColor / 4);
            //draw four rectangles around the selected color
            let color = [0.8, 0.8, 0.8];
            renderer.drawRect(this.x + cellX * this.cellSize, this.y + cellY * this.cellSize, this.cellSize, SCALE, color);
            renderer.drawRect(this.x + cellX * this.cellSize, this.y + cellY * this.cellSize, SCALE, this.cellSize, color);
            renderer.drawRect(this.x + cellX * this.cellSize + this.cellSize - SCALE, this.y + cellY * this.cellSize, SCALE, this.cellSize, color);
            renderer.drawRect(this.x + cellX * this.cellSize, this.y + cellY * this.cellSize + this.cellSize - SCALE, this.cellSize, SCALE, color);
        }
    }

    onClick(x, y, event) {
        if (event.type === 'mousedown') {
            this.cellSize = SPRITE_TRUE_SIZE + SCALE; // Adjust cell size based on constants
            let cellX = Math.floor((x - this.x) / this.cellSize);
            let cellY = Math.floor((y - this.y) / this.cellSize);
            this.selectedColor = cellX + cellY * 4;
            return (COLOR_PALETTE[this.selectedColor]);
        }
    }

    getSelectedColor() {
        return this.selectedColor;
    }

}

export default ColorPalette;