import { gameData } from "./game_data.js";
class Renderer {
    constructor(canvas, colorPalette, charBitmaps, spriteSize, numberOfCols, scale, tileMap) {
        this.canvas = canvas;
        this.fontTextureWidth = null;
        this.fontTextureHeight = null;
        this.palette = colorPalette;
        this.charBitmaps = charBitmaps;
        this.spriteSize = spriteSize;
        this.numberOfCols = numberOfCols;
        this.scale = scale;
        this.spriteTrueSize = spriteSize * scale;
        this.fontCharMap = null;
        this.gl = canvas.getContext("webgl2");
        if (!this.gl) {
            console.error("WebGL2 not supported");
        }

        this.drawQueue = [];
        this.initGL();
        this.textureMap = {
            sprite: this.prepTexture(),
            font: this.prepTexture({ width: Object.keys(this.charBitmaps).length * this.spriteSize, height: this.palette.length * this.spriteSize }),
            tileMap: this.prepTexture({ width: 128 * this.spriteSize, height: 64 * this.spriteSize })

        };
        this.offscreenTexture = null;
        this.maxSprites = 2000;
        this.vertexSize = 4 * 6; // 4 floats per vertex (x, y, u, v), 6 vertices per quad
        this.spriteBatch = new Float32Array(this.maxSprites * this.vertexSize);
        this.spriteSheetCanvas = null;
        this.tileMapCanvas = null;
        this.tileMap = tileMap;
        this.spriteData = [];
        this.loadFontTextureFromBitmaps();

    }

