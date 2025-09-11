const cameraFromLevel = (lvl) => {
    const x = Math.floor(lvl / 4) * 128;
    const y = (4 - (lvl % 4)) * 128 - 16 * 8;
    return { x, y };

}

const resetLevel = (player) => {
    player.x = levels[player.level][0] * 8;
    player.y = levels[player.level][1] * 8;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.controller.dead = false;
    player.sprite.active = true;
    player.fPa = 0.3;
    player.controller.buffer = 0;
    player.animationPlayer.play("idle");
    camera.x = cameraFromLevel(player.level).x;
    camera.y = cameraFromLevel(player.level).y;
}

const cTxt = (text) => {
    let x = 64 - (text.length * 4) / 3 - 7;
    return x;
}

const renderStartScreen = (startScreen, player) => {
    let title = "Basement Cat";
    let title2 = "Ascends";
    print(title, 24.5, 19.5, 0, 1);
    print(title, 25, 20, 7, 1);
    print(title2, 36.5, 34.5, 0, 1);
    print(title2, 37, 35, 7, 1);
    if (gameState === "mode") {
        for (let i = 0; i < startScreen.game_modes.length; i++) {
            let mode = startScreen.game_modes[i];
            let y = 62 + i * 6;
            let color = startScreen.selected === i ? 7 : 5;
            print(mode, cTxt(mode), y, color, 0.5);
        }
    } else {
        for (let i = 0; i < startScreen.options.length; i++) {
            let option = startScreen.options[i];
            let y = 62 + i * 6;
            let color = startScreen.selected === i ? 7 : 5;
            print(option, cTxt(option), y, color, 0.5);

        }
    }



    spr(5, 30, 5, player.ascnded ? 10 : 0);
    spr(25, 56, 5, player.timeChallenge ? 7 : 0);
    spr(24, 56 + 30, 5, player.hardCore ? 8 : 0);

}

const renderPauseScreen = () => {
    print("PAUSED", 40, 58, 7, 1);
}

const renderGameOverScreen = () => {
    cls(1);
    print("GAME OVER", 35, 58, 7, 1);
    let restartText = "Press A to restart";
    print(restartText, 64 - (restartText.length * 4) / 3 - 5, 75, 0, 0.5);
}

const renderAbilityScreen = () => {
    cls(1);
    let text = player.level > 8 ? "You've reached the attic!" : "You've reached the living room!";
    let subText = player.level > 8 ? "You can now dash by " : "You can now double jump!";
    let subText2 = "pressing down and jump button";
    let continueText = "Press A to continue";
    print(text, cTxt(text), 30, 7, 0.5);
    print(subText, cTxt(subText), 40, 7, 0.5);
    if (player.level > 8) print(subText2, cTxt(subText2), 50, 7, 0.5);
    print(continueText, cTxt(continueText), 75, 0, 0.5);
}

const showEndingScreen = (plr) => {
    if (typeof plr === 'undefined') return;
    gameState = "end";
    let subText = "Congratulations!";
    let text2 = "You have ascended!";
    let text3 = "Additional Challenges Unlocked!";
    let deaths = "Deaths: " + (player.deaths || 0);
    let time = "Time: " + formatTime(player.time);
    let restartText = "Press A to restart";
    cls(1);
    print(subText, 30, 21, 7, 0.75);
    print(text2, 25, 35, 7, 0.75);
    print(deaths, cTxt(deaths), 55, 7, 0.5);
    print(time, cTxt(time), 61, 7, 0.5);
    if (player.mode === 0) print(text3, cTxt(text3), 72, 7, 0.5);
    print(restartText, cTxt(restartText), 81, 0, 0.5);
}



const formatTime = (t) => {
    let minutes = Math.floor(t / 60);
    let seconds = Math.floor(t % 60);
    let centiseconds = Math.floor((t * 100) % 100);
    return minutes + ":" + seconds.toString().padStart(2, '0') + "." + centiseconds.toString().padStart(2, '0');
}

