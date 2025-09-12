import UIElement from "./UIElement";
import ToolBar from "./ToolBar";
import { COL_SIZE, CANVAS_WIDTH, SCALE } from "./config/constants";

const BUTTONS = ['export', 'import'];
class BottomBar extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.backgroundColor = [0.9, 0.3, 0.3];
        this.toolBar = new ToolBar(CANVAS_WIDTH - (2 * COL_SIZE + SCALE), this.y, COL_SIZE * 2, this.height, BUTTONS, this.backgroundColor);
    }

    draw(renderer) {
        // renderer.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor);
        this.toolBar.draw(renderer);
    }

    handleClick(x, y, event) {
        if (this.toolBar.isHovered(x, y)) {
            return this.toolBar.onClick(x, y, event);
        }
    }
}
export default BottomBar;