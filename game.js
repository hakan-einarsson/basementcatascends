// const PlayerController = ({
//     speed = 40, jumpForce = 140,
//     gravity = 520, maxFall = 260,
//     coyoteMax = 0.12, bufferMax = 0.12,
//     wallCoyote = 0, wallCoyoteMax = 0.12
// }) => ({
//     type: "controller",
//     attach(owner) {
//         this.owner = owner;
//         this.resetState();
//     },

//     resetState() {
//         this.onGround = false;
//         this.prevOnGround = false;
//         this.coyote = 0;
//         this.buffer = 0;
//         this.landingTimer = 0;
//         this.isOnWall = false;
//         this.wallJumpedTimer = 0;
//         this.wallJumpDirection = 0;
//         this.wallCoyote = wallCoyote;
//         this.wallCoyoteMax = wallCoyoteMax;
//         this.dead = false;
//         this.forceFlipTimer = 0;
//         this.lastWallSide = 0;
//         this.jumpCount = 0;
//     },

//     update(dt) {
//         const g = this.owner;
//         if (this.dead) return this.handleDeath(g);

//         const dir = this.handleInput();
//         this.updateGroundAndWallState(dir);
//         this.updateWallCoyote(dt);
//         this.handleJumpLogic(g, dir);
//         this.updateTimers(dt, dir, g);
//         this.applyGravity(dt, g);
//         this.handleAnimations(dt, dir, g);
//         this.applySpriteFlip(dir, g, dt);
//     },

//     updateWallCoyote(dt) {
//         if (this.isOnWall) {
//             this.wallCoyote = wallCoyoteMax;
//             this.lastWallSide = this.owner.collisionBox.isOnWallLeft ? -1 : 1;
//         } else {
//             this.wallCoyote = Math.max(0, this.wallCoyote - dt);
//         }
//     },

//     // === Input ===
//     handleInput() {
//         let dir = 0;
//         if (btn(0)) dir -= 1;
//         if (btn(1)) dir += 1;
//         return dir;
//     },

//     // === State updates ===
//     updateGroundAndWallState(dir) {
//         const g = this.owner;
//         this.prevOnGround = this.onGround;
//         this.onGround = g.collisionBox.isOnFloor;
//         if (this.onGround) {
//             this.lastWallSide = 0;
//             this.jumpCount = 0;
//         }
//         const pushingLeft = dir < 0 && g.collisionBox.isOnWallLeft;
//         const pushingRight = dir > 0 && g.collisionBox.isOnWallRight;
//         this.isOnWall = !this.onGround && (pushingLeft || pushingRight);
//     },

//     // === Jump & wall jump ===
//     handleJumpLogic(g, dir) {
//         if (this.buffer <= 0) return;

//         if (this.coyote > 0) {
//             g.velocity.y = -jumpForce;
//             this.buffer = 0;
//             this.coyote = 0;
//             this.jumpCount++;
//         } else if (this.wallCoyote > 0 && this.lastWallSide !== 0) {
//             this.wallJumpedTimer = 0.25;
//             g.velocity.y = -jumpForce;

//             const outDir = -this.lastWallSide;
//             g.velocity.x = outDir * speed * 1.2;
//             g.sprite.flipX = outDir < 0;
//             this.wallJumpDirection = outDir;

//             this.forceFlipTimer = 0.12; // tvinga flip i 120 ms
//             this.lastWallSide = 0;

//             this.buffer = 0;
//             this.wallCoyote = 0;
//         } else if (this.jumpCount < 2 && g.currentLevel > 0) {
//             g.velocity.y = -jumpForce;
//             this.buffer = 0;
//             this.jumpCount++;
//         }
//     },

//     // === Timers & horizontal movement ===
//     updateTimers(dt, dir, g) {
//         this.coyote = this.onGround ? coyoteMax : Math.max(0, this.coyote - dt);
//         this.buffer = btn_pressed(4) ? bufferMax : Math.max(0, this.buffer - dt);

//         if (this.wallJumpedTimer > 0) {
//             this.wallJumpedTimer -= dt;
//             g.velocity.x = this.wallJumpDirection * speed;
//         } else {
//             g.velocity.x = dir * speed;
//         }

