import UIElement from "./UIElement";
import { CANVAS_WIDTH, COL_SIZE, SPRITE_TRUE_SIZE } from "./config/constants";

class TopBar extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.backgroundColor = [0.9, 0.3, 0.3];
        this.buttonsIdMap = {
            // "code": 0,
            "sprite": 2,
            "map": 4,
            // "sound": 6,
            // "music": 8,
            "game": 10,
            "fullscreen": 12,
        };
        this.buttonOffset = CANVAS_WIDTH - COL_SIZE * 2; // Offset for button positioning
    }

    draw(renderer, activeButtons = []) {
        renderer.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor);
        renderer.drawTopBarButtonSprite(activeButtons.includes("game") ? 11 : 10, this.x, this.y);
        renderer.drawTopBarButtonSprite(activeButtons.includes("fullscreen") ? 12 : 14, this.x + SPRITE_TRUE_SIZE, this.y);
        renderer.drawTopBarButtonSprite(16, this.x + 2 * SPRITE_TRUE_SIZE, this.y);

        for (let i = 0; i < Object.keys(this.buttonsIdMap).length; i++) {
            const buttonX = this.x + this.buttonOffset + i * COL_SIZE;
            const id = activeButtons.includes(Object.keys(this.buttonsIdMap)[i]) ? this.buttonsIdMap[Object.keys(this.buttonsIdMap)[i]] + 1 : this.buttonsIdMap[Object.keys(this.buttonsIdMap)[i]];
            renderer.drawTopBarButtonSprite(id, buttonX, this.y);
        }
    }

    handleClick(mouseX, mouseY, event) {
        if (event.type === "mousedown" && mouseX >= this.x && mouseX <= COL_SIZE) {
            return 'game';
        }
        if (event.type === "mousedown" && mouseX >= this.x + COL_SIZE && mouseX <= COL_SIZE * 2) {
            return 'fullscreen';
        }
        if (event.type === "mousedown" && mouseX >= this.x + COL_SIZE * 2 && mouseX <= COL_SIZE * 3) {
            console.log("Exporting game...");
            return 'export';
        }
        if (event.type === "mousedown" && mouseX >= this.x + this.buttonOffset) {
            const buttonIndex = Math.floor((mouseX - (this.x + this.buttonOffset + 1)) / COL_SIZE);
            if (buttonIndex >= 0 && buttonIndex < Object.keys(this.buttonsIdMap).length) {
                return Object.keys(this.buttonsIdMap)[buttonIndex];
            }
        }
        return null; // No button clicked
    }


}

export default TopBar;