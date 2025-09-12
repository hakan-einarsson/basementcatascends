import ColorPalette from "./ColorPalette";
import SpriteCanvas from "./SpriteCanvas";
import SpriteSheet from "./SpriteSheet";
import ToolBar from "./ToolBar";
import SpriteIndex from "./SpriteIndex";
import UIElement from "./UIElement";
import CollisionLayers from "./CollisionLayers";
import BackgroundColorSlider from "./BackgroundColorSlider";
import { loadSpriteSheet } from "./tools/localStorageHandler";
import { CANVAS_WIDTH, COL_SIZE, SCALE, NUMBER_OF_COLS, SPRITE_SIZE } from "./config/constants";

class SpriteEditorUI extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.backgroundColor = [0.5, 0.5, 0.5];
        this.spriteSheet = new SpriteSheet(0, COL_SIZE * 11, CANVAS_WIDTH, COL_SIZE * 4, loadSpriteSheet());
        this.spriteCanvas = new SpriteCanvas(COL_SIZE, COL_SIZE, CANVAS_WIDTH / 2, CANVAS_WIDTH / 2, this.spriteSheet);
        this.spriteCanvas.loadSprite(this.spriteSheet.spriteData[0]);
        this.palette = new ColorPalette(COL_SIZE * 10, COL_SIZE + SCALE, COL_SIZE * 4 + SCALE * 4, COL_SIZE * 4 + SCALE * 4);
        this.tool = "pen";
        this.editingTools = ["pen", "bucket", "selector"];
        this.toolBar = new ToolBar(COL_SIZE, COL_SIZE * 9 + SCALE * 3, CANVAS_WIDTH / 2, COL_SIZE * 2 - SCALE * 3, this.editingTools);
        this.backgroundColorSlider = new BackgroundColorSlider(COL_SIZE * 10, COL_SIZE * 7, COL_SIZE * 4, COL_SIZE);
        this.collisionsLayers = new CollisionLayers(COL_SIZE * 10, COL_SIZE * 8, COL_SIZE * 4, COL_SIZE * 2);
        this.fullScreen = false; // Flag for fullscreen mode
        this.spriteIndex = new SpriteIndex(COL_SIZE * 11, COL_SIZE * 10, COL_SIZE * 3, COL_SIZE);
        // this.spriteSheetIndex = 0;
    }

    init(renderer) {
        this.renderer = renderer;
    }

    onTearDown() {
        if (this.renderer) {
            this.renderer.loadSpriteDataToTexture(this.spriteSheet.spriteData);
        }
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor);
        this.spriteCanvas.draw(renderer);
        this.palette.draw(renderer);
        this.backgroundColorSlider.draw(renderer);
        this.collisionsLayers.draw(renderer);
        this.toolBar.draw(renderer);
        this.spriteIndex.draw(renderer);
        this.spriteSheet.draw(renderer);
        renderer.drawText(
            `Tile: ${this.spriteSheet.selectedSprite}`,
            2, 121.5, 1, { scale: 0.5 }
        )
    }

    handleClick(mouseX, mouseY, event) {
        if (this.spriteCanvas.isHovered(mouseX, mouseY)) {
            this.spriteCanvas.onClick(mouseX, mouseY, this.palette.getSelectedColor(), this.tool, event);
        } else if (this.palette.isHovered(mouseX, mouseY)) {
            this.palette.onClick(mouseX, mouseY, event);
        } else if (this.spriteSheet.isHovered(mouseX, mouseY)) {
            if (event.button === 0) { // Left click
                const selectedSprite = this.spriteSheet.onClick(mouseX, mouseY, event);
                if (selectedSprite !== null && selectedSprite !== undefined) {
                    this.collisionsLayers.setTileIndex(selectedSprite);
                    this.spriteCanvas.loadSprite(this.getSpriteData(selectedSprite));
                }
            }
        } else if (this.toolBar.isHovered(mouseX, mouseY)) {
            const newTool = this.toolBar.onClick(mouseX, mouseY, event);
            if (newTool && this.editingTools.includes(newTool)) {
                this.tool = newTool;
            } else {
                if (newTool === "copy") {
                    this.spriteSheet.copySprite();
                }
                if (newTool === "paste") {
                    this.spriteSheet.pasteSprite(this.spriteCanvas);
                }
            }
        } else if (this.spriteIndex.isHovered(mouseX, mouseY)) {
            if (event.type == 'mouseup' && event.button == 0) {
                let spriteSheetIndex = this.spriteIndex.onClick(mouseX, mouseY);
                this.spriteSheet.setSpriteSheetIndex(spriteSheetIndex);
                this.spriteSheet.selectedSprite = spriteSheetIndex * SPRITE_SIZE * SPRITE_SIZE;
                this.collisionsLayers.setTileIndex(this.spriteSheet.selectedSprite);
                this.spriteCanvas.loadSprite(this.getSpriteData(this.spriteSheet.selectedSprite));
            }
        } else if (this.backgroundColorSlider.isHovered(mouseX, mouseY)) {
            let backgroundColor = this.backgroundColorSlider.handleClick(mouseX, mouseY, event);
            this.spriteCanvas.setBackgroundColor(backgroundColor);
        } else if (this.collisionsLayers.isHovered(mouseX, mouseY)) {
            if (event.type === 'mouseup' && event.button === 0) {
                this.collisionsLayers.handleClick(mouseX, mouseY);
            }
        }
        this.setDrawingToFalse(event); // Ensure drawing is stopped after any click

    }

    handleKeyUp(event) {
        //if delete key is pressed, delete the current sprite
        if (event.key === "Delete" || event.key === "Backspace") {
            this.deleteCurrentSprite();
        }
        if (event.key === "h" || event.key === "H") {
            this.flipHorizontal();
        }
        if (event.key === "r" || event.key === "R") {
            this.rotateSprite();
        }
        if (event.key === "c" || event.key === "C") {
            this.spriteSheet.copySprite();
        }
        if (event.key === "v" || event.key === "V") {
            this.spriteSheet.pasteSprite(this.spriteCanvas);
        }
        if (event.key === "b" || event.key === "B") {
            this.tool = "pen"; // Set tool to pen
            this.toolBar.setSelectedTool("pen");
        }
        if (event.key === "g" || event.key === "G") { // similar to aseprite
            this.tool = "bucket"; // Set tool to bucket
            this.toolBar.setSelectedTool("bucket");
        }
        if (event.key === "m" || event.key === "M") {
            this.tool = "selector"; // Set tool to selector
            this.toolBar.setSelectedTool("selector");
        }
        if (event.key === "e" || event.key === "E") {
            this.spriteSheet.expandSelection();
            // this.spriteCanvas.loadSprite(this.getSpriteData(this.spriteSheet.selectedSprite));
            this.spriteCanvas.expandCanvas(this.getSpriteData(this.spriteSheet.selectedSprite));
        }
    }

    toggleFullscreen() {
        this.fullScreen = !this.fullScreen;
    }

    setDrawingToFalse(event) {
        if (event.type === 'mouseup') {
            this.spriteCanvas.drawing = false;
        }
    }

    setColorDraggingToFalse(event) {
        if (event.type === 'mouseup') {
            this.backgroundColorSlider.isDragging = false;
        }
    }

    handleClickGlobal(event) {
        this.setDrawingToFalse(event);
        this.setColorDraggingToFalse(event);
    }

    deleteCurrentSprite() {
        const selectedSprite = this.spriteSheet.deleteCurrentSprite();
        this.spriteCanvas.loadSprite(this.getSpriteData(selectedSprite));
    }
    flipHorizontal() {
        const currentSprite = this.spriteSheet.flipHorizontal();
        this.spriteCanvas.loadSprite(this.getSpriteData(currentSprite));
    }
    rotateSprite() {
        const currentSprite = this.spriteSheet.rotateSprite();
        this.spriteCanvas.loadSprite(this.getSpriteData(currentSprite));
    }
    getSpriteData(spriteIndex) {

        if (this.spriteSheet.selectionExpanded) {
            //check if sprite index is an array, if so set tl = spriteIndex[0], tr = spriteIndex[1], bl = spriteIndex[2] and br = spriteIndex[3]
            let tl, tr, bl, br;
            if (Array.isArray(spriteIndex)) {
                tl = this.spriteSheet.spriteData[spriteIndex[0]]; // Top-left sprite
                tr = this.spriteSheet.spriteData[spriteIndex[1]]; // Top-right sprite
                bl = this.spriteSheet.spriteData[spriteIndex[2]]; // Bottom-left sprite
                br = this.spriteSheet.spriteData[spriteIndex[3]]; // Bottom-right sprite
            } else {
                tl = this.spriteSheet.spriteData[spriteIndex]; // Top-left sprite
                tr = this.spriteSheet.spriteData[spriteIndex + 1]; // Top-right sprite
                bl = this.spriteSheet.spriteData[spriteIndex + NUMBER_OF_COLS];
                br = this.spriteSheet.spriteData[spriteIndex + NUMBER_OF_COLS + 1]; // Bottom-right sprite
            }
            const spriteData = [];
            for (let y = 0; y < 16; y++) {
                spriteData[y] = [];
                for (let x = 0; x < 16; x++) {
                    if (x < 8 && y < 8) {
                        spriteData[y][x] = tl[y][x]; // Top-left
                    } else if (x >= 8 && y < 8) {
                        spriteData[y][x] = tr[y][x - 8]; // Top-right
                    } else if (x < 8 && y >= 8) {
                        spriteData[y][x] = bl[y - 8][x]; // Bottom-left
                    } else {
                        spriteData[y][x] = br[y - 8][x - 8]; // Bottom-right
                    }
                }
            }
            return spriteData;
        }
        const spriteData = this.spriteSheet.spriteData[spriteIndex];
        return spriteData;
    }

}

export default SpriteEditorUI;
