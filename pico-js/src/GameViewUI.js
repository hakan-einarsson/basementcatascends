import UIElement from "./UIElement";
import EditorGameParser from "./EditorGameParser";
import { loadSpriteSheet, loadTileMap } from "./tools/localStorageHandler";
import Renderer from "./Renderer";
import { CANVAS_WIDTH, NUMBER_OF_COLS, SPRITE_SIZE, SCALE } from "./config/constants";
import RunTime from "./RunTime";
import { COLOR_PALETTE } from "./config/colors";
import { CHAR_BITMAPS } from "./config/fullCharBitmaps";
class GameViewUI extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.parser = null;
        this.renderer = null;
        this.runTime = null;
    }


    async init() {
        this.runTime = new RunTime(
            CANVAS_WIDTH,
            CANVAS_WIDTH,
            "game-view-canvas",
            "app",
            loadSpriteSheet(),
            loadTileMap(),
            this.getUserCode(),
            {
                left: "0px",
                top: "8px",
                zIndex: "10"
            }
        );
        // const response = await fetch("assets/exampleCode.js")
        const response = await fetch("assets/BasementCatAscends/game.js");
        const userCode = await response.text();
        this.canvas = this.runTime.createCanvas();
        this.renderer = new Renderer(this.canvas, COLOR_PALETTE, CHAR_BITMAPS, SPRITE_SIZE, NUMBER_OF_COLS, SCALE, loadTileMap());
        this.parser = new EditorGameParser(userCode, this.renderer);
        this.runTime.setRenderer(this.renderer);
        this.runTime.setParser(this.parser);
        this.runTime.init();
        window.dispatchEvent(new Event('resize'));
    }

    renderLoop() {
        this.parser.drawGame();
        this.renderer.render();
        this.animationFrame = requestAnimationFrame(this.renderLoop.bind(this));
    }

    onTearDown() {
        console.log('Tear Down')
        clearInterval(this.updateInterval);
        cancelAnimationFrame(this.animationFrame);
        this.runTime.tearDown();
        this.parser = null;
        this.renderer = null;
        this.runtime = null;
        this.canvas.remove();
    }

    draw(renderer) {

    }

    getUserCode() {
        return document.getElementById("code-editor").value;
    }
}

export default GameViewUI;