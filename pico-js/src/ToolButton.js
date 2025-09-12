import UIElement from "./UIElement";
import { COLOR_PALETTE } from "./config/colors";
import { SPRITE_TRUE_SIZE } from "./config/constants";

class ToolButton extends UIElement {
    constructor(x, y, width, height, type, selected) {
        super(x, y, width, height);
        this.type = type;
        this.typeCharMap = {
            "pen": 0,
            "bucket": 2,
            "selector": 4,
            "rectangle": 6,
            "circle": 8,
            "add_collision": 10,
            "remove_collision": 6,
            "eraser": 12,
            "export": ['topbar', 16],
            "import": ['topbar', 12]
        };
        this.selected = selected; // Flag to indicate if the button is selected
        this.selectedColor = [131 / 255, 118 / 255, 157 / 255]; // Color for selected state
    }

    draw(renderer) {
        let id = this.typeCharMap[this.type];
        if (Array.isArray(id)) {
            const type = id[0];
            id = id[1];
            if (type === 'topbar') {
                renderer.drawTopBarButtonSprite(id, this.x, this.y);
                return;
            }
        }
        if (this.selected) id++;
        renderer.drawToolBarButtonSprite(id, this.x, this.y);
    }

    onClick(event) {
        if (event.type === 'mouseup') {
            this.selected = true;
            return this.type;
        }
    }

}

export default ToolButton;