    initGL() {
        const gl = this.gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const vertexShaderSource = `#version 300 es
            precision mediump float;
            in vec2 position;
            in vec2 texcoord;
            out vec2 v_texcoord;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
                v_texcoord = texcoord;
            }
        `;

        const fragmentShaderSource = `#version 300 es
            precision mediump float;
            in vec2 v_texcoord;
            out vec4 outColor;
            uniform sampler2D u_texture;
            void main() {
                outColor = texture(u_texture, v_texcoord);
            }
        `;

        this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        gl.useProgram(this.program);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        this.positionLoc = gl.getAttribLocation(this.program, "position");
        gl.enableVertexAttribArray(this.positionLoc);
        gl.vertexAttribPointer(this.positionLoc, 2, gl.FLOAT, false, 4 * 4, 0);

        this.texcoordLoc = gl.getAttribLocation(this.program, "texcoord");
        gl.enableVertexAttribArray(this.texcoordLoc);
        gl.vertexAttribPointer(this.texcoordLoc, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

        this.uTexture = gl.getUniformLocation(this.program, "u_texture");
        gl.uniform1i(this.uTexture, 0);
    }

    prepTexture(size = { width: this.canvas.width, height: this.canvas.width }) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
        }
        return program;
    }

    setPalette(palette) {
        this.palette = palette;
    }

    loadSpriteDataToTexture(spriteData) {
        this.spriteData = spriteData;
        const canvas = document.createElement("canvas");
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.width;
        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(this.canvas.width, this.canvas.width);
        const data = imageData.data;

        for (let i = 0; i < spriteData.length; i++) {
            const spriteX = (i % this.numberOfCols) * this.spriteTrueSize;
            const spriteY = Math.floor(i / this.numberOfCols) * this.spriteTrueSize;

            for (let y = 0; y < this.spriteSize; y++) {
                for (let x = 0; x < this.spriteSize; x++) {
                    const color = this.palette[spriteData[i][y][x]] || [0, 0, 0, 0];
                    for (let sy = 0; sy < this.scale; sy++) {
                        for (let sx = 0; sx < this.scale; sx++) {
                            const px = spriteX + x * this.scale + sx;
                            const py = spriteY + y * this.scale + sy;
                            const index = (py * canvas.width + px) * 4;
                            data[index] = color[0] * 255;
                            data[index + 1] = color[1] * 255;
                            data[index + 2] = color[2] * 255;
                            data[index + 3] = (color.length > 3 ? color[3] : 255);
                        }
                    }

                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        this.spriteSheetCanvas = canvas;

        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureMap.sprite);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    loadTilemapDataToTexture(tileMapIndices) {
        const rows = 64, cols = 128;

        const mapCanvas = document.createElement("canvas");
        mapCanvas.width = cols * this.spriteSize;
        mapCanvas.height = rows * this.spriteSize;
        const ctx = mapCanvas.getContext("2d");

        if (!this.spriteSheetCanvas) {
            console.error("spriteSheetCanvas saknas. Kör loadSpriteDataToTexture först.");
            return;
        }

        const spritesPerRow = Math.floor(this.spriteSheetCanvas.width / this.spriteTrueSize);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = tileMapIndices[r][c];
                if (idx == null || idx === 255) continue;

                const sx = (idx % this.numberOfCols) * this.spriteTrueSize;
                const sy = Math.floor(idx / this.numberOfCols) * this.spriteTrueSize;

                ctx.drawImage(
                    this.spriteSheetCanvas,
                    sx, sy, this.spriteTrueSize, this.spriteTrueSize,     // käll-rect (uppskalad)
                    c * this.spriteSize, r * this.spriteSize, this.spriteSize, this.spriteSize // mål-rect (naturlig 8x8)
                );
            }
        }

        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureMap.tileMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.tileMapCanvas = mapCanvas;
    }

    loadFontTextureFromBitmaps() {
        const charBitmaps = this.charBitmaps;
        const colorPalette = this.palette;
        const charList = Object.keys(charBitmaps);
        const fontWidth = 8;
        const fontHeight = 8;

        const cols = charList.length;
        const rows = colorPalette.length;

        const canvas = document.createElement("canvas");
        canvas.width = cols * fontWidth;
        canvas.height = rows * fontHeight;
        this.fontTextureWidth = canvas.width;
        this.fontTextureHeight = canvas.height;


        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let c = 0; c < cols; c++) {
            const char = charList[c];
            const bitmap = charBitmaps[char];

            for (let row = 0; row < rows; row++) {
                const color = colorPalette[row];

                for (let y = 0; y < fontHeight; y++) {
                    for (let x = 0; x < fontWidth; x++) {
                        const bit = bitmap[y][x];
                        const px = c * fontWidth + x;
                        const py = row * fontHeight + y;
                        const index = (py * canvas.width + px) * 4;

                        data[index] = color[0] * 255 * bit;
                        data[index + 1] = color[1] * 255 * bit;
                        data[index + 2] = color[2] * 255 * bit;
                        data[index + 3] = bit ? 255 : 0;
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureMap.font);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.activeTexture(gl.TEXTURE0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.fontCharMap = Object.fromEntries(charList.map((char, i) => [char, i]));
    }

    clearScreen(color = [0, 0, 0]) {
        this.drawQueue = [];
        const gl = this.gl;

        gl.clearColor(color[0], color[1], color[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    drawRect(x, y, width, height, color) {
        this.drawQueue.push({ type: "rect", x, y, width, height, color });
    }

    drawCircle(x, y, radius, color) {
        this.drawQueue.push({ type: "circle", x, y, radius, color });
    }

    drawLinedRect(x, y, width, height, color) {
        this.drawRect(x, y, width, this.scale, color);
        this.drawRect(x, y, this.scale, height, color);
        this.drawRect(x + width - this.scale, y, this.scale, height, color);
        this.drawRect(x, y + height - this.scale, width, this.scale, color);
    }

    drawSprite(id, x, y, options = { scaleX: 1, scaleY: 1, flipX: false, flipY: false }) {
        let spriteX = (id % this.numberOfCols) * this.spriteTrueSize / this.canvas.width;
        let spriteY = Math.floor(id / this.numberOfCols) * this.spriteTrueSize / this.canvas.width;
        let spriteSize = this.spriteTrueSize / this.canvas.width;
        x = x * this.scale;
        y = y * this.scale;

        this.drawQueue.push({
            type: "sprite",
            id,
            x, y,
            spriteX, spriteY,
            spriteSize,
            options
        });
    }

    drawText(text, x, y, colorIndex = 7, options = {}) {
        x = x * this.scale;
        y = y * this.scale;

        //convert numbers to text
        text = text.toString();
        const textScale = options.scale ?? 1;
        const spacing = Math.round((options.spacing ?? this.scale * this.scale / 1.6) * Math.max(0.1, textScale));
        const upperText = text.toUpperCase();

        for (let i = 0; i < upperText.length; i++) {
            const char = upperText[i];
            const col = this.fontCharMap?.[char];
            if (col === undefined) continue;

            const row = colorIndex;
            const spriteX = col * this.spriteSize / this.fontTextureWidth;
            const spriteY = row * this.spriteSize / this.fontTextureHeight;
            const spriteWidth = this.spriteSize / this.fontTextureWidth;
            const spriteHeight = this.spriteSize / this.fontTextureHeight;

            this.drawQueue.push({
                type: "font",
                x: x + i * (this.spriteSize * textScale + spacing),
                y: y,
                spriteX,
                spriteY,
                spriteWidth,
                spriteHeight,
                options
            });
        }
    }

    drawTilemap(cx, cy, mx, my, mw, mh, options = {}) {
        this.drawQueue.push({
            type: "tilemap",
            cx, cy, mx, my, mw, mh,
            scale: options.scale ?? this.scale ?? 1
        });

    }

    flushSpriteBatchRange(startIdx, endIdxExclusive) {
        const gl = this.gl;
        let spriteCount = 0;

        for (let i = startIdx; i < endIdxExclusive; i++) {
            const cmd = this.drawQueue[i];
            if (!cmd || cmd.type !== "sprite") continue;

            const { scaleX = 1, scaleY = 1, flipX = false, flipY = false } = cmd.options ?? {};
            const effX = scaleX * (flipX ? -1 : 1);
            const effY = scaleY * (flipY ? -1 : 1);

            const ndcX = (Math.floor(cmd.x) / (this.canvas.width / 2)) - 1;
            const ndcY = 1 - (Math.floor(cmd.y) / (this.canvas.width / 2));
            const spriteW = this.spriteTrueSize * scaleX / (this.canvas.width / 2);
            const spriteH = this.spriteTrueSize * scaleY / (this.canvas.width / 2);

            let u1 = cmd.spriteX, v1 = cmd.spriteY;
            let u2 = cmd.spriteX + cmd.spriteSize;
            let v2 = cmd.spriteY + cmd.spriteSize;
            if (effX < 0) [u1, u2] = [u2, u1];
            if (effY < 0) [v1, v2] = [v2, v1];

            const base = spriteCount * 6 * 4;
            const verts = this.spriteBatch;

            const quad = [
                [ndcX, ndcY, u1, v1],
                [ndcX + spriteW, ndcY, u2, v1],
                [ndcX, ndcY - spriteH, u1, v2],
                [ndcX, ndcY - spriteH, u1, v2],
                [ndcX + spriteW, ndcY, u2, v1],
                [ndcX + spriteW, ndcY - spriteH, u2, v2],
            ];

            for (let j = 0; j < 6; j++) {
                const o = base + j * 4;
                verts[o + 0] = quad[j][0]; verts[o + 1] = quad[j][1];
                verts[o + 2] = quad[j][2]; verts[o + 3] = quad[j][3];
            }

            spriteCount++;
            if (spriteCount >= this.maxSprites) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.textureMap.sprite);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, this.spriteBatch.subarray(0, spriteCount * 6 * 4), gl.DYNAMIC_DRAW);
                gl.drawArrays(gl.TRIANGLES, 0, spriteCount * 6);
                spriteCount = 0; // fortsätt fylla från början igen
            }
        }

        if (spriteCount > 0) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.textureMap.sprite);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.spriteBatch.subarray(0, spriteCount * 6 * 4), gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.TRIANGLES, 0, spriteCount * 6);
        }

        return endIdxExclusive;
    }


    renderTilemap(cmd) {
        const gl = this.gl;
        const { cx, cy, mx, my, mw, mh, scale = this.scale } = cmd;

        const texW = 128 * this.spriteSize;
        const texH = 64 * this.spriteSize;

        const epsU = 0.5 / texW, epsV = 0.5 / texH;
        const u1 = (mx + epsU) / texW;
        const v1 = (my + epsV) / texH;
        const u2 = (mx + mw - epsU) / texW;
        const v2 = (my + mh - epsV) / texH;

        const halfW = this.canvas.width / 2;
        const halfH = this.canvas.height / 2;
        const x1 = (cx / halfW) - 1;
        const y1 = 1 - (cy / halfH);
        const x2 = x1 + (mw * scale) / halfW;
        const y2 = y1 - (mh * scale) / halfH;

        const verts = new Float32Array([
            x1, y1, u1, v1,
            x2, y1, u2, v1,
            x1, y2, u1, v2,
            x1, y2, u1, v2,
            x2, y1, u2, v1,
            x2, y2, u2, v2,
        ]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureMap.tileMap);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }


    clearDrawQueue() {
        this.drawQueue = [];
    }

    drawFont(cmd) {
        const {
            scale = 1,
            flipX = false,
            flipY = false
        } = cmd.options ?? {};

        const halfW = this.canvas.width / 2;
        const ndcX1 = (cmd.x / halfW) - 1;
        const ndcY1 = 1 - (cmd.y / halfW);
        const width = this.spriteTrueSize * scale * (flipX ? -1 : 1);
        const height = this.spriteTrueSize * scale * (flipY ? -1 : 1);

        const ndcX2 = ndcX1 + width / halfW;
        const ndcY2 = ndcY1 - height / halfW;

        let u1 = cmd.spriteX;
        let v1 = cmd.spriteY;
        let u2 = u1 + cmd.spriteWidth;
        let v2 = v1 + cmd.spriteHeight;

        if (flipX) [u1, u2] = [u2, u1];
        if (flipY) [v1, v2] = [v2, v1];

        const vertices = new Float32Array([
            ndcX1, ndcY1, u1, v1,
            ndcX2, ndcY1, u2, v1,
            ndcX1, ndcY2, u1, v2,
            ndcX1, ndcY2, u1, v2,
            ndcX2, ndcY1, u2, v1,
            ndcX2, ndcY2, u2, v2
        ]);

        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureMap.font);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    drawRectImmediate(cmd) {
        let width = cmd.width / (this.canvas.width / 2);
        let height = cmd.height / (this.canvas.width / 2);
        let x = 1 + cmd.x / (this.canvas.width / 2) - 1;
        let y = 1 + (1 - cmd.y / (this.canvas.width / 2)) - height;
        let color = cmd.color;

        const gl = this.gl;
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x * (this.canvas.width / 2), y * (this.canvas.width / 2), width * (this.canvas.width / 2), height * (this.canvas.width / 2));
        gl.clearColor(color[0], color[1], color[2], color[3] || 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.SCISSOR_TEST);
    }

    drawEvenCircleFill(cmd) {
        const { x: cx, y: cy, radius: r, color } = cmd;
        const s = this.scale;
        if (r === 1) {
            // 2x2 mitt
            this.drawRectImmediate({ x: (cx - r) * s, y: (cy - r) * s, width: 2 * s, height: 2 * s, color });
            return;
        }
        const r2 = r * r;

        for (let dy = -r; dy < r; dy++) {
            const yc = dy + 0.5;
            const t = r2 - yc * yc - 1;
            if (t <= 0) continue;
            const dx = Math.max(0, Math.round(Math.sqrt(t))); // runda upp till närmaste int    
            const w = dx * 2;
            if (w <= 0) continue;
            this.drawRectImmediate({
                x: (cx - dx) * s,
                y: (cy + dy) * s,
                width: w * s,
                height: s,
                color
            });
        }
    }


    drawSpriteWithSingleColor(id, x, y, color, { scale = 1, flipX = false, flipY = false } = {}) {
        const gl = this.gl;
        const spriteSize = this.spriteSize;
        const startX = x * this.scale;
        const startY = y * this.scale;

        // hämta 8x8 sprite från raw-data
        const sprite = this.spriteData[id]; // t.ex. spriteData[id][y][x]

        for (let sy = 0; sy < spriteSize; sy++) {
            for (let sx = 0; sx < spriteSize; sx++) {
                if (sprite[sy][sx] === 255) continue; // transparent

                // pixelposition (ta hänsyn till flipX/flipY)
                let px = flipX ? (spriteSize - 1 - sx) : sx;
                let py = flipY ? (spriteSize - 1 - sy) : sy;

                const drawX = startX + px * this.scale * scale;
                const drawY = startY + py * this.scale * scale;

                // här kan du använda din befintliga rect-ritning
                this.drawQueue.push({
                    type: "rect",
                    x: drawX,
                    y: drawY,
                    width: this.scale * scale,
                    height: this.scale * scale,
                    color: color // [r,g,b,a]
                });
            }
        }
    }


    drawPixel(x, y, color) {
        const gl = this.gl;
        const size = this.scale; // Size of the pixel, adjust if needed
        const pixelX = x * this.canvas.width / 2;
        const pixelY = y * this.canvas.height / 2;

        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(pixelX, pixelY, size, size);
        gl.clearColor(color[0], color[1], color[2], color[3] || 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.SCISSOR_TEST);
    }

    drawTilemapTexture(screenX, screenY, scale = 1) {
        const gl = this.gl;
        const w = 128 * scale;
        const h = 128 * scale;

        const halfW = this.canvas.width / 2;

        const ndcX1 = (screenX / halfW) - 1;
        const ndcY1 = 1 - (screenY / halfW);
        const ndcX2 = ndcX1 + w / halfW;
        const ndcY2 = ndcY1 - h / halfW;

        const vertices = new Float32Array([
            ndcX1, ndcY1, 0, 0,
            ndcX2, ndcY1, 1, 0,
            ndcX1, ndcY2, 0, 1,
            ndcX1, ndcY2, 0, 1,
            ndcX2, ndcY1, 1, 0,
            ndcX2, ndcY2, 1, 1
        ]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.offscreenTexture);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    render() {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.positionLoc);
        gl.vertexAttribPointer(this.positionLoc, 2, gl.FLOAT, false, 4 * 4, 0);
        gl.enableVertexAttribArray(this.texcoordLoc);
        gl.vertexAttribPointer(this.texcoordLoc, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

        let batchStart = -1;

        const flushIfActive = (i) => {
            if (batchStart !== -1) {
                this.flushSpriteBatchRange(batchStart, i);
                batchStart = -1;
            }
        };

        for (let i = 0; i < this.drawQueue.length; i++) {
            const cmd = this.drawQueue[i];
            if (!cmd) continue;

            if (cmd.type === "sprite") {
                if (batchStart === -1) batchStart = i; // börja batcha här
                continue; // vänta med flush tills vi möter annat än sprite
            }

            // icke-sprite -> flush spritebatch före vi ritar detta
            flushIfActive(i);
            if (cmd.type === "font") {
                this.drawFont(cmd); // flytta fontkod till egen metod för renhet
            }
            if (cmd.type === "rect") {
                this.drawRectImmediate(cmd); // scissor-rect
            }
            if (cmd.type === "circle") {
                this.drawEvenCircleFill(cmd);
            }
            if (cmd.type === "tilemap") {
                this.renderTilemap(cmd);
            }
        }
        flushIfActive(this.drawQueue.length);
        this.clearDrawQueue();
    }
}





