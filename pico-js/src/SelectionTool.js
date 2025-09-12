class SelectionTool {
    constructor(getGridSize, getPixel, setPixel, getCollision = null, setCollision = null) {
        this.selection = null;
        this.initialSelection = null;
        this.selectionStart = null;
        this.selectedData = null;
        this.selectedCollisionData = null;
        this.dragging = false;
        this.dragOffset = null;
        this.getCollision = getCollision;
        this.setCollision = setCollision;

        this.getGridSize = getGridSize;
        this.getPixel = getPixel;
        this.setPixel = setPixel;
    }

    startSelection(x, y) {
        this.selectionStart = { x, y };
    }

    updateSelection(x, y) {
        if (!this.selectionStart) return;
        const x1 = Math.min(this.selectionStart.x, x);
        const y1 = Math.min(this.selectionStart.y, y);
        const x2 = Math.max(this.selectionStart.x, x);
        const y2 = Math.max(this.selectionStart.y, y);

        this.selection = {
            x: x1, y: y1,
            width: x2 - x1 + 1,
            height: y2 - y1 + 1
        };
    }

    finalizeSelection(x, y) {
        const x1 = Math.min(this.selectionStart.x, x);
        const y1 = Math.min(this.selectionStart.y, y);
        const x2 = Math.max(this.selectionStart.x, x);
        const y2 = Math.max(this.selectionStart.y, y);

        this.selection = {
            x: x1, y: y1,
            width: x2 - x1 + 1,
            height: y2 - y1 + 1
        };

        // Kopiera data från målområdet
        this.selectedData = [];
        this.selectedCollisionData = [];
        for (let dy = 0; dy < this.selection.height; dy++) {
            this.selectedData[dy] = [];
            if (this.getCollision) {
                this.selectedCollisionData[dy] = [];
            }
            for (let dx = 0; dx < this.selection.width; dx++) {
                this.selectedData[dy][dx] = this.getPixel(x1 + dx, y1 + dy);
                if (this.getCollision) {
                    this.selectedCollisionData[dy][dx] = this.getCollision(x1 + dx, y1 + dy);
                }
            }
        }

        this.selectionStart = null;
    }

    isInsideSelection(x, y) {
        if (!this.selection) return false;
        return (
            x >= this.selection.x &&
            x < this.selection.x + this.selection.width &&
            y >= this.selection.y &&
            y < this.selection.y + this.selection.height
        );
    }

    startDrag(x, y) {
        this.initialSelection = { ...this.selection };
        this.dragging = true;
        this.dragOffset = {
            x: x - this.selection.x,
            y: y - this.selection.y
        };
    }

    updateDragPosition(x, y) {
        if (!this.dragging) return;
        this.selection.x = x - this.dragOffset.x;
        this.selection.y = y - this.dragOffset.y;
    }

    dropAt(x, y) {
        const targetX = x - this.dragOffset.x;
        const targetY = y - this.dragOffset.y;
        //clear initial selection
        for (let dy = 0; dy < this.initialSelection.height; dy++) {
            for (let dx = 0; dx < this.initialSelection.width; dx++) {
                this.setPixel(this.initialSelection.x + dx, this.initialSelection.y + dy, 255); // Clear the initial selection area
                if (this.setCollision) {
                    this.setCollision(this.initialSelection.x + dx, this.initialSelection.y + dy, 0);
                }
            }
        }

        for (let dy = 0; dy < this.selection.height; dy++) {
            for (let dx = 0; dx < this.selection.width; dx++) {
                if (this.selectedData[dy][dx] === 255) continue; // Skip transparent pixels
                this.setPixel(targetX + dx, targetY + dy, this.selectedData[dy][dx]);
                if (this.setCollision) {
                    this.setCollision(targetX + dx, targetY + dy, this.selectedCollisionData[dy][dx]);
                }
            }
        }

        this.clear();
    }

    clear() {
        this.selection = null;
        this.selectedData = null;
        this.dragging = false;
        this.dragOffset = null;
    }

    drawOverlay(renderer, canvasX, canvasY, cellSize, offsetX = 0, offsetY = 0) {
        const s = this.selection;
        if (!s) return;

        const sx = canvasX + (s.x - offsetX) * cellSize;
        const sy = canvasY + (s.y - offsetY) * cellSize;
        const sw = s.width * cellSize;
        const sh = s.height * cellSize;

        renderer.drawLinedRect(sx, sy, sw, sh, [1, 1, 1]);
    }
}

export default SelectionTool;
