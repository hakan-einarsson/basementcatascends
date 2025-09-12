class UIElement {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    init(renderer) {
        // Placeholder for initialization logic
    }

    onTearDown() {
        // Placeholder for teardown logic
    }

    isHovered(mouseX, mouseY) {
        return (
            mouseX >= this.x &&
            mouseX < this.x + this.width &&
            mouseY >= this.y &&
            mouseY < this.y + this.height
        );
    }

    handleClick(mouseX, mouseY, event) {
        // Placeholder for click handling logic
    }

    handleKeyDown(event) {
        // Placeholder for key down handling logic
    }

    handleKeyUp(event) {
        // Placeholder for key up handling logic
    }

    handleClickGlobal(event) {
        // Placeholder for global click handling logic
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y, this.width, this.height, [0.5, 0.5, 0.5]);
    }
}

export default UIElement;