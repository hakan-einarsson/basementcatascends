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

            // map: (cx, cy, mx, my, mw, mh) => this.renderer.drawTilemap(cx, cy, mx, my, mw, mh),
            cam: (cx, cy, scale = 1) => this.drawCamera(cx, cy, scale),
            rect: (x, y, width, height, color = 7) => this.renderer.drawRect(x * this.scale, y * this.scale, width * this.scale, height * this.scale, this.colorPalette[color]),
            // collide: (x, y) => this.collisionHelper.isPointSolid(x, y),
            // collide_circle: (x, y, r) => this.collisionHelper.isCircleColliding(x, y, r),
            collide_box: (x, y, w, h, mask = null, map = null) => this.collisionHelper.isBoxColliding(x, y, w, h, { map, mask }),
            // collide_boxes: (ax, ay, aw, ah, bx, by, bw, bh) => this.collisionHelper.aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh),
            check_half_tile: (x, y, w, h, mask, side, map = this.map) => this.collisionHelper.checkHalfTile(x, y, w, h, mask, side, map),
            // make_collider: (map = null, tileSize = null) => { return new CollisionHelper(map || this.collisionLayer, tileSize, this.scale); },
            // circ: (x, y, r, color = 7) => this.renderer.drawCircle(x, y, r, this.colorPalette[color]),
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
            // x: 5,  // B
            Enter: 6,  // Start
            // Shift: 7,  // Select
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

    // setMask(mask) { this.mask = mask & 0xFF; }

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

    // isSolidTile(tx, ty, map = this.map, mask = this.mask) {
    //     return this._tileHitsMask(tx, ty, mask, map);
    // }


    // isPointSolid(x, y, map = this.map, mask = this.mask) {
    //     x = x * this.scale; y = y * this.scale;
    //     const tx = Math.floor(x / this.tileSize);
    //     const ty = Math.floor(y / this.tileSize);
    //     return this._tileHitsMask(tx, ty, mask, map);
    // }

    // isCircleColliding(cx, cy, r, map = this.map, mask = this.mask) {
    //     cx *= this.scale; cy *= this.scale; r *= this.scale;
    //     const ts = this.tileSize;
    //     // off-by-one fix: inkludera kanten korrekt
    //     const minX = Math.floor((cx - r) / ts);
    //     const maxX = Math.floor((cx + r - 1) / ts);
    //     const minY = Math.floor((cy - r) / ts);
    //     const maxY = Math.floor((cy + r - 1) / ts);

    //     for (let y = minY; y <= maxY; y++) {
    //         for (let x = minX; x <= maxX; x++) {
    //             if (!this._tileHitsMask(x, y, mask, map)) continue;
    //             const rectX = x * ts, rectY = y * ts;
    //             if (this.circleVsRect(cx, cy, r, rectX, rectY, ts, ts)) return true;
    //         }
    //     }
    //     return false;
    // }

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


    // circleVsRect(cx, cy, r, rx, ry, rw, rh) {
    //     const closestX = Math.max(rx, Math.min(cx, rx + rw));
    //     const closestY = Math.max(ry, Math.min(cy, ry + rh));
    //     const dx = cx - closestX;
    //     const dy = cy - closestY;
    //     return (dx * dx + dy * dy) < (r * r);
    // }

    // aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    //     return (
    //         ax < bx + bw && ax + aw > bx &&
    //         ay < by + bh && ay + ah > by
    //     );
    // }

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

export default GameParser;