class GameParser {
    constructor(code, renderer, colorPalette, scale, spriteTrueSize, inputMap, collisionLayer) {
        this.userCode = code;
        this.renderer = renderer;
        this.gameFunctions = {
            _init: () => { },
            _update: () => { },
            _draw: () => { }
        };

        this.inputState = null;
        this.keyboardState = null;
        this.gamepadState = null;
        this.colorPalette = colorPalette;
        this.scale = scale;
        this.inputMap = inputMap;
        this.fixedDelta = 1000 / 60; // 60 FPS
        this.lastTime = performance.now();
        this.fpsAccumulator = 0;
        this.alpha = null;
        this.collisionLayer = collisionLayer || Array.from({ length: 64 }, () => Array(128).fill(0));
        this.collisionHelper = new CollisionHelper(this.collisionLayer, spriteTrueSize, this.scale);
        this.gamepadMap = { buttons: {}, axes: {} };
        this.sceneObjects = [];
        this.camera = { x: 0, y: 0, width: renderer.width, height: renderer.height, scale: 1 };


        // Sandbox med grafik-API och Math/console
        this.sandbox = {
            Math,
            console,
            log: (...args) => console.log("[Game]:", ...args),
            print: (text, x = 0, y = 0, color = 7, scale = 1) => this.renderer.drawText(text, x, y, color, { scale: scale }),
            cls: (color = 0) => this.renderer.clearScreen(this.colorPalette[color]),
            // spr: (id, x, y, options = { scale: 1, flipX: false, flipY: false }) => this.renderer.drawSprite(id, x, y, { scaleX: options.scale, scaleY: options.scale, flipX: options.flipX, flipY: options.flipY }),
            spr: (id, x, y, color = 0, options = { scale: 1, flipX: false, flipY: false }) =>
                this.renderer.drawSpriteWithSingleColor(
                    id, x, y,
                    this.colorPalette[color], // först färgen
                    {
                        scaleX: options.scale,
                        scaleY: options.scale,
                        flipX: options.flipX,
                        flipY: options.flipY
                    }
                ),

            map: (cx, cy, mx, my, mw, mh) => this.renderer.drawTilemap(cx, cy, mx, my, mw, mh),
            cam: (cx, cy, scale = 1) => this.drawCamera(cx, cy, scale),
            rect: (x, y, width, height, color = 7) => this.renderer.drawRect(x * this.scale, y * this.scale, width * this.scale, height * this.scale, this.colorPalette[color]),
            collide: (x, y) => this.collisionHelper.isPointSolid(x, y),
            collide_circle: (x, y, r) => this.collisionHelper.isCircleColliding(x, y, r),
            collide_box: (x, y, w, h, mask = null, map = null) => this.collisionHelper.isBoxColliding(x, y, w, h, { map, mask }),
            collide_boxes: (ax, ay, aw, ah, bx, by, bw, bh) => this.collisionHelper.aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh),
            check_half_tile: (x, y, w, h, mask, side, map = this.map) => this.collisionHelper.checkHalfTile(x, y, w, h, mask, side, map),
            make_collider: (map = null, tileSize = null) => { return new CollisionHelper(map || this.collisionLayer, tileSize, this.scale); },
            circ: (x, y, r, color = 7) => this.renderer.drawCircle(x, y, r, this.colorPalette[color]),
            btn: (id) => !!(this.keyboardState?.[id] || this.gamepadState?.[id]),
            btn_pressed: (id) => {
                const ks = !!this.keyboardState?.[id];
                const kp = !!this.keyboardPrevState?.[id];
                const gs = !!this.gamepadState?.[id];
                const gp = !!this.gamepadPrevState?.[id];
                return (ks && !kp) || (gs && !gp);
            },
            btn_released: (id) => {
                const ks = !!this.keyboardState?.[id];
                const kp = !!this.keyboardPrevState?.[id];
                const gs = !!this.gamepadState?.[id];
                const gp = !!this.gamepadPrevState?.[id];
                return (!ks && kp) || (!gs && gp);
            },
            GameObject: GameObject,
            Sprite: (args) => SpriteComponent({ ...args, spr: this.sandbox.spr, camera: this.camera }),
            CollisionBox: (args) => CollisionBoxComponent({ ...args, box_collide: this.sandbox.collide_box }),
            AnimationPlayer: (args) => AnimationPlayerComponent(args),
            addObject: (obj) => this.addObject(obj)
        };
        this.setupInput();
        this.loadGame();
    }

    drawCamera(cx, cy, scale = 1) {
        this.camera.x = cx;
        this.camera.y = cy;
        this.camera.scale = scale;
        this.renderer.drawTilemap(0, 0, cx, cy, 128, 128, scale);
    }

    addObject(obj) {
        obj.parser = this
        this.sceneObjects.push(obj);
        return obj;
    }

    setupInput() {
        const defaultKeyMap = {
            ArrowLeft: 0,
            ArrowRight: 1,
            ArrowUp: 2,
            ArrowDown: 3,
            Space: 4,  // A
            x: 5,  // B
            Enter: 6,  // Start
            Shift: 7,  // Select
            a: 0,
            d: 1,
            w: 2,
            s: 3
        };

        let keyMap = defaultKeyMap;

        // keyMap = { ...keyMap, ...this.inputMap.keyboard };

        this.gamepadMap = this.inputMap.gamepad;

        const maxIndex = Math.max(...Object.values(keyMap));
        this.inputState = new Array(maxIndex + 1).fill(false);
        this.keyboardState = new Array(maxIndex + 1).fill(false);
        this.keyboardPreviousState = new Array(maxIndex + 1).fill(false);
        this.gamepadState = new Array(maxIndex + 1).fill(false);
        this.gamepadMapPrevious = new Array(maxIndex + 1).fill(false);

        window.addEventListener("keydown", (e) => {
            if (keyMap[e.key] !== undefined) {
                this.keyboardState[keyMap[e.key]] = true;
            }
            if (keyMap[e.code] !== undefined) {
                this.keyboardState[keyMap[e.code]] = true;
            }
        });

        window.addEventListener("keyup", (e) => {
            if (keyMap[e.key] !== undefined) {
                this.keyboardState[keyMap[e.key]] = false;
            }
            if (keyMap[e.code] !== undefined) {
                this.keyboardState[keyMap[e.code]] = false;
            }
        });
    }

    pollGamepadInput() {
        const pads = navigator.getGamepads?.();
        if (!pads) return;

        const gp = pads[0];
        if (!gp) return;

        // Knappar
        for (const [btnIndexStr, mappedIndex] of Object.entries(this.gamepadMap.buttons)) {
            const btnIndex = parseInt(btnIndexStr);
            this.gamepadState[mappedIndex] = gp.buttons[btnIndex]?.pressed || false;
        }

        // Axlar
        const threshold = 0.5;
        for (const [axisKey, mappedIndex] of Object.entries(this.gamepadMap.axes)) {
            const match = axisKey.match(/^(\d+)([+-])$/);
            if (!match) continue;

            const axisIndex = parseInt(match[1]);
            const direction = match[2];
            const value = gp.axes[axisIndex] ?? 0;

            const isPressed =
                (direction === "+" && value > threshold) ||
                (direction === "-" && value < -threshold);

            // Behåll ev. tidigare true om tangent också hålls inne
            this.gamepadState[mappedIndex] = this.gamepadState[mappedIndex] || isPressed;
        }
    }


    loadGame() {
        try {
            const gameWrapper = new Function("sandbox", `
                with (sandbox) {
                    ${this.userCode} // Exekvera användarkod

                    const result = {};
                    if (typeof _init === "function") result._init = _init;
                    if (typeof _update === "function") result._update = _update;
                    if (typeof _draw === "function") result._draw = _draw;

                    // Spara alla variabler i sandboxen
                    for (let key in this) {
                        if (!(key in sandbox)) {
                            sandbox[key] = this[key];
                        }
                    }

                    return result;
                }
            `);

            const userGame = gameWrapper.call(this.sandbox, this.sandbox);
            if (typeof userGame._init === "function") this.gameFunctions._init = userGame._init;
            if (typeof userGame._update === "function") this.gameFunctions._update = userGame._update;
            if (typeof userGame._draw === "function") this.gameFunctions._draw = userGame._draw;
        } catch (error) {
            console.error("Error parsing game code:", error);
        }
    }

    async runInit() {
        this.setupInput();
        this.gameFunctions._init();
        this.renderer.clearScreen();
    }

    updateGame() {
        const now = performance.now();
        const dt = (now - this.lastTime)
        this.lastTime = now;

        this.fpsAccumulator += dt;
        while (this.fpsAccumulator >= this.fixedDelta) {
            this.fpsAccumulator -= this.fixedDelta;
            this.pollGamepadInput(); // Polla gamepad input varje frame
            this.gameFunctions._update(this.fixedDelta / 1000); // Skicka delta tid i sekunder
            // --- Uppdatera alla GameObjects ---
            for (const obj of this.sceneObjects) if (obj.isActive) obj.update(this.fixedDelta / 1000);
            this.keyboardPrevState = [...this.keyboardState];
            this.gamepadPrevState = [...this.gamepadState];
        }
        this.alpha = this.fpsAccumulator / this.fixedDelta; // Beräkna alpha för interpolering
    }

    drawGame() {
        this.renderer.clearScreen();
        this.gameFunctions._draw(this.alpha); // Skicka alpha för interpolering
        // --- rita alla GameObjects ---
        for (const obj of this.sceneObjects) if (obj.isActive) obj.draw(this.alpha);
    }
}