//         if (btn_released(4)) {
//             g.velocity.y = g.velocity.y / 3;
//         }
//     },

//     // === Gravity ===
//     applyGravity(dt, g) {
//         if (this.isOnWall && g.velocity.y > 0) {
//             g.velocity.y = Math.min(g.velocity.y + gravity * dt, 30);
//         } else {
//             g.velocity.y = Math.min(g.velocity.y + gravity * dt, maxFall);
//         }
//     },

//     // === Animations ===
//     handleAnimations(dt, dir, g) {
//         if (!this.prevOnGround && this.onGround) {
//             this.landingTimer = 0.1;
//         }

//         if (this.landingTimer > 0) {
//             this.landingTimer -= dt;
//             g.animationPlayer.play(Math.abs(g.velocity.x) > 0.1 ? "run" : "idle");
//             return;
//         }

//         if (!this.onGround) {
//             if (g.velocity.y <= -0.5) g.animationPlayer.play("jump_up");
//             else if (g.velocity.y >= 0.5) g.animationPlayer.play(this.isOnWall ? "wall" : "fall");
//             else g.animationPlayer.play("jump_mid");
//         } else {
//             g.animationPlayer.play(Math.abs(g.velocity.x) > 0.1 ? "run" : "idle");
//         }
//     },

//     // === Sprite flip ===
//     // === Sprite flip ===
//     applySpriteFlip(dir, g, dt) {
//         // ändra bara vid aktiv rörelse på marken
//         if (!this.onWall && g.sprite && dir !== 0) {
//             if (this.forceFlipTimer > 0) {
//                 this.forceFlipTimer -= dt;
//             } else {
//                 this.forceFlipTimer = 0;
//                 g.sprite.flipX = dir < 0;
//             }
//         }
//     },


//     // === Death ===
//     handleDeath(g) {
//         g.animationPlayer.play("death");
//         g.velocity.x = 0;
//         g.velocity.y = 0;
//     }
// });

