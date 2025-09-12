
class RunTime {
    constructor(canvasWidth, canvasHeight, id, parentId, spriteSheet, tileMap, styles = {}) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.id = id;
        this.parentId = parentId;
        this.spriteSheet = spriteSheet;
        this.tileMap = tileMap;
        this.styles = styles;
        this.canvas = null;
        this.parser = null;
        this.renderer = null;
    }

    setRenderer(renderer) {
        this.renderer = renderer;
    }

    setParser(parser) {
        this.parser = parser;
    }

    createCanvas() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = this.id;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.canvas.style.imageRendering = "pixelated";
        this.canvas.style.imageRendering = "crisp-edges";
        this.canvas.style.position = "absolute";
        if (this.styles.left) {
            this.canvas.style.left = this.styles.left;
        }
        if (this.styles.top) {
            this.canvas.style.top = this.styles.top;
        }
        if (this.styles.zIndex) {
            this.canvas.style.zIndex = this.styles.zIndex;
        }

        return this.canvas;
    }

    init() {
        document.getElementById(this.parentId || document.body).appendChild(this.canvas);
        this.renderer.loadSpriteDataToTexture(this.spriteSheet);
        this.renderer.loadTilemapDataToTexture(this.tileMap);
        this.parser.runInit();

        this.updateInterval = setInterval(() => {
            this.parser.updateGame();
        }, 1000 / 60);

        this.animationFrame = requestAnimationFrame(this.renderLoop.bind(this));
    }

    tearDown() {
        clearInterval(this.updateInterval);
        cancelAnimationFrame(this.animationFrame);
        this.renderer = null;
        this.parser = null;
    }

    renderLoop() {
        this.parser.drawGame();
        this.renderer.render();
        this.animationFrame = requestAnimationFrame(this.renderLoop.bind(this));
    }
}

export default RunTime;