const SpriteComponent = ({ id, scale = 1, flipX = false, flipY = false, spr, camera }) => ({
    type: "sprite",
    attach(owner) {
        this.owner = owner;
        this.id = id;
        this.scale = scale;
        this.flipX = flipX;
        this.flipY = flipY;
        this.active = true;
    },
    draw(alpha) {
        if (!this.active) return;
        const g = this.owner;
        const s = g.scale * this.scale;
        const cam = camera; // din parser.camera

        // gör alltid till 2D-array
        let matrix = Array.isArray(this.id[0])
            ? this.id
            : [Array.isArray(this.id) ? this.id : [this.id]];

        const rows = matrix.length;
        const cols = matrix[0].length;

        // --- Bounding box i world space ---
        const objLeft = g.x;
        const objTop = g.y;
        const objRight = g.x + cols * 8 * s;
        const objBottom = g.y + rows * 8 * s;

        const camLeft = cam.x;
        const camTop = cam.y;
        const camRight = cam.x + cam.width;
        const camBottom = cam.y + cam.height;

        const margin = 8;

        // helt utanför kameran -> rita inte
        if (objRight < camLeft - margin || objLeft > camRight + margin ||
            objBottom < camTop - margin || objTop > camBottom + margin) {
            return;
        }

        // use g.previousX and g.previousY and alpha
        const ix = g.previousX + (g.x - g.previousX) * alpha;
        const iy = g.previousY + (g.y - g.previousY) * alpha;

        // --- Rita sprite-blocket ---
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const srcRow = this.flipY ? (rows - 1 - row) : row;
                const srcCol = this.flipX ? (cols - 1 - col) : col;
                const spriteId = matrix[srcRow][srcCol];

                spr(
                    spriteId,
                    (ix + col * 8 * s - cam.x) * cam.scale,
                    (iy + row * 8 * s - cam.y) * cam.scale,
                    g.getColor(),
                    { scale: s * cam.scale, flipX: this.flipX, flipY: this.flipY }
                );
            }
        }
    }

});

