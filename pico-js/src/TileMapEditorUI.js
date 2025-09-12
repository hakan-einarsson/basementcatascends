import UIElement from "./UIElement";
import TileMapCanvas from "./TileMapCanvas";
import SpriteSheet from "./SpriteSheet";
import SpriteIndex from "./SpriteIndex";
import LayerPicker from "./LayerPicker";
import ValueStepperUI from "./ValueStepperUI";
import ToolBar from "./ToolBar";
import { loadSpriteSheet } from "./tools/localStorageHandler";
import { CANVAS_WIDTH, COL_SIZE, SPRITE_SIZE, SCALE } from "./config/constants";

class TileMapEditorUI extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.backgroundColor = [0.5, 0.5, 0.5];
        this.tileMapCanvas = new TileMapCanvas(0, COL_SIZE, CANVAS_WIDTH, CANVAS_WIDTH / 2);
        this.toolBar = new ToolBar(COL_SIZE, COL_SIZE * 9 + SCALE * 3, CANVAS_WIDTH / 2 - COL_SIZE, COL_SIZE * 2 - SCALE * 3, ["pen", "eraser", "bucket", "selector", "add_collision", "remove_collision"]);
        this.spriteSheet = new SpriteSheet(0, COL_SIZE * 11, CANVAS_WIDTH, COL_SIZE * 4, loadSpriteSheet());
        this.spriteIndex = new SpriteIndex(COL_SIZE * 13, COL_SIZE * 10, COL_SIZE * 3, COL_SIZE);
        // this.layerPicker = new LayerPicker(COL_SIZE * 8, COL_SIZE * 9.5, COL_SIZE * 3, COL_SIZE);
        this.layerPicker = new ValueStepperUI(COL_SIZE * 8, COL_SIZE * 9.5, COL_SIZE * 2.5, COL_SIZE, {
            value: 0,
            min: 0,
            max: 6,
            step: 1,
            textWidth: COL_SIZE,
            formatter: (v) => `0${v + 1}`,
            onChange: (newValue) => {
                this.tileMapCanvas.setSelectedCollisionBitmap(newValue + 1);
            }
        });
        this.tool = "pen";
        this.selectedSprite = 4;
        this.editingTools = ["pen", "eraser", "bucket", "selector", "add_collision", "remove_collision"];
        this.expanded = false; // Flag for expanded state
        this.showCollisionLayer = false; // Flag for showing collision layer
        this.fullScreen = false; // Flag for fullscreen mode
    }

    init(renderer) {
        this.renderer = renderer;
        this.spriteSheet.init(renderer);
        if (this.spriteSheet.spriteData) {
            this.renderer.loadSpriteDataToTexture(this.spriteSheet.spriteData);
        }
        this.tileMapCanvas.init(renderer);
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor); // Grå 
        this.tileMapCanvas.draw(renderer, this.tool, this.showCollisionLayer, this.fullScreen); // Ritar tile map canvas
        if (this.fullScreen) {
            return;
        }
        this.spriteIndex.draw(renderer);
        this.spriteSheet.draw(renderer); // Ritar sprite sheet
        this.toolBar.draw(renderer); // Ritar verktygsfält
        this.layerPicker.draw(renderer); // Ritar lagerväljar
    }

    handleClick(mouseX, mouseY, event) {
        if (this.tileMapCanvas.isHovered(mouseX, mouseY)) {
            if (event.button === 2 && this.tool !== "selector") {
                this.selectedSprite = this.tileMapCanvas.getTileId(mouseX, mouseY);
                return; // Högerklick för att välja sprite
            }

            this.tileMapCanvas.onClick(mouseX, mouseY, this.tool, event, this.selectedSprite);

        } else if (this.spriteSheet.isHovered(mouseX, mouseY)) {
            let newTileId = this.spriteSheet.onClick(mouseX, mouseY, event);
            if (newTileId !== null && newTileId !== undefined) {
                this.selectedSprite = newTileId; // Uppdatera vald sprite
            }
        } else if (this.toolBar.isHovered(mouseX, mouseY)) {
            const newTool = this.toolBar.onClick(mouseX, mouseY, event);
            if (newTool && this.editingTools.includes(newTool)) {
                this.tool = newTool;
                if (newTool === "add_collision" || newTool === "remove_collision") {
                    this.showCollisionLayer = true; // Visa kollisionslager när verktyget är aktivt
                } else {
                    this.showCollisionLayer = false; // Dölj kollisionslager för andra verktyg
                }
            }
        } else if (this.spriteIndex.isHovered(mouseX, mouseY)) {
            if (event.type == 'mouseup' && event.button == 0) {
                let spriteSheetIndex = this.spriteIndex.onClick(mouseX, mouseY);
                this.spriteSheet.setSpriteSheetIndex(spriteSheetIndex);
                this.spriteSheet.selectedSprite = spriteSheetIndex * SPRITE_SIZE * SPRITE_SIZE;
            }
        }
        else if (this.layerPicker.isHovered(mouseX, mouseY)) {
            if (event.type == 'mouseup' && event.button == 0) {
                this.layerPicker.handleClick(mouseX, mouseY);
                // this.tileMapCanvas.setSelectedCollisionBitmap(layer);
            }
        }
        this.setDrawingToFalse(event); // Stoppa ritning eller panorering vid musuppsläpp
    }

    reloadCanvasData() {
        this.tileMapCanvas.reload();
    }

    toggleFullscreen() {
        this.fullScreen = !this.fullScreen;
    }

    setDrawingToFalse(event) {
        if (event.type !== 'mouseup') return; // Hantera endast musuppsläpp
        if (event.button === 0) this.tileMapCanvas.drawing = false; // Stoppa ritning
        if (event.button === 1) this.tileMapCanvas.isPanning = false; // Stoppa panorering
    }
    handleClickGlobal(event) {
        this.setDrawingToFalse(event);
    }
    handleKeyUp(event) {
        if (event.key === 'e' || event.key === 'E') {
            this.spriteSheet.expandSelection();
            this.tileMapCanvas.expandSelection();
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
            this.tileMapCanvas.deleteSelectedTiles();
        }
    }
}

export default TileMapEditorUI;