const PlayerController = ({
    speed = 40, jumpForce = 140,
    gravity = 520, maxFall = 200,
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
        this.boostUsed = false;
        this.boosting = false;
        this.ascending = false;
        this.paused = false;
        this.fPa = 0;
        this.gameOver = false;

    },

    update(dt) {
        const g = this.owner;
        if (this.paused || this.gameOver || g.fPa > 0) return;
        if (this.dead) {
            return this.handleDeath(g);
        }
        if (this.ascending || this.isAtGoal()) {
            g.animationPlayer.play("ascend");
            this.ascending = true;
            if (g.mode === 3) g.timeChallenge = true;
            if (g.mode === 2) g.hardCore = true;
            this.level = 0;
            g.velocity.x = 0;
            g.velocity.y = -40;
            g.ascnded = true;
            g.hasPlayed = false;
            g.saveToLocalStorage();
            return;
        }

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
            this.boostUsed = false; // återställ boost när spelaren är på marken
            this.boosting = false; // återställ boosting när spelaren är på marken
        }
        const pushingLeft = dir < 0 && g.collisionBox.isOnWallLeft;
        const pushingRight = dir > 0 && g.collisionBox.isOnWallRight;
        this.isOnWall = !this.onGround && (pushingLeft || pushingRight);
        if (this.isOnWall || g.velocity.x == 0) this.boosting = false; // avbryt boost om spelaren klättrar på en vägg
    },

    // === Jump, wall jump, double jump, boost ===
    handleJumpLogic(g, dir) {
        if (this.buffer <= 0) return;

        // --- Boost: ner + hopp ---
        if (g.ascension > 1 && btn(3) && !this.boostUsed && !this.onWall) {
            const boostDir = g.sprite.flipX ? -1 : 1;
            if (boostDir !== 0) {
                g.velocity.y = -jumpForce * 0.8;
                g.velocity.x = boostDir * boostForce;
                this.boostUsed = true;
                this.boosting = true;
                if (this.jumpCount === 0) this.jumpCount++;
                this.buffer = 0;
                return;
            }
        }

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
        else if (this.jumpCount < 2 && g.ascension > 0) {
            g.velocity.y = -jumpForce;
            this.buffer = 0;
            this.jumpCount++;
            this.boosting = false; // avbryt boost om dubbelhopp utförs
        }
    },

    // === Timers & horizontal movement ===
    updateTimers(dt, dir, g) {
        this.coyote = this.onGround ? coyoteMax : Math.max(0, this.coyote - dt);
        if (btn_pressed(4)) {
            this.buffer = bufferMax;
        } else {
            this.buffer = Math.max(0, this.buffer - dt);
        }

        if (this.wallJumpedTimer > 0) {
            this.wallJumpedTimer -= dt;
            g.velocity.x = this.wallJumpDirection * speed;
        } else {
            if (!this.boosting) g.velocity.x = dir * speed;
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
        this.boostUsed = false;
        this.boosting = false;
        g.saveToLocalStorage();

    },

    isAtGoal() {
        const g = this.owner;
        const centerX = g.x + (g.collisionBox.width * g.scale) / 2;
        const centerY = g.y + (g.collisionBox.height * g.scale) / 2;
        return (
            centerX >= g.goalTile.x * 8 &&
            centerX <= g.goalTile.x * 8 + 8 &&
            centerY >= g.goalTile.y * 8 &&
            centerY <= g.goalTile.y * 8 + 8
        );
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
    [83, 62],
    [84, 46],
    [83, 30],
    [81, 13]

]
const cBox = { width: 6, height: 5, offsetX: 1, offsetY: 3 };
const player = new GameObject({ x: levels[0][0] * 8, y: levels[0][1] * 8, scale: 1, name: "player" });
player.level = 0;
player.goalTile = { x: 88, y: 7 };
player.add(Sprite({ id: [[0]], scale: 1, flipX: false, flipY: false })); // start frame
player.add(AnimationPlayer({
    animations: {
        idle: { frames: [5, 6], speed: 2 },
        run: { frames: [0, 1, 2, 3, 4], speed: 15 },
        jump_up: { frames: [1], speed: 1 },
        jump_mid: { frames: [2], speed: 1 },
        fall: { frames: [3], speed: 1 },
        wall: { frames: [7], speed: 1 },
        death: { frames: [8, 9, 10, 11], speed: 15, repeat: false, onEnd: () => resetLevel(player) },
        ascend: {
            frames: [12, 13, 14, 15, 16], speed: 6, repeat: false, onEnd: () => {
                player.sprite.active = false;
                player.level = 0;
                player.hasPlayed = false;
                showEndingScreen(player);
                player.controller.resetState();
            }
        }
    },
    defaultAnimation: "idle"
}
));
player.add(PlayerController({}));
player.add(CollisionBox(cBox));
player.add(DamageBoxComponent(cBox));
player.getColor = () => {
    if (player.controller.ascending) return 10;
    if (player.ascension === 0) return 0;
    if (player.ascension === 1) return player.controller.jumpCount > 1 ? 0 : 4;
    if (player.ascension === 2) {
        if (!player.controller.boostUsed) return player.controller.jumpCount > 1 ? 6 : 7;
        return player.controller.jumpCount > 1 ? 0 : 4;
    }
};
player.onDamage = () => {
    if (player.controller.dead) return;
    player.controller.dead = true;
    player.deaths++;
};
player.reset = () => {
    player.ascension = 0;
    player.mode = 0; // 0 = normal, 1 = ascnded, 2 = hard, 3 = time challenge
    player.deaths = 0;
    player.time = 0;
    player.controller.resetState();
    player.setLevel();
    player.sprite.active = true;
    player.lives = player.mode === 2 ? 9 : 0;
};
player.setLevel = () => {
    player.x = levels[player.level][0] * 8;
    player.y = levels[player.level][1] * 8;
};
player.loadFromLocalStorage = () => {
    const saveData = JSON.parse(localStorage.getItem("basement-cat-ascends-save"));
    if (saveData) {
        player.hasPlayed = saveData.hasPlayed || false;
        player.level = saveData.level || 0;
        player.ascension = saveData.ascension || 0;
        player.deaths = saveData.deaths || 0;
        player.time = saveData.time || 0;
        player.lives = saveData.lives || 0;
        player.ascnded = saveData.ascnded || false;
        player.timeChallenge = saveData.timeChallenge || false;
        player.hardCore = saveData.hardCore || false;
        player.mode = saveData.mode || 0;
        player.setLevel();
    }
};
player.saveToLocalStorage = () => {
    const saveData = {
        hasPlayed: player.hasPlayed,
        level: player.level,
        ascension: player.ascension,
        deaths: player.deaths,
        time: player.time,
        lives: player.lives,
        ascnded: player.ascnded || false,
        timeChallenge: player.timeChallenge,
        hardCore: player.hardCore,
        mode: player.mode
    };
    localStorage.setItem("basement-cat-ascends-save", JSON.stringify(saveData));
};
player.setMode = (mode) => {
    player.reset();
    player.mode = mode;
    if (mode === 0) {
        player.hasPlayed = true;
        player.saveToLocalStorage();
    } else if (mode === 1) {
        player.ascension = 2;
        player.hasPlayed = true;
        player.saveToLocalStorage();
    } else if (mode === 2) {
        player.ascension = 2;
        player.lives = 9;
        player.hasPlayed = true;
        player.saveToLocalStorage();
    } else if (mode === 3) {
        player.ascension = 2;
        player.mode = 3;
        // 5min in milliseconds
        // player.time = 3000;
        player.hasPlayed = true;
        player.saveToLocalStorage();
    }
};


player.loadFromLocalStorage();
player.timeChallenge = false;
player.hardCore = false;
const camera = cameraFromLevel(player.level);

let gameState = "st"; // "st", "mode", "p", "pl", "go","end"
let startScreen = {
    selected: 0,
    resume: player.hasPlayed || false,
    options: ["New Game"],
    game_modes: ["Normal", "Ascended", "Nine Lives", "Time Challenge", "Back"],
    choosing_mode: false
};


function _init() {
    addObject(player);
    if (startScreen.resume) {
        startScreen.options.unshift("Resume");
    }
}

function _update(dt) {
    if (typeof player === 'undefined') return;
    if (player.fPa > 0) {
        player.fPa -= dt;
        if (player.fPa < 0) player.fPa = 0;
        return;
    }
    if (gameState === "p") {
        if (btn_pressed(6)) {
            gameState = "pl";
            player.controller.paused = false;
        }
        return;
    }
    if (gameState === "st") {
        player.loadFromLocalStorage();
        if (btn_pressed(4)) {
            if (startScreen.options[startScreen.selected] === "Resume") {
                resetLevel(player);
                gameState = "pl";
            } else if (startScreen.options[startScreen.selected] === "New Game") {
                if (player.ascnded) {
                    gameState = "mode";
                    startScreen.selected = 0;
                    return
                } else {
                    player.reset();
                    player.hasPlayed = true;
                    player.level = 0;
                    player.saveToLocalStorage();
                    resetLevel(player);
                    gameState = "pl";
                    return;
                }
            }
        }

        if (btn_pressed(2)) {
            startScreen.selected = (startScreen.selected - 1 + startScreen.options.length) % startScreen.options.length;
        }
        if (btn_pressed(3)) {
            startScreen.selected = (startScreen.selected + 1) % startScreen.options.length;
        }
    }
    if (gameState === "mode") {
        if (btn_pressed(2)) {
            startScreen.selected = (startScreen.selected - 1 + startScreen.game_modes.length) % startScreen.game_modes.length;
        }
        if (btn_pressed(3)) {
            startScreen.selected = (startScreen.selected + 1) % startScreen.game_modes.length;
        }
        if (btn_pressed(4)) {
            if (startScreen.game_modes[startScreen.selected] === "Back") {
                gameState = "st";
                startScreen.selected = 0;
                return;
            }
            player.setMode(startScreen.selected);
            player.level = 0;
            resetLevel(player);
            gameState = "pl";
            return;
        }
    }
    if (gameState === "pl") {
        if (btn_pressed(6)) {
            gameState = "p";
            player.controller.paused = true;
            return;
        }
        if (player.mode === 2 && player.deaths >= player.lives) {
            gameState = "go";
            player.controller.gameOver = true;
            player.sprite.active = false;
            return;
        }
        if (player.mode === 3 && player.time > 300) {
            gameState = "go";
            player.controller.gameOver = true;
            player.sprite.active = false;
            player.time = 0;
            player.saveToLocalStorage();
            return;
        }
        player.time += dt;
        if (player.level > 7 && player.ascension === 0) player.ascension = 1;
        if (player.level > 15 && player.ascension < 2) player.ascension = 2;
        let localPosition = { x: 0, y: 0 };
        localPosition.x = player.x - camera.x;
        localPosition.y = player.y - camera.y;
        if (localPosition.y < 0) {
            player.level++;
            if (player.level % 8 === 0 && player.level > 0 && player.mode === 0) {
                gameState = "new_ability";
            }
            player.saveToLocalStorage();
            resetLevel(player);

        }
        if (localPosition.y > 119 && !player.controller.dead) {
            player.controller.dead = true;
            player.deaths++;
        }
    }

    if (gameState === "go") {
        if (btn_pressed(4)) {
            gameState = "st";
            player.level = 0;
            player.lives = player.mode === 2 ? 9 : 0;
            player.deaths = 0;
            player.time = player.mode === 3 ? 300000 : 0;
            player.sprite.active = true;
            player.controller.resetState();
            player.hasPlayed = false;
            resetLevel(player);
            player.saveToLocalStorage();
        }
        return;
    }

    if (gameState === "new_ability") {
        if (btn_pressed(4)) {
            gameState = "pl";
        }
    }

    if (gameState === "end") {
        if (btn_pressed(4)) {
            gameState = "st";
            player.level = 0;
            player.hasPlayed = false;
            player.ascension = 0;
            resetLevel(player);
        }
    }
}

function _draw(alfa) {
    if (gameState === "st" || gameState === "mode") {
        cls(1);
        renderStartScreen(startScreen, player);
        return;
    }
    if (gameState === "pl" || gameState === "p") {
        if (player.level < 8) cls(5);
        else if (player.ascension < 16) cls(1);
        else cls(5);
        cam(camera.x, camera.y, 1);
        if (player.mode === 2) {
            spr(24, 1, 0, 8, { scale: 0.25 }); // heart icon
            print((player.lives - player.deaths), 10, 1, 7, 0.75);

        }
        if (player.mode === 3) {
            spr(25, 1, 0, 7);
            print(formatTime(Math.max(0, 300 - player.time)), 10, 1, 7, 0.75);
        }
        if (gameState === "p") {
            renderPauseScreen();
        }
    }

    if (gameState === "go") {
        renderGameOverScreen();
        return;
    }

    if (gameState === "new_ability") {
        renderAbilityScreen();
        return;
    }

    if (gameState === "end") {
        cls(1);
        showEndingScreen(player);
        return;
    }
}