const CollisionBoxComponent = ({ width = 8, height = 8, offsetX = 0, offsetY = 0, box_collide }) => ({
    type: "collisionBox",
    attach(owner) {
        this.owner = owner;
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.box_collide = box_collide;  // injiceras från sandbox
        this.isOnFloor = false;
        this.isOnWallLeft = false;
        this.isOnWallRight = false;
        this.isOnWall = false;
        this.isOnCeiling = false;
    },
    getAABB(x = this.owner.x, y = this.owner.y) {
        return {
            x: x + this.offsetX,
            y: y + this.offsetY,
            w: this.width * this.owner.scale,
            h: this.height * this.owner.scale
        };
    },
    update(dt) {
        const g = this.owner;
        const nextX = g.x + g.velocity.x * dt;
        const nextY = g.y + g.velocity.y * dt;
        const aabbX = this.getAABB(nextX, g.y);
        const aabbY = this.getAABB(g.x, nextY);

        // testa X-rörelse
        if (!this.box_collide(aabbX.x, aabbX.y, aabbX.w, aabbX.h)) {
            g.x = nextX;
            this.isOnWallLeft = false;
            this.isOnWallRight = false;
        } else {
            g.velocity.x = 0;
            if (g.x < nextX) this.isOnWallRight = true;
            if (g.x > nextX) this.isOnWallLeft = true;
        }

        // testa Y-rörelse
        if (!this.box_collide(aabbY.x, aabbY.y, aabbY.w, aabbY.h)) {
            g.y = nextY;
            this.isOnFloor = false;
            this.isOnCeiling = false;
        } else {
            g.velocity.y = 0;
            if (g.y < nextY) this.isOnFloor = true;
            if (g.y > nextY) this.isOnCeiling = true;
        }
    },

});

