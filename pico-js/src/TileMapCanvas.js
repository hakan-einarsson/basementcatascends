import UIElement from "./UIElement";
import { CANVAS_WIDTH, COL_SIZE, SCALE, SPRITE_SIZE, SPRITE_TRUE_SIZE } from "./config/constants";
import { loadTileMap, saveTileMap, saveCollisionLayer, loadCollisionLayer, loadCollisionLayerMap } from "./tools/localStorageHandler";
import { floodFill2D } from "./tools/floodFill2D";
import SelectionTool from "./SelectionTool";
import { decodeFlags, encodeFlags, hasLayer } from "./tools/bitmapTools";
class TileMapCanvas extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.backgroundColor = [0.1, 0.1, 0.1]; // Black background
        this.tileMap = loadTileMap() || Array.from({ length: 64 }, () => Array(128).fill(null));
        this.drawing = false;
        this.saveTimeout = null; // For debouncing save operations
        this.saveCollisionTimeout = null;
        this.offsetX = 0; // For horizontal scrolling
        this.offsetY = 0; // For vertical scrolling
        this.scale = 1; // For zooming
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.activeTile = { x: 0, y: 0 }; // Active tile position
        this.collisionLayer = loadCollisionLayer() || Array.from({ length: 64 }, () => Array(128).fill(0)); // Collision layer
        this.collisionLayerMap = loadCollisionLayerMap() || {};
        this.selectedCollisionBitmap = 1;
        this.selectionExpanded = false; // Flag for expanded selection
        this.selector = new SelectionTool(
            () => this.tileMap.length,
            (x, y) => this.tileMap[y]?.[x] ?? null,
            (x, y, val) => { if (this.tileMap[y]) this.tileMap[y][x] = val; },
            (x, y) => this.collisionLayer[y]?.[x] ?? 0,
            (x, y, val) => { if (this.collisionLayer[y]) this.collisionLayer[y][x] = val; }
        );

    }

    init() {

    }

    draw(renderer, tool, showCollisionLayer = false, fullScreen = false) {
        if (fullScreen) {
            this.height = (128 - 16) * SCALE;
        } else {
            this.height = CANVAS_WIDTH / 2;
        }
        renderer.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor);
        for (let y = Math.floor(this.offsetY); y < Math.floor(this.offsetY) + this.height / COL_SIZE / this.scale; y++) {
            for (let x = Math.floor(this.offsetX); x < Math.floor(this.offsetX) + this.width / COL_SIZE / this.scale; x++) {
                try {
                    const tileId = this.tileMap[y][x];
                    if (tileId !== null) {
                        const tileSize = SPRITE_SIZE * this.scale;
                        const screenX = (x - Math.floor(this.offsetX)) * tileSize;
                        const screenY = (y - Math.floor(this.offsetY)) * tileSize + COL_SIZE / SCALE;
                        renderer.drawSprite(tileId, screenX, screenY, { scaleX: this.scale, scaleY: this.scale });
                    }
                    if (showCollisionLayer && this.collisionLayer[y] && hasLayer(this.collisionLayer[y][x], this.selectedCollisionBitmap)) {
                        // Draw collision layer
                        const tileSize = SPRITE_SIZE * this.scale;
                        const screenX = (x - Math.floor(this.offsetX)) * tileSize;
                        const screenY = (y - Math.floor(this.offsetY)) * tileSize + COL_SIZE / SCALE;
                        renderer.drawRect(
                            screenX * SCALE,
                            screenY * SCALE,
                            tileSize * SCALE,
                            tileSize * SCALE,
                            [1, 0, 0, 0.1] // Red color for collision tiles
                        );
                    }
                } catch (error) {
                    //draw a grey rectangle for empty tiles
                    const tileSize = SPRITE_SIZE * this.scale;
                    const screenX = (x - Math.floor(this.offsetX)) * tileSize;
                    const screenY = (y - Math.floor(this.offsetY)) * tileSize + COL_SIZE;
                    renderer.drawRect(screenX, screenY, tileSize, tileSize, [0.3, 0.3, 0.3]); // Grey rectangle for empty tiles
                }
            }
        }
        // Draw the tile cursor highlight
        if (tool !== "selector") {
            this.drawTileCursorHighlight(renderer);
        }
        this.selector.drawOverlay(renderer, this.x, this.y, SPRITE_TRUE_SIZE * this.scale, this.offsetX, this.offsetY);

        renderer.drawText(
            `X:${this.activeTile.x} Y:${this.activeTile.y}, Tile: ${this.tileMap[this.activeTile.y][this.activeTile.x]}`,
            2, 121.5, 1, { scale: 0.5 }
        )
    }

    reload() {
        this.tileMap = loadTileMap() || Array.from({ length: 64 }, () => Array(128).fill(null));
        this.collisionLayer = loadCollisionLayer() || Array.from({ length: 64 }, () => Array(128).fill(0));
    }

    onClick(mouseX, mouseY, tool, event, tileId = null) {
        //draw linedRect on mouse position regardless of tool
        // this.drawTileCursorHighlight(mouseX, mouseY);
        this.mouseX = mouseX;
        this.mouseY = mouseY;


        if (tool === "selector") {
            this.handleSelector(mouseX, mouseY, event);
            this.saveTileMapDebounced();
            this.saveCollisionLayerDebounced();
        }

        this.setActiveTile(mouseX, mouseY);

        if (event.type === "wheel") {
            event.preventDefault();

            const zoomFactor = 2;

            // Räkna ut var musen pekade i tile-koordinater före zoom
            const mouseTileX = (mouseX - this.x) / (SPRITE_TRUE_SIZE * this.scale) + this.offsetX;
            const mouseTileY = (mouseY - this.y) / (SPRITE_TRUE_SIZE * this.scale) + this.offsetY;

            if (event.deltaY < 0) {
                this.scale *= zoomFactor; // zooma in
            } else {
                this.scale /= zoomFactor; // zooma ut
            }

            // Clamp zoomnivå
            this.scale = Math.max(0.25, Math.min(this.scale, 2)); // Justera efter smak

            // Räkna ut var musen pekar nu
            const newMouseTileX = (mouseX - this.x) / (SPRITE_TRUE_SIZE * this.scale) + this.offsetX;
            const newMouseTileY = (mouseY - this.y) / (SPRITE_TRUE_SIZE * this.scale) + this.offsetY;

            // Flytta offset så att samma tile stannar under musen
            this.offsetX += mouseTileX - newMouseTileX;
            this.offsetY += mouseTileY - newMouseTileY;

            this.clampOffset(); // Ensure offsets are within bounds

            // Avrunda
            this.offsetX = Math.floor(this.offsetX);
            this.offsetY = Math.floor(this.offsetY);
        }


        if (event.type === "mousedown") {
            if (event.button === 1) { // Middle mouse button for panning
                this.isPanning = true;
                this.lastPanX = mouseX;
                this.lastPanY = mouseY;
                event.preventDefault(); // Prevent default scrolling behavior
                return;
            }
            this.drawing = true;
        } else if (event.type === "mouseup") {
            this.drawing = false;
            if (this.isPanning) {
                this.mouseX = mouseX; // Update mouse position for panning
                this.mouseY = mouseY;
            }
            this.isPanning = false; // Stop panning on mouse up
        }
        if (this.isPanning) {
            const deltaX = mouseX - this.lastPanX;
            const deltaY = mouseY - this.lastPanY;
            this.offsetX -= deltaX / (SPRITE_TRUE_SIZE * this.scale);
            this.offsetY -= deltaY / (SPRITE_TRUE_SIZE * this.scale);


            this.clampOffset(); // Ensure offsets are within bounds
            // Log the panning action

            this.lastPanX = mouseX;
            this.lastPanY = mouseY;
            return; // Exit early if panning
        }
        if (!this.drawing || tool === "selector") return;
        const localX = (mouseX - this.x) / (SPRITE_TRUE_SIZE * this.scale);
        const localY = (mouseY - this.y) / (SPRITE_TRUE_SIZE * this.scale);

        // Lägg till offset
        let tileX = Math.floor(localX + Math.floor(this.offsetX));
        let tileY = Math.floor(localY + Math.floor(this.offsetY));

        if (tool === "pen") {
            if (this.selectionExpanded) {
                const expandedSelection = this.getExpandedSelection(tileX, tileY);
                expandedSelection.forEach(([x, y], index) => {
                    if (this.tileMap[y] && this.tileMap[y][x] !== undefined) {
                        this.tileMap[y][x] = tileId[index] !== undefined ? tileId[index] : 255; // Use 255 for transparent pixels
                        this.addCollisionLayer(x, y, tileId[index]);
                    }
                });
            } else {
                this.tileMap[tileY][tileX] = tileId;
                this.addCollisionLayer(tileX, tileY, tileId);
            }
            this.saveTileMapDebounced();
        }
        if (tool === "eraser") {
            if (this.selectionExpanded) {
                const expandedSelection = this.getExpandedSelection(tileX, tileY);
                expandedSelection.forEach(([x, y]) => {
                    if (this.tileMap[y] && this.tileMap[y][x] !== undefined) {
                        this.tileMap[y][x] = 255; // Set to transparent
                        this.removeCollisionLayer(x, y, this.tileMap[y][x]);
                    }
                });
            } else {
                this.tileMap[tileY][tileX] = 255; // Set to transparent
                this.removeCollisionLayer(tileX, tileY, this.tileMap[tileY][tileX]);
            }
            this.saveTileMapDebounced();
        }
        if (tool === "bucket") {
            const oldTileId = this.tileMap[tileY][tileX];
            if (oldTileId === null || oldTileId === undefined) return; // Do not fill if the tile is empty
            floodFill2D({
                startX: tileX,
                startY: tileY,
                matchValue: oldTileId,
                getValue: (x, y) => this.tileMap[y] && this.tileMap[y][x] !== undefined ? this.tileMap[y][x] : null,
                setValue: (x, y) => {
                    if (this.tileMap[y] && this.tileMap[y][x] !== undefined) {
                        this.tileMap[y][x] = tileId;
                    }
                    if (tileId !== 255) {
                        this.addCollisionLayer(x, y, tileId);
                    } else {
                        this.removeCollisionLayer(x, y, this.tileMap[y][x]);
                    }
                },
                maxWidth: this.tileMap[0].length,
                maxHeight: this.tileMap.length,
            });
            this.saveTileMapDebounced();

        }
        if (tool === "add_collision") {
            this.collisionLayer[tileY][tileX] = encodeFlags([...decodeFlags(this.collisionLayer[tileY][tileX]), this.selectedCollisionBitmap]);
            this.saveCollisionLayerDebounced();
        }
        if (tool === "remove_collision") {
            this.collisionLayer[tileY][tileX] = 0;
            this.saveCollisionLayerDebounced();
        }
    }

    handleSelector(mouseX, mouseY, event) {
        let localX = (mouseX - this.x) / (SPRITE_TRUE_SIZE * this.scale);
        let localY = (mouseY - this.y) / (SPRITE_TRUE_SIZE * this.scale);

        let tileX = Math.floor(localX + Math.floor(this.offsetX));
        let tileY = Math.floor(localY + Math.floor(this.offsetY));

        if (event.type === "mousedown") {
            if (event.button === 0) {
                if (this.selector.isInsideSelection(tileX, tileY)) {
                    this.selector.startDrag(tileX, tileY);
                } else {
                    this.selector.startSelection(tileX, tileY);
                }
            } else if (event.button === 2) { // Högerklick för att avsluta markering
                console.log("Clearing selection");
                this.selector.clear();
            }
        }
        if (event.type === "mousemove") {
            if (this.selector.selectionStart && !this.selector.dragging) {
                this.selector.updateSelection(tileX, tileY);
            }
            if (this.selector.dragging) {
                this.selector.updateDragPosition(tileX, tileY);
            }
        }
        if (event.type === "mouseup" && event.button === 0) {
            if (this.selector.dragging) {
                this.selector.dropAt(tileX, tileY);
            } else {
                this.selector.finalizeSelection(tileX, tileY);
            }
        }
    }

    addCollisionLayer(x, y, tileId) {
        if (this.collisionLayerMap[tileId] !== undefined) {
            this.collisionLayer[y][x] = this.collisionLayerMap[tileId];
            this.saveCollisionLayerDebounced();
        }
    }

    removeCollisionLayer(x, y) {
        this.collisionLayer[y][x] = 0;
        this.saveCollisionLayerDebounced();
    }

    setSelectedCollisionBitmap(layer) {
        this.selectedCollisionBitmap = layer;
    }

    getScreenX(tileX) {
        return (tileX - Math.floor(this.offsetX)) * SPRITE_TRUE_SIZE * this.scale;
    }

    getScreenY(tileY) {
        return (tileY - Math.floor(this.offsetY)) * SPRITE_TRUE_SIZE * this.scale + COL_SIZE / SCALE;
    }

    getTileId(mouseX, mouseY) {
        const localX = (mouseX - this.x) / (SPRITE_TRUE_SIZE * this.scale);
        const localY = (mouseY - this.y) / (SPRITE_TRUE_SIZE * this.scale);
        const tileX = Math.floor(localX + Math.floor(this.offsetX));
        const tileY = Math.floor(localY + Math.floor(this.offsetY));
        return this.tileMap[tileY] && this.tileMap[tileY][tileX] ? this.tileMap[tileY][tileX] : null;
    }

    drawTileCursorHighlight(renderer) {
        let tileSize = SPRITE_TRUE_SIZE * this.scale;
        const localX = Math.floor((this.mouseX - this.x) / tileSize);
        const localY = Math.floor((this.mouseY - this.y) / tileSize);
        const screenX = localX * tileSize;
        const screenY = localY * tileSize + COL_SIZE;
        if (this.selectionExpanded) {
            tileSize = tileSize * 2;
        }
        renderer.drawLinedRect(screenX, screenY, tileSize, tileSize, [1, 1, 0]); // Yellow highlight
    }

    setActiveTile(mouseX, mouseY) {
        const tileSize = SPRITE_TRUE_SIZE * this.scale;
        const localX = Math.floor((mouseX - this.x) / tileSize);
        const localY = Math.floor((mouseY - this.y) / tileSize);
        this.activeTile = { x: localX + Math.floor(this.offsetX), y: localY + Math.floor(this.offsetY) };
    }

    clampOffset() {
        const visibleTilesX = this.width / (SPRITE_TRUE_SIZE * this.scale);
        const visibleTilesY = this.height / (SPRITE_TRUE_SIZE * this.scale);

        const maxOffsetX = Math.max(0, this.tileMap[0].length - visibleTilesX);
        const maxOffsetY = Math.max(0, this.tileMap.length - visibleTilesY);

        this.offsetX = Math.max(0, Math.min(this.offsetX, maxOffsetX));
        this.offsetY = Math.max(0, Math.min(this.offsetY, maxOffsetY));
    }

    expandSelection() {
        this.selectionExpanded = !this.selectionExpanded;
    }

    deleteSelectedTiles() {
        if (!this.selector.selection) return;
        const { x, y, width, height } = this.selector.selection;
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                if (this.tileMap[tileY] && this.tileMap[tileY][tileX] !== undefined) {
                    this.tileMap[tileY][tileX] = 255; // Clear the tile
                }
                if (this.collisionLayer[tileY] && this.collisionLayer[tileY][tileX] !== undefined) {
                    this.collisionLayer[tileY][tileX] = 0; // Clear the collision
                }

            }
        }
        this.selector.clear();
        this.saveTileMapDebounced();
    }

    getExpandedSelection(x, y) {
        return [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]; // Start with the current tile
    }

    saveTileMapDebounced() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            saveTileMap(this.tileMap);
        }, 1000);
    }

    saveCollisionLayerDebounced() {
        clearTimeout(this.saveCollisionTimeout);
        this.saveCollisionTimeout = setTimeout(() => {
            saveCollisionLayer(this.collisionLayer);
        }, 1000);
    }
}

export default TileMapCanvas;

//create a function that goes through a tilemap and sets all null values to 255
export const reformatTileMap = (tileMap) => {
    return tileMap.map(row => {
        return row.map(tile => {
            return tile === null ? 255 : tile;
        });
    });
};
