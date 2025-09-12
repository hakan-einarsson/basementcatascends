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

export default Renderer;
