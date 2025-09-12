import UIElement from "./UIElement";
import { COLOR_PALETTE } from "./config/colors";
import { SCALE, COL_SIZE } from "./config/constants";

class SpriteIndex extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.selectedIndex = 0;
        this.pages = [1, 2];


    }

    onClick(mouseX, mouseY) {
        //check if mouse is over a button
        this.pages.forEach((page, index) => {
            if (mouseX >= this.x + index * (COL_SIZE + SCALE) && mouseX <= this.x + index * (COL_SIZE + SCALE) + COL_SIZE &&
                mouseY >= this.y + SCALE && mouseY <= this.y + SCALE + COL_SIZE) {
                this.selectedIndex = index;
            }
        });
        return this.selectedIndex;
    }

    draw(renderer) {
        this.pages.forEach((page, index) => {
            renderer.drawLinedRect(this.x + index * (COL_SIZE + SCALE), this.y + SCALE, COL_SIZE, COL_SIZE, this.selectedIndex === index ? COLOR_PALETTE[1] : COLOR_PALETTE[7]);
            renderer.drawText(page, 8 * (this.x / COL_SIZE + index) + (1.5 + index), 10 * 8 + 2, this.selectedIndex === index ? 1 : 7, { scale: 0.75 });
        });

    }
}

export default SpriteIndex;