const AnimationPlayerComponent = ({ animations, defaultAnimation }) => ({
    type: "animationPlayer",
    attach(owner) {
        this.owner = owner;
        this.animations = animations;   // { run:{frames:[13,14,15], speed:10}, idle:{frames:[42], speed:1, repeat: true, onEnd: () => {}} }
        this.currentAnimation = null;
        this.currentFrameIndex = 0;
        this.accumulatedTime = 0;
        if (defaultAnimation) this.play(defaultAnimation);
    },
    play(name) {
        const anim = this.animations[name];
        if (!anim || anim === this.currentAnimation) return;
        this.currentAnimation = anim;
        this.currentFrameIndex = 0;
        this.accumulatedTime = 0;
    },
    update(dt) {
        if (!this.currentAnimation) return;

        const anim = this.currentAnimation;
        const repeat = anim.repeat ?? true;
        const onEnd = anim.onEnd ?? null;
        this.accumulatedTime += dt * (anim.speed ?? 1);

        while (this.accumulatedTime >= 1) {
            this.accumulatedTime -= 1;
            this.currentFrameIndex++;
            if (this.currentFrameIndex >= anim.frames.length) {
                if (repeat) {
                    this.currentFrameIndex = 0;
                } else {
                    this.currentFrameIndex = anim.frames.length - 1;
                    if (onEnd) onEnd(this.owner);
                }
            }
            // this.currentFrameIndex = (this.currentFrameIndex + 1) % anim.frames.length;
        }

        const sprite = this.owner.sprite;
        if (sprite) {
            // frame kan vara nummer, rad eller block
            sprite.id = anim.frames[this.currentFrameIndex];
        }
    }
});