const PlayerController = ({
    speed = 40, jumpForce = 140,
    gravity = 520, maxFall = 260,
    coyoteMax = 0.12, bufferMax = 0.12,
    wallCoyote = 0, wallCoyoteMax = 0.12,
    boostForce = 200 // ny parameter
}) => ({
    type: "controller",
    attach(owner) {
        this.owner = owner;
        this.resetState();
    },

    resetState() {
        this.onGround = false;
        this.prevOnGround = false;
        this.coyote = 0;
        this.buffer = 0;
        this.landingTimer = 0;
        this.isOnWall = false;
        this.wallJumpedTimer = 0;
        this.wallJumpDirection = 0;
        this.wallCoyote = wallCoyote;
        this.wallCoyoteMax = wallCoyoteMax;
        this.dead = false;
        this.forceFlipTimer = 0;
        this.lastWallSide = 0;
        this.jumpCount = 0;

    },

    update(dt) {
        const g = this.owner;
        if (this.dead) return this.handleDeath(g);

        const dir = this.handleInput();
        this.updateGroundAndWallState(dir);
        this.updateWallCoyote(dt);
        this.handleJumpLogic(g, dir);
        this.updateTimers(dt, dir, g);
        this.applyGravity(dt, g);
        this.handleAnimations(dt, dir, g);
        this.applySpriteFlip(dir, g, dt);
    },

    updateWallCoyote(dt) {
        if (this.isOnWall) {
            this.wallCoyote = wallCoyoteMax;
            this.lastWallSide = this.owner.collisionBox.isOnWallLeft ? -1 : 1;
        } else {
            this.wallCoyote = Math.max(0, this.wallCoyote - dt);
        }
    },

    // === Input ===
    handleInput() {
        let dir = 0;
        if (btn(0)) dir -= 1;
        if (btn(1)) dir += 1;
        return dir;
    },

    // === State updates ===
    updateGroundAndWallState(dir) {
        const g = this.owner;
        this.prevOnGround = this.onGround;
        this.onGround = g.collisionBox.isOnFloor;
        if (this.onGround) {
            this.lastWallSide = 0;
            this.jumpCount = 0;
        }
        const pushingLeft = dir < 0 && g.collisionBox.isOnWallLeft;
        const pushingRight = dir > 0 && g.collisionBox.isOnWallRight;
        this.isOnWall = !this.onGround && (pushingLeft || pushingRight);
    },

    // === Jump, wall jump, double jump, boost ===
    handleJumpLogic(g, dir) {
        if (this.buffer <= 0) return;

        // --- Boost: ner + hopp ---
        // if (g.currentLevel > 1 && btn(3) && !this.boostUsed) {
        //     const boostDir = g.sprite.flipX ? -1 : 1;
        //     if (boostDir !== 0) {
        //         g.velocity.y = -jumpForce * 0.8;
        //         g.velocity.x = boostDir * this.boostForce;
        //         this.boostUsed = true;
        //         this.jumpCount++;
        //         this.buffer = 0;
        //         return;
        //     }
        // }

        // --- Vanligt hopp ---
        if (this.coyote > 0) {
            g.velocity.y = -jumpForce;
            this.buffer = 0;
            this.coyote = 0;
            this.jumpCount++;
        }
        // --- Wall jump ---
        else if (this.wallCoyote > 0 && this.lastWallSide !== 0) {
            this.wallJumpedTimer = 0.25;
            g.velocity.y = -jumpForce;

            const outDir = -this.lastWallSide;
            g.velocity.x = outDir * speed * 1.2;
            g.sprite.flipX = outDir < 0;
            this.wallJumpDirection = outDir;

            this.forceFlipTimer = 0.12;
            this.lastWallSide = 0;

            this.buffer = 0;
            this.wallCoyote = 0;
        }
        // --- Double jump ---
        else if (this.jumpCount < 2 && g.currentLevel > 0) {
            g.velocity.y = -jumpForce;
            this.buffer = 0;
            this.jumpCount++;
        }
    },

    // === Timers & horizontal movement ===
    updateTimers(dt, dir, g) {
        this.coyote = this.onGround ? coyoteMax : Math.max(0, this.coyote - dt);
        // this.buffer = btn_pressed(4) ? bufferMax : Math.max(0, this.buffer - dt);
        if (btn_pressed(4)) {
            this.buffer = bufferMax;
        } else {
            this.buffer = Math.max(0, this.buffer - dt);
        }

        if (this.wallJumpedTimer > 0) {
            this.wallJumpedTimer -= dt;
            g.velocity.x = this.wallJumpDirection * speed;
        } else {
            g.velocity.x = dir * speed;
        }

        if (btn_released(4)) {
            g.velocity.y = g.velocity.y / 3;
        }
    },

    // === Gravity ===
    applyGravity(dt, g) {
        if (this.isOnWall && g.velocity.y > 0) {
            g.velocity.y = Math.min(g.velocity.y + gravity * dt, 30);
        } else {
            g.velocity.y = Math.min(g.velocity.y + gravity * dt, maxFall);
        }
    },

    // === Animations ===
    handleAnimations(dt, dir, g) {
        if (!this.prevOnGround && this.onGround) {
            this.landingTimer = 0.1;
        }

        if (this.landingTimer > 0) {
            this.landingTimer -= dt;
            g.animationPlayer.play(Math.abs(g.velocity.x) > 0.1 ? "run" : "idle");
            return;
        }

        if (!this.onGround) {
            if (g.velocity.y <= -0.5) g.animationPlayer.play("jump_up");
            else if (g.velocity.y >= 0.5) g.animationPlayer.play(this.isOnWall ? "wall" : "fall");
            else g.animationPlayer.play("jump_mid");
        } else {
            g.animationPlayer.play(Math.abs(g.velocity.x) > 0.1 ? "run" : "idle");
        }
    },

    // === Sprite flip ===
    applySpriteFlip(dir, g, dt) {
        if (!this.onWall && g.sprite && dir !== 0) {
            if (this.forceFlipTimer > 0) {
                this.forceFlipTimer -= dt;
            } else {
                this.forceFlipTimer = 0;
                g.sprite.flipX = dir < 0;
            }
        }
    },

    // === Death ===
    handleDeath(g) {
        g.animationPlayer.play("death");
        g.velocity.x = 0;
        g.velocity.y = 0;
    }
});


