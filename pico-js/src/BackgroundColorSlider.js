import { COLOR_PALETTE } from "./config/colors";
import { SCALE } from "./config/constants";
import UIElement from "./UIElement";

class BackgroundColorSlider extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.isDragging = false;
        this.sliderValue = 0;
        this.sliderColor = [this.sliderValue / 255, this.sliderValue / 255, this.sliderValue / 255];
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y + this.height / 2, this.width, SCALE, COLOR_PALETTE[5]);
        renderer.drawRect(this.x + (this.sliderValue / 255) * this.width, this.y + this.height / 2 - SCALE / 2, SCALE * 2, SCALE * 2, COLOR_PALETTE[5]);
    }

    handleClick(mouseX, mouseY, event) {
        // Update the background color based on mouse position
        if (event.button === 0 && event.type === "mousedown") {
            this.isDragging = true;
        }
        if (event.type === "mouseup") {
            this.isDragging = false;
        }
        if (this.isDragging) {
            //horizontal dragging, use mouseX, use SCALE 
            let relativeX = mouseX - this.x;
            if (relativeX < 0) relativeX = 0;
            this.sliderValue = Math.max(0, Math.min(255, Math.floor((relativeX / this.width) * 255)));
            this.sliderColor = [this.sliderValue / 255, this.sliderValue / 255, this.sliderValue / 255];
        }

        return this.sliderColor;

    }
}

export default BackgroundColorSlider;