class CollisionHelper {
    constructor(collisionMap, tileSize = null, scale, defaultMask = 2) {
        this.map = collisionMap;
        this.scale = scale;
        this.tileSize = tileSize ?? 8 * scale;
        this.mask = defaultMask & 0xFF;
    }

    setMask(mask) { this.mask = mask & 0xFF; }

    _flagsAt(tx, ty, map = null) {
        const m = map || this.map;
        const row = m[ty];
        if (!row) return 0;
        const v = row[tx];
        return (v | 0) & 0xFF;
    }
    _tileHitsMask(tx, ty, mask, map = null) {
        return (this._flagsAt(tx, ty, map) & mask) !== 0;
    }

    isSolidTile(tx, ty, map = this.map, mask = this.mask) {
        return this._tileHitsMask(tx, ty, mask, map);
    }


    isPointSolid(x, y, map = this.map, mask = this.mask) {
        x = x * this.scale; y = y * this.scale;
        const tx = Math.floor(x / this.tileSize);
        const ty = Math.floor(y / this.tileSize);
        return this._tileHitsMask(tx, ty, mask, map);
    }

    isCircleColliding(cx, cy, r, map = this.map, mask = this.mask) {
        cx *= this.scale; cy *= this.scale; r *= this.scale;
        const ts = this.tileSize;
        // off-by-one fix: inkludera kanten korrekt
        const minX = Math.floor((cx - r) / ts);
        const maxX = Math.floor((cx + r - 1) / ts);
        const minY = Math.floor((cy - r) / ts);
        const maxY = Math.floor((cy + r - 1) / ts);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (!this._tileHitsMask(x, y, mask, map)) continue;
                const rectX = x * ts, rectY = y * ts;
                if (this.circleVsRect(cx, cy, r, rectX, rectY, ts, ts)) return true;
            }
        }
        return false;
    }

    isBoxColliding(x, y, w, h, options = {}) {
        const map = options.map || this.map;
        const mask = options.mask || this.mask;
        x *= this.scale; y *= this.scale; w *= this.scale; h *= this.scale;
        const ts = this.tileSize;
        const minX = Math.floor(x / ts);
        const maxX = Math.floor((x + w - 1) / ts); // off-by-one fix
        const minY = Math.floor(y / ts);
        const maxY = Math.floor((y + h - 1) / ts); // off-by-one fix

        for (let ty = minY; ty <= maxY; ty++) {
            for (let tx = minX; tx <= maxX; tx++) {
                if (this._tileHitsMask(tx, ty, mask, map)) return true;
            }
        }
        return false;
    }

    checkHalfTile(x, y, w, h, mask, side, map = this.map) {
        x *= this.scale; y *= this.scale; w *= this.scale; h *= this.scale;
        const ts = this.tileSize;

        const minX = Math.floor(x / ts);
        const maxX = Math.floor((x + w - 1) / ts);
        const minY = Math.floor(y / ts);
        const maxY = Math.floor((y + h - 1) / ts);

        for (let ty = minY; ty <= maxY; ty++) {
            for (let tx = minX; tx <= maxX; tx++) {
                if (!(this._flagsAt(tx, ty, map) & mask)) continue;

                // Kolla hela AABB mot halvan av tilen
                const tileX = tx * ts;
                const tileY = ty * ts;

                switch (side) {
                    case "left":
                        if (x < tileX + ts / 2 && x + w > tileX) return true;
                        break;
                    case "right":
                        if (x + w > tileX + ts / 2 && x < tileX + ts) return true;
                        break;
                    case "top":
                        if (y < tileY + ts / 2 && y + h > tileY) return true;
                        break;
                    case "bottom":
                        if (y + h > tileY + ts / 2 && y < tileY + ts) return true;
                        break;
                }
            }
        }
        return false;
    }


    circleVsRect(cx, cy, r, rx, ry, rw, rh) {
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) < (r * r);
    }

    aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return (
            ax < bx + bw && ax + aw > bx &&
            ay < by + bh && ay + ah > by
        );
    }

}

