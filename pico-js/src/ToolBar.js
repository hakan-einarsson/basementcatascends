import UIElement from "./UIElement";
import ToolButton from "./ToolButton";
import { COL_SIZE, SCALE } from "./config/constants";

class ToolBar extends UIElement {
    constructor(x, y, width, height, tools = ["pen", "eraser", "bucket", "copy", "paste"], backgroundColor = [0.5, 0.5, 0.5]) {
        super(x, y, width, height);
        this.backgroundColor = backgroundColor;
        this.selectedTool = "pen";
        this.toolButtons = tools.map((tool, index) => {
            return new ToolButton((COL_SIZE + SCALE) * index + this.x, this.y/* + SCALE * 3*/, COL_SIZE, COL_SIZE, tool, this.selectedTool === tool);
        });
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor);
        //draw the non selected buttons first and the selected button last
        this.toolButtons.forEach(button => {
            if (!button.selected) {
                button.draw(renderer);
            }
        });
        this.toolButtons.forEach(button => {
            if (button.selected) {
                button.draw(renderer);
            }
        });

    }

    onClick(mouseX, mouseY, event) {
        if (event.type !== 'mouseup') return;
        for (const button of this.toolButtons) {
            if (button.isHovered(mouseX, mouseY)) {
                this.deselectAll();
                return button.onClick(event);
            }
        }
    }

    deselectAll() {
        this.toolButtons.forEach(button => button.selected = false);
    }

    setSelectedTool(tool) {
        this.deselectAll();
        const button = this.toolButtons.find(btn => btn.type === tool);
        if (button) button.selected = true;
        this.selectedTool = tool;
    }
}

export default ToolBar;
