import UIElement from "./UIElement";
import SpriteEditorUI from "./SpriteEditorUI";
import CodeEditorUI from "./CodeEditorUI";
import GameViewUI from "./GameViewUI";
import TileMapEditorUI from "./TileMapEditorUI";
import SoundUI from "./SoundUI";
import TopBar from "./TopBar";
import BottomBar from "./BottomBar";
import { CANVAS_WIDTH, COL_SIZE } from "./config/constants";
import { downloadGameDataFiles } from "./ExportBuilder";
import { exportSpriteSheetToJSON, exportTileMapToJSON } from "./tools/exports";
import { importSpriteSheet, importTileMap } from "./tools/imports";

class EditorUI extends UIElement {
    constructor(x, y, width, height, renderer) {
        super(x, y, width, height);
        this.renderer = renderer;
        this.TopBar = new TopBar(0, 0, CANVAS_WIDTH, COL_SIZE);
        this.BottomBar = new BottomBar(0, COL_SIZE * 15, CANVAS_WIDTH, COL_SIZE);
        this.spriteEditorUI = new SpriteEditorUI(0, COL_SIZE, CANVAS_WIDTH, CANVAS_WIDTH - COL_SIZE * 2);
        this.codeEditorUI = new CodeEditorUI(0, COL_SIZE, CANVAS_WIDTH, CANVAS_WIDTH - COL_SIZE * 2);
        this.gameViewUI = new GameViewUI(0, COL_SIZE, CANVAS_WIDTH, CANVAS_WIDTH - COL_SIZE * 2);
        this.tileMapEditorUI = new TileMapEditorUI(0, COL_SIZE, CANVAS_WIDTH, CANVAS_WIDTH - COL_SIZE * 2);
        this.soundUI = new SoundUI(0, COL_SIZE, CANVAS_WIDTH, CANVAS_WIDTH - COL_SIZE * 2);
        this.codeEditorTextArea = document.getElementById("code-editor");
        this.views = {
            sprite: this.spriteEditorUI,
            // code: this.codeEditorUI,
            game: this.gameViewUI,
            map: this.tileMapEditorUI,
            // sound: this.soundUI,
        };
        this.previousActiveUI = null;
        this.activeUI = 'map'; // Default active UI
        this.setActiveUI(this.activeUI);
        this.fullScreen = false;
    }

    draw(renderer) {
        this.TopBar.draw(renderer, [this.activeUI, this.fullScreen ? 'fullscreen' : '']);
        this.views[this.activeUI].draw(renderer);
        this.BottomBar.draw(renderer);
    }

    handleClick(mouseX, mouseY, event) {
        if (this.TopBar.isHovered(mouseX, mouseY)) {
            const button = this.TopBar.handleClick(mouseX, mouseY, event);
            if (button) {
                if (button === 'fullscreen') {
                    this.spriteEditorUI.toggleFullscreen();
                    this.tileMapEditorUI.toggleFullscreen();
                    this.fullScreen = !this.fullScreen;
                    return;
                }
                if (button === 'export') {
                    downloadGameDataFiles();
                }
                this.setActiveUI(button);
            }
        }
        if (this.BottomBar.isHovered(mouseX, mouseY)) {
            if (event.type === 'mouseup' && event.button === 0) {
                let action = this.BottomBar.handleClick(mouseX, mouseY, event);
                if (action === 'export') {
                    this.handleExport();
                }
                if (action === 'import') {
                    this.handleImport();
                }

            }
        }
        if (this.getActiveUI().isHovered(mouseX, mouseY)) {
            this.getActiveUI().handleClick(mouseX, mouseY, event);
        }
    }

    handleExport() {
        if (this.activeUI === 'sprite') {
            exportSpriteSheetToJSON();
        }
        if (this.activeUI === 'map') {
            exportTileMapToJSON();
        }
    }

    async handleImport() {
        if (this.activeUI === 'sprite') {
            await importSpriteSheet();
            this.spriteEditorUI.spriteSheet.reloadSpriteData();
            this.tileMapEditorUI.spriteSheet.reloadSpriteData();
        }
        if (this.activeUI === 'map') {
            await importTileMap();
            this.tileMapEditorUI.reloadCanvasData();
        }
    }

    handleKeyDown(event) {
        this.getActiveUI().handleKeyDown(event);
    }

    handleKeyUp(event) {
        this.getActiveUI().handleKeyUp(event);
    }

    handleClickGlobal(event) {
        this.getActiveUI().handleClickGlobal(event);
    }

    getActiveUI() {
        return this.views[this.activeUI];
    }

    setActiveUI(uiName) {
        if (this.views[uiName]) {
            this.getActiveUI().onTearDown();
            this.activeUI = uiName;
            if (uiName === 'code') {
                this.codeEditorTextArea.style.display = 'block';
                this.codeEditorTextArea.focus();
            } else {
                this.codeEditorTextArea.style.display = 'none';
            }
            this.getActiveUI().init(this.renderer);
        } else {
            console.warn(`UI ${uiName} does not exist.`);
        }
    }
}

export default EditorUI;