class GameObject {
    constructor({ x = 0, y = 0, scale = 1, z = 0, name = "" } = {}) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.scale = scale;
        this.z = z;
        this.velocity = { x: 0, y: 0 };
        this.name = name;
        this.isActive = true;
        this.components = [];
    }

    add(component) {
        component.attach?.(this);
        this.components.push(component);
        if (component.type) this[component.type] = component;
        return this;
    }

    update(dt) {
        this.previousX = this.x;
        this.previousY = this.y;
        for (const c of this.components) {
            c.update?.(dt);
        }
    }

    destroy() {
        this.isActive = false;
        if (this.parser) {
            const i = this.parser.sceneObjects.indexOf(this);
            if (i >= 0) this.parser.sceneObjects.splice(i, 1);
        }
    }

    draw(alpha) {
        for (const c of this.components) c.draw?.(alpha);
    }
}







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





// ==== Unpack binary data ====
const unpack = base64 =>
    Uint8Array.from(atob(base64), c => c.charCodeAt(0));

// ==== Rebuild CHAR_BITMAPS from packed data ====
function unpackCharBitmaps(charBitmapKeys, charBitmapValues) {
    const charBitmaps = {};
    charBitmapKeys.forEach((key, index) => {
        charBitmaps[key] = charBitmapValues[index];
    });
    return charBitmaps;
}

function unflatten3D(flat, d1, d2, d3) {
    const result = [];
    let i = 0;
    for (let x = 0; x < d1; x++) {
        const row = [];
        for (let y = 0; y < d2; y++) {
            const cell = [];
            for (let z = 0; z < d3; z++) {
                cell.push(flat[i++]);
            }
            row.push(cell);
        }
        result.push(row);
    }
    return result;
}

function unflatten2D(flat, rows, cols) {
    const result = [];
    for (let r = 0; r < rows; r++) {
        result.push(flat.slice(r * cols, (r + 1) * cols));
    }
    return result;
}

// ==== Apply unpacked data ====
gameData.sprites = unflatten3D(unpack(gameData.sprites), 128, 8, 8);
gameData.tilemap = unflatten2D(unpack(gameData.tilemap), 64, 128);
gameData.collision = unflatten2D(unpack(gameData.collision), 64, 128);
gameData.charBitmapsData = unflatten3D(unpack(gameData.charBitmapsData), 46, 8, 8);
gameData.charBitmaps = unpackCharBitmaps(gameData.charMap, gameData.charBitmapsData);
gameData.inputMap = gameData.inputMap

// ==== Init runtime ====
const {
    SPRITE_SIZE,
    SCALE,
    NUMBER_OF_COLS
} = gameData.constants;

const SPRITE_TRUE_SIZE = SPRITE_SIZE * SCALE;
const CANVAS_WIDTH = SPRITE_TRUE_SIZE * NUMBER_OF_COLS;

const runtime = new RunTime(CANVAS_WIDTH, CANVAS_WIDTH, "game-canvas", "app", gameData.sprites, gameData.tilemap);
const canvas = runtime.createCanvas();
const renderer = new Renderer(canvas, gameData.palette, gameData.charBitmaps, SPRITE_SIZE, NUMBER_OF_COLS, SCALE, gameData.tilemap);
const parser = new GameParser(gameData.code, renderer, gameData.palette, SCALE, SPRITE_TRUE_SIZE, gameData.inputMap, gameData.collision);
runtime.setRenderer(renderer);
runtime.setParser(parser);
runtime.init();
scaleCanvasToFit();

function scaleCanvasToFit() {
    const container = document.getElementById("app");
    const canvas = document.getElementById("game-canvas");
    const baseSize = CANVAS_WIDTH / SCALE;

    const scale = Math.floor(Math.min(
        container.clientWidth / baseSize,
        container.clientHeight / baseSize
    ));

    canvas.style.width = `${baseSize * scale}px`;
    canvas.style.height = `${baseSize * scale}px`;
}

window.addEventListener("resize", scaleCanvasToFit);
window.addEventListener("DOMContentLoaded", scaleCanvasToFit);