const DamageBoxComponent = ({
    width = 8, height = 8, offsetX = 0, offsetY = 0
}) => ({
    type: "damageBox",
    attach(owner) {
        this.owner = owner;
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
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
        const aabb = this.getAABB();

        // === Hela damage-tiles (mask 0x2) ===
        if (collide_box(aabb.x, aabb.y, aabb.w, aabb.h, 4)) {
            g.onDamage?.();
            return;
        }

        // === Halva tiles ===
        if (check_half_tile(aabb.x, aabb.y, aabb.w, aabb.h, 8, "left")) { // 3
            g.onDamage?.();
            return;
        }
        if (check_half_tile(aabb.x, aabb.y, aabb.w, aabb.h, 16, "right")) { // 4
            g.onDamage?.();
            return;
        }
        if (check_half_tile(aabb.x, aabb.y, aabb.w, aabb.h, 32, "bottom")) { // 5
            g.onDamage?.();
            return;
        }
        if (check_half_tile(aabb.x, aabb.y, aabb.w, aabb.h, 64, "top")) { // 6
            g.onDamage?.();
            return;
        }
    },
});

const levels = [
    [3, 62],
    [4, 46],
    [9, 30],
    [10, 14],
    [22, 62],
    [29, 46],
    [26, 30],
    [26, 14],
    [39, 62],
    [43, 46],
    [44, 30],
    [44, 14],
    [57, 62],
    [58, 46],
    [60, 30],
    [51, 14],
    [72, 62],
    [73, 46],
    [76, 30],
    [71, 14],

]

let cBox = { width: 6, height: 5, offsetX: 1, offsetY: 3 };


// let camera = { x: 0, y: 63 * 8 - 15 * 8 };
let level = 16;
const camera = cameraFromLevel(level);
const player = new GameObject({ x: levels[level][0] * 8, y: levels[level][1] * 8, scale: 1, name: "player" });
player.currentLevel = 2;
player.add(Sprite({ id: [[0]], scale: 1, flipX: false, flipY: false })); // start frame
player.add(AnimationPlayer({
    animations: {
        idle: { frames: [21, 22], speed: 2 },
        run: { frames: [16, 17, 18, 19, 20], speed: 15 },
        jump_up: { frames: [17], speed: 1 },
        jump_mid: { frames: [18], speed: 1 },
        fall: { frames: [19], speed: 1 },
        wall: { frames: [23], speed: 1 },
        death: { frames: [24, 25, 26, 27], speed: 15, repeat: false, onEnd: resetLevel }
    },
    defaultAnimation: "idle"
}
));
player.add(PlayerController({}));
player.add(CollisionBox(cBox));
player.add(DamageBoxComponent(cBox));
player.onDamage = () => {
    console.log("Ouch!");
    player.controller.dead = true;
};


function _init() {
    addObject(player);
}

function _update(dt) {
    if (level > 7 && player.currentLevel === 0) player.currentLevel = 1;
    if (level > 15 && player.currentLevel < 2) player.currentLevel = 2;
    let localPosition = { x: 0, y: 0 };
    localPosition.x = player.x - camera.x;
    localPosition.y = player.y - camera.y;
    if (localPosition.y < 0) {
        level++;
        resetLevel();

    }
    if (localPosition.y > 119) {
        player.controller.dead = true;
    }
}

function _draw(alfa) {
    if (player.currentLevel === 0) cls(5);
    if (player.currentLevel === 1) cls(1);
    if (player.currentLevel === 2) cls(5);
    cam(camera.x, camera.y, 1);
}

function cameraFromLevel(lvl) {
    const x = Math.floor(lvl / 4) * 128;
    const y = (4 - (lvl % 4)) * 128 - 16 * 8;
    return { x, y };

}

function resetLevel() {
    player.x = levels[level][0] * 8;
    player.y = levels[level][1] * 8;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.controller.dead = false;
    camera.x = cameraFromLevel(level).x;
    camera.y = cameraFromLevel(level).y;
}
