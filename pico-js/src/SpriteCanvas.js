import { SPRITE_SIZE } from './config/constants.js';
import UIElement from './UIElement.js';
import { COLOR_PALETTE } from './config/colors.js';
import SelectionTool from './SelectionTool.js';
import { floodFill2D } from './tools/floodFill2D.js';
class SpriteCanvas extends UIElement {
    constructor(x, y, width, height, spriteSheet) {
        super(x, y, width, height);
        this.gridSize = SPRITE_SIZE; // 8x8 rutor
        this.selectedColor = 0; // Standardfärg
        this.pixels = Array(SPRITE_SIZE).fill().map(() => Array(SPRITE_SIZE).fill(null));
        this.spriteSheet = spriteSheet;
        this.activeTool = 'pen'; // Standardverktyg
        this.expandedCanvas = false; // Flagga för att hålla koll på om canvasen har expanderats, när expanderad är den 2x2 sprites istället för 1x1
        this.activeColor = 0; // Standardfärg
        this.backgroundColor = [0, 0, 0]; // Standard bakgrundsfärg
        this.selector = new SelectionTool(
            () => this.gridSize,
            (x, y) => this.pixels?.[y]?.[x] ?? null,
            (x, y, val) => { if (this.pixels?.[y]) this.pixels[y][x] = val; }
        );

    }

    loadSprite(spritePixels) {
        this.pixels = JSON.parse(JSON.stringify(spritePixels));
    }

    onClick(mouseX, mouseY, color, tool, event) {
        if (tool === 'selector') {
            let gridX = Math.floor((mouseX - this.x) / (this.width / this.gridSize));
            let gridY = Math.floor((mouseY - this.y) / (this.height / this.gridSize));
            if (event.type === "mousedown") {
                if (gridX < 0 || gridY < 0 || gridX >= this.gridSize || gridY >= this.gridSize) return; // Utanför gränserna
                if (event.button === 0) {
                    if (this.selector.isInsideSelection(gridX, gridY)) {
                        this.selector.startDrag(gridX, gridY);
                    } else {
                        this.selector.startSelection(gridX, gridY);
                    }
                } else if (event.button === 2) { // Högerklick för att avsluta markering
                    this.selector.clear();
                }
            }
            if (event.type === "mousemove") {
                if (this.selector.selectionStart && !this.selector.dragging) {
                    this.selector.updateSelection(gridX, gridY);
                }
                if (this.selector.dragging) {
                    this.selector.updateDragPosition(gridX, gridY);
                }
            }
            if (event.type === "mouseup" && event.button === 0) {
                if (this.selector.dragging) {
                    this.selector.dropAt(gridX, gridY);
                    this.spriteSheet.updateSpriteData(this.pixels);
                } else {
                    this.selector.finalizeSelection(gridX, gridY);
                }
            }
            return;
        }
        if (event.type === 'mousedown') {
            this.drawing = true;
            this.activeColor = event.button === 2 ? 255 : color; // Använd högerklick för suddgummi
            // this.activeTool = event.button === 2 ? 'eraser' : tool;
            this.activeTool = tool; // Använd det valda verktyget
        } else if (event.type === 'mouseup') {
            this.drawing = false;
        }

        switch (this.activeTool) {
            case 'pen':
                if (this.drawing) {
                    this.drawPixel(mouseX, mouseY, this.activeColor);
                }
                break;
            case 'eraser':
                if (this.drawing)
                    this.removePixel(mouseX, mouseY);
                break;
            case 'bucket':
                if (this.drawing)
                    this.fillBucket(mouseX, mouseY, this.activeColor);
                break;
            default:
                console.log('Unknown tool: ' + tool);
        }
    }

    draw(renderer) {
        // Rita rutor för sprite editorn
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                let color = COLOR_PALETTE[this.pixels[y][x]] || this.backgroundColor; // Standard svart
                let cellSize = this.width / this.gridSize;
                renderer.drawRect(this.x + x * cellSize, this.y + y * cellSize, cellSize, cellSize, color);
            }
        }

        this.selector.drawOverlay(renderer, this.x, this.y, this.width / this.gridSize);
    }

    drawPixel(x, y, color) {
        let gridX = Math.floor((x - this.x) / (this.width / this.gridSize));
        let gridY = Math.floor((y - this.y) / (this.height / this.gridSize));
        this.pixels[gridY][gridX] = color;
        this.spriteSheet.updateSpriteData(this.pixels);
    }

    removePixel(x, y) {
        let gridX = Math.floor((x - this.x) / (this.width / this.gridSize));
        let gridY = Math.floor((y - this.y) / (this.height / this.gridSize));
        this.pixels[gridY][gridX] = 255;
        this.spriteSheet.updateSpriteData(this.pixels);
    }

    fillBucket(x, y, newColor) {
        const gridX = Math.floor((x - this.x) / (this.width / this.gridSize));
        const gridY = Math.floor((y - this.y) / (this.height / this.gridSize));

        const oldColor = this.pixels[gridY][gridX];
        if (oldColor === newColor || oldColor == null) return;

        floodFill2D({
            startX: gridX,
            startY: gridY,
            matchValue: oldColor,
            maxWidth: this.gridSize,
            maxHeight: this.gridSize,
            getValue: (x, y) => this.pixels[y][x],
            setValue: (x, y) => { this.pixels[y][x] = newColor; }
        });

        this.spriteSheet.updateSpriteData(this.pixels);
    }

    expandCanvas(spriteData) {
        this.expandedCanvas = !this.expandedCanvas;
        if (this.expandedCanvas) {
            this.gridSize = SPRITE_SIZE * 2; // Expand to 2x2 sprites
        } else {
            this.gridSize = SPRITE_SIZE; // Reset to 1x1 sprites
        }
        this.loadSprite(spriteData);
    }

    setBackgroundColor(color) {
        this.backgroundColor = color;
    }

}

export default SpriteCanvas;
