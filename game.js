const PlayerController = ({
    speed = 40, jumpForce = 140,
    gravity = 520, maxFall = 260,
    coyoteMax = 0.12, bufferMax = 0.12
}) => ({
    type: "controller",
    attach(owner) {
        this.owner = owner;
        this.onGround = false;
        this.prevOnGround = false;
        this.coyote = 0;
        this.buffer = 0;
        this.landingTimer = 0;
        this.isOnWall = false;
        this.wallJumpedTimer = 0;
        this.wallJumpDirection = 0; // -1 = left, 1 = right
        this.dead = false;

    },
    update(dt) {
        const g = this.owner;
        if (this.dead) {
            g.animationPlayer.play("death");
            g.velocity.x = 0;
            g.velocity.y = 0;
            return;
        }
        // horisontellt
        let dir = 0;
        if (btn(0)) dir -= 1;
        if (btn(1)) dir += 1;

        this.prevOnGround = this.onGround;
        this.onGround = g.collisionBox.isOnFloor; // om botten är blockerad
        const pushingLeft = dir < 0 && g.collisionBox.isOnWallLeft;
        const pushingRight = dir > 0 && g.collisionBox.isOnWallRight;
        this.isOnWall = !this.onGround && (pushingLeft || pushingRight);

        // --- Wall slide (bara om man trycker mot väggen) ---


        // --- Jump logic ---
        if (this.buffer > 0) {
            if (this.coyote > 0) {
                // vanlig markjump
                g.velocity.y = -jumpForce;
                this.buffer = 0;
                this.coyote = 0;
            } else if (this.isOnWall) {
                // wall jump: alltid UT från väggen
                this.wallJumpedTimer = 0.24; // 200 ms "förbud" mot att hoppa igen
                g.velocity.y = -jumpForce;

                if (g.collisionBox.isOnWallLeft) {
                    g.velocity.x = +speed * 1.2;   // hoppa höger
                    g.sprite.flipX = false;
                    this.wallJumpDirection = 1;
                }
                if (g.collisionBox.isOnWallRight) {
                    g.velocity.x = -speed * 1.2;   // hoppa vänster
                    g.sprite.flipX = true;
                    this.wallJumpDirection = -1;
                }

                this.buffer = 0;
            }
        }

        // timers
        this.coyote = this.onGround ? coyoteMax : Math.max(0, this.coyote - dt);
        this.buffer = btn_pressed(4) ? bufferMax : Math.max(0, this.buffer - dt);

        if (this.wallJumpedTimer > 0) {
            this.wallJumpedTimer -= dt;
            dir = this.wallJumpDirection; // tvinga rörelse ut från väggen
        } else {

            g.velocity.x = dir * speed;
        }

        if (btn_released(4)) {
            g.velocity.y = g.velocity.y / 3;
        }

        if (this.isOnWall && g.velocity.y > 0) {
            g.velocity.y = Math.min(g.velocity.y + gravity * dt, 30);
        } else {
            g.velocity.y = Math.min(g.velocity.y + gravity * dt, maxFall);

        }

        // enkel animation-switch (frivilligt)
        // --- Landed event ---
        if (!this.prevOnGround && this.onGround) {
            this.landingTimer = 0.1; // 100 ms skyddszon
        }

        // --- Animation logic ---
        if (this.landingTimer > 0) {
            this.landingTimer -= dt;
            g.animationPlayer.play(Math.abs(g.velocity.x) > 0.1 ? "run" : "idle");
        } else {
            if (!this.onGround) {
                if (g.velocity.y <= -0.5) {
                    g.animationPlayer.play("jump_up");
                } else if (g.velocity.y >= 0.5) {
                    if (this.isOnWall) {
                        g.animationPlayer.play("wall");
                    } else {
                        g.animationPlayer.play("fall");
                    }
                } else {
                    g.animationPlayer.play("jump_mid");
                }
            } else if (Math.abs(g.velocity.x) > 0.1) {
                g.animationPlayer.play("run");
            } else {
                g.animationPlayer.play("idle");
            }
        }

        if (g.sprite) {
            if (dir !== 0) g.sprite.flipX = dir < 0;
        }
    }
});

const levels = [
    [3, 62],
    [4, 46],
    [10, 30],
    [10, 14],
]


// let camera = { x: 0, y: 63 * 8 - 15 * 8 };
let level = 0;
const camera = cameraFromLevel(level);
const player = new GameObject({ x: levels[level][0] * 8, y: levels[level][1] * 8, scale: 1, name: "player" });
player.currentLevel = 0;
player.add(Sprite({ id: [[0]], scale: 1, flipX: false, flipY: false })); // start frame
player.add(AnimationPlayer({
    animations: {
        idle: { frames: [5, 6], speed: 2 },
        run: { frames: [0, 1, 2, 3, 4], speed: 15 },
        jump_up: { frames: [1], speed: 1 },
        jump_mid: { frames: [2], speed: 1 },
        fall: { frames: [3], speed: 1 },
        wall: { frames: [7], speed: 1 },
        death: { frames: [8, 9, 10, 11], speed: 15, repeat: false, onEnd: resetLevel }
    },
    defaultAnimation: "idle"
}
));
player.add(PlayerController({}));
player.add(CollisionBox({ width: 6, height: 5, offsetX: 1, offsetY: 3 }));


function _init() {
    addObject(player);
}

function _update(dt) {
    let localPosition = { x: 0, y: 0 };
    //get position of x and y without the camera offset
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
    cls(5);
    cam(camera.x + 16 * 8, camera.y, 1);
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
