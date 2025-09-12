import { CHAR_BITMAPS } from "./config/fullCharBitmaps";
import { COLOR_PALETTE } from "./config/colors";
import { SPRITE_SIZE, NUMBER_OF_COLS, SCALE } from "./config/constants";
import { loadTileMap } from "./tools/localStorageHandler";
import Renderer from "./Renderer";

class EditorRenderer extends Renderer {
    constructor(canvas) {
        super(canvas, COLOR_PALETTE, CHAR_BITMAPS, SPRITE_SIZE, NUMBER_OF_COLS, SCALE, loadTileMap());
        this.textureMap.topbar = this.prepTexture({ width: 18 * SPRITE_SIZE, height: SPRITE_SIZE }); // TopBarButtons.png är 16x8
        this.textureMap.toolbar = this.prepTexture({ width: 16 * SPRITE_SIZE, height: SPRITE_SIZE }); // EditorButtons.png är 16x8
        this.loadTopBarButtons();
        this.loadToolBarButtons();
    }

    loadTopBarButtons() {
        const gl = this.gl;
        const img = new Image();
        img.src = "src/assets/TopBarButtons.png";
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.textureMap.topbar);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }

    loadToolBarButtons() {
        const gl = this.gl;
        const img = new Image();
        img.src = "src/assets/EditorButtons-export.png";
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.textureMap.toolbar);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }


    drawTopBarButtonSprite(id, x, y) {
        const textureWidth = SPRITE_SIZE * 18;
        const textureHeight = SPRITE_SIZE;
        const spriteWidth = SPRITE_SIZE;
        const spriteHeight = SPRITE_SIZE;

        const spriteX = (id % (textureWidth / spriteWidth)) * spriteWidth / textureWidth;
        const spriteY = Math.floor(id / (textureWidth / spriteWidth)) * spriteHeight / textureHeight;
        const texSizeX = spriteWidth / textureWidth;
        const texSizeY = spriteHeight / textureHeight;

        this.drawQueue.push({
            type: "topbar",
            x,
            y,
            spriteX,
            spriteY,
            texSizeX,
            texSizeY
        });
    }

    drawToolBarButtonSprite(id, x, y) {
        const textureWidth = SPRITE_SIZE * 16;
        const textureHeight = SPRITE_SIZE;
        const spriteWidth = SPRITE_SIZE;
        const spriteHeight = SPRITE_SIZE;

        const spriteX = (id % (textureWidth / spriteWidth)) * spriteWidth / textureWidth;
        const spriteY = Math.floor(id / (textureWidth / spriteWidth)) * spriteHeight / textureHeight;
        const texSizeX = spriteWidth / textureWidth;
        const texSizeY = spriteHeight / textureHeight;
        this.drawQueue.push({
            type: "toolbar",
            x,
            y,
            spriteX,
            spriteY,
            texSizeX,
            texSizeY
        });
    }


    render() {
        const gl = this.gl;
        if (this.useOffscreen) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.offscreenFBO);
            gl.viewport(0, 0, 128, 128);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);


        for (let cmd of this.drawQueue) {
            if (cmd.type === "sprite") {
                const {
                    scaleX = 1,
                    scaleY = 1,
                    flipX = false,
                    flipY = false
                } = cmd.options ?? {};
                const effectiveScaleX = scaleX * (flipX ? -1 : 1);
                const effectiveScaleY = scaleY * (flipY ? -1 : 1);

                let ndcX = (Math.floor(cmd.x) / (this.canvas.width / 2)) - 1;
                let ndcY = 1 - (Math.floor(cmd.y) / (this.canvas.width / 2));

                const spriteWidth = this.spriteTrueSize * scaleX / (this.canvas.width / 2);
                const spriteHeight = this.spriteTrueSize * scaleY / (this.canvas.width / 2);

                let u1 = cmd.spriteX;
                let v1 = cmd.spriteY;
                let u2 = cmd.spriteX + cmd.spriteSize;
                let v2 = cmd.spriteY + cmd.spriteSize;

                if (effectiveScaleX < 0) [u1, u2] = [u2, u1];
                if (effectiveScaleY < 0) [v1, v2] = [v2, v1];

                let vertices = new Float32Array([
                    ndcX, ndcY, u1, v1,
                    ndcX + spriteWidth, ndcY, u2, v1,
                    ndcX, ndcY - spriteHeight, u1, v2,

                    ndcX, ndcY - spriteHeight, u1, v2,
                    ndcX + spriteWidth, ndcY, u2, v1,
                    ndcX + spriteWidth, ndcY - spriteHeight, u2, v2
                ]);

                gl.bindTexture(gl.TEXTURE_2D, this.textureMap[cmd.type]);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            if (cmd.type === "topbar") {
                const ndcX = cmd.x / (this.canvas.width / 2) - 1;
                const ndcY = 1 - cmd.y / (this.canvas.width / 2);
                const size = this.canvas.width / this.numberOfCols / (this.canvas.width / 2);

                const vertices = new Float32Array([
                    ndcX, ndcY, cmd.spriteX, cmd.spriteY,
                    ndcX + size, ndcY, cmd.spriteX + cmd.texSizeX, cmd.spriteY,
                    ndcX, ndcY - size, cmd.spriteX, cmd.spriteY + cmd.texSizeY,

                    ndcX, ndcY - size, cmd.spriteX, cmd.spriteY + cmd.texSizeY,
                    ndcX + size, ndcY, cmd.spriteX + cmd.texSizeX, cmd.spriteY,
                    ndcX + size, ndcY - size, cmd.spriteX + cmd.texSizeX, cmd.spriteY + cmd.texSizeY
                ]);

                gl.bindTexture(gl.TEXTURE_2D, this.textureMap[cmd.type]);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            if (cmd.type === "toolbar") {
                const ndcX = cmd.x / (this.canvas.width / 2) - 1;
                const ndcY = 1 - cmd.y / (this.canvas.width / 2);
                const size = this.canvas.width / this.numberOfCols / (this.canvas.width / 2);
                const vertices = new Float32Array([
                    ndcX, ndcY, cmd.spriteX, cmd.spriteY,
                    ndcX + size, ndcY, cmd.spriteX + cmd.texSizeX, cmd.spriteY,
                    ndcX, ndcY - size, cmd.spriteX, cmd.spriteY + cmd.texSizeY,
                    ndcX, ndcY - size, cmd.spriteX, cmd.spriteY + cmd.texSizeY,
                    ndcX + size, ndcY, cmd.spriteX + cmd.texSizeX, cmd.spriteY,
                    ndcX + size, ndcY - size, cmd.spriteX + cmd.texSizeX, cmd.spriteY + cmd.texSizeY
                ]);
                gl.bindTexture(gl.TEXTURE_2D, this.textureMap[cmd.type]);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            if (cmd.type === "font") {
                this.drawFont(cmd);
                // const {
                //     scale = 1,
                //     flipX = false,
                //     flipY = false
                // } = cmd.options ?? {};

                // const halfW = this.canvas.width / 2;
                // const ndcX1 = (cmd.x / halfW) - 1;
                // const ndcY1 = 1 - (cmd.y / halfW);
                // const width = this.spriteTrueSize * scale * (flipX ? -1 : 1);
                // const height = this.spriteTrueSize * scale * (flipY ? -1 : 1);

                // const ndcX2 = ndcX1 + width / halfW;
                // const ndcY2 = ndcY1 - height / halfW;

                // let u1 = cmd.spriteX;
                // let v1 = cmd.spriteY;
                // let u2 = u1 + cmd.spriteWidth;
                // let v2 = v1 + cmd.spriteHeight;

                // if (flipX) [u1, u2] = [u2, u1];
                // if (flipY) [v1, v2] = [v2, v1];

                // const vertices = new Float32Array([
                //     ndcX1, ndcY1, u1, v1,
                //     ndcX2, ndcY1, u2, v1,
                //     ndcX1, ndcY2, u1, v2,
                //     ndcX1, ndcY2, u1, v2,
                //     ndcX2, ndcY1, u2, v1,
                //     ndcX2, ndcY2, u2, v2
                // ]);

                // const gl = this.gl;
                // gl.bindTexture(gl.TEXTURE_2D, this.textureMap.font);
                // gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                // gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
                // gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            if (cmd.type === "rect") {
                let width = cmd.width / (this.canvas.width / 2);
                let height = cmd.height / (this.canvas.width / 2);
                let x = 1 + cmd.x / (this.canvas.width / 2) - 1;
                let y = 1 + (1 - cmd.y / (this.canvas.width / 2)) - height;
                let color = cmd.color;

                gl.enable(gl.SCISSOR_TEST);
                gl.scissor(x * (this.canvas.width / 2), y * (this.canvas.width / 2), width * (this.canvas.width / 2), height * (this.canvas.width / 2));
                gl.clearColor(color[0], color[1], color[2], color[3] || 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.disable(gl.SCISSOR_TEST);
            }
        }

        if (this.useOffscreen) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const fullQuad = new Float32Array([
                -1, 1, 0, 0,
                1, 1, 1, 0,
                -1, -1, 0, 1,
                -1, -1, 0, 1,
                1, 1, 1, 0,
                1, -1, 1, 1
            ]);

            gl.bindTexture(gl.TEXTURE_2D, this.offscreenTexture);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, fullQuad, gl.STATIC_DRAW);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

}

export default EditorRenderer;
