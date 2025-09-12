// class GameObject {
//     constructor(x, y) {
//         this.position = { x: x, y: y };
//         this.globalPosition = { x: x, y: y };
//         this.scale = 1;
//     }

//     draw(alfa) {

//     }

//     update(dt) {
//         // Update logic for the game object
//     }
// }

// class Camera extends GameObject {
//     constructor(x, y) {
//         super(x, y);
//         this.zoom = 1;
//     }

//     setZoom(zoom) {
//         this.zoom = zoom;
//     }

//     getZoom() {
//         return this.zoom;
//     }

//     draw(alfa) {
//         // Draw the camera view
//     }

//     update(dt) {
//         // Update the camera position and zoom
//     }
// }

// class AnimatedGameObject extends GameObject {
//     constructor(x, y, animationPlayer) {
//         super(x, y);
//         this.animationPlayer = animationPlayer;
//     }

//     update(dt) {
//         this.animationPlayer.update(dt);
//     }

//     draw(alfa) {
//         this.animationPlayer.draw(this.position.x, this.position.y, { scale: this.scale, flipX: this.flipX, flipY: this.flipY });
//     }
// }

// class Player extends AnimatedGameObject {
//     constructor(x, y, collisionBox, animationPlayer, camera = null) {
//         super(x, y, animationPlayer);
//         this.spriteId = 0;
//         this.speed = 30; // px/s
//         this.collisionBox = collisionBox;
//         this.camPosition = { x: 0, y: 64 * 8 - 16 * 8 };
//         this.cameraSpeed = 7;
//         this.speed = 30;
//         this.prevCam = 0;
//         this.prevP = { x: 0, y: 0 };
//         this.lives = 9;
//         this.keySum = 0;
//         this.nextDamageTick = 0;
//     }

//     draw(alfa) {
//         this.animationPlayer.draw(this.position.x, this.position.y, { scale: this.scale, flipX: this.flipX, flipY: this.flipY });
//     }

//     update(dt, camera = null) {
//         super.update(dt);
//         // Additional player-specific update logic
//     }

//     resetLevel = () => {
//         this.camPosition = { x: 0, y: 64 * 8 - 16 * 8 };
//         this.cameraSpeed = 7;
//         this.speed = 30;
//         this.prevCam = 0;
//         this.prevP = { x: 0, y: 0 };
//         this.lives = 9;
//         this.keySum = 0;
//         this.nextDamageTick = 0;
//         this.position = { x: 64, y: 62 * 8 };
//         this.globalPosition = { x: 64, y: 64 };
//     }
// }

// class AnimationPlayer {
//     constructor(animations) {
//         this.animations = animations;
//         this.currentAnimation = null;
//     }

//     play(animationName) {
//         const animation = this.animations[animationName];
//         if (animation && animation !== this.currentAnimation) {
//             this.currentAnimation = animation;
//             this.currentAnimation.reset();
//         }
//     }

//     update(dt) {
//         if (this.currentAnimation) {
//             this.currentAnimation.update(dt);
//         }
//     }

//     draw(x, y, options) {
//         if (this.currentAnimation) {
//             const frame = this.currentAnimation.getCurrentFrame();
//             frame.draw();
//         }
//     }


// }

// class Animation {
//     constructor(frames, frameDuration) {
//         this.frames = frames.map(frame => (new Sprite(0, 0, frame)));
//         this.frameDuration = frameDuration;
//         this.currentFrame = 0;
//         this.elapsedTime = 0;
//     }

//     update(dt) {
//         this.elapsedTime += dt;
//         if (this.elapsedTime >= this.frameDuration) {
//             this.currentFrame = (this.currentFrame + 1) % this.frames.length;
//             this.elapsedTime = 0;
//         }
//     }

//     getCurrentFrame() {
//         return this.frames[this.currentFrame];
//     }
// }

// class Sprite extends GameObject {
//     constructor(x, y, ids) {
//         super(x, y);
//         this.ids = ids;
//         this.flipX = false;
//         this.flipY = false;
//     }

//     draw() {
//         let width = 0;
//        if (Array.isArray(this.ids)) {
//             this.ids.forEach((row, y) => {
//                 row.forEach((id, x) => {
//                     spr(id, this.position.x + x * width, this.position.y + y * width, { scale: this.scale, flipX: this.flipX, flipY: this.flipY });
//                 });
//             });
//         } else {
//             spr(this.ids, this.position.x, this.position.y, { scale: this.scale, flipX: this.flipX, flipY: this.flipY });
//         }
//     }
// }

// class GameObject {
//     constructor({ x = 0, y = 0, scale = 1, zIndex = 0, name = "" } = {}) {
//         this.x = x;
//         this.y = y;
//         this.scale = scale;
//         this.zIndex = zIndex;
//         this.name = name;
//         this.isActive = true;
//         this.components = [];
//         this.eventHandlers = new Map();
//     }
//     add(component) {
//         component.attach(this);
//         this.components.push(component);
//         return this;
//     }
//     on(event, callback) {
//         (this.eventHandlers.get(event) ?? this.eventHandlers.set(event, []), this.eventHandlers.get(event)).push(callback);
//     }
//     emit(event, data) {
//         const handlers = this.eventHandlers.get(event);
//         if (handlers) for (const handler of handlers) handler(data);
//     }
//     emitDeferred(event, data) {
//         runtime.emitDeferred(deferredData => this.emit(event, deferredData), data);
//     }
//     init() {
//         for (const component of this.components) component.init?.();
//     }
//     update(deltaTime) {
//         for (const component of this.components) component.update?.(deltaTime);
//     }
//     draw(context) {
//         for (const component of this.components) component.draw?.(context);
//     }
// }

// const SpriteComponent = ({ image, frame = { x: 0, y: 0, width: 8, height: 8 }, pivot = { x: 0.5, y: 0.5 } }) => {
//     return {
//         attach(gameObject) {
//             this.gameObject = gameObject;
//             this.image = image;
//             this.frame = frame;
//             this.pivot = pivot;
//         },
//         draw(context) {
//             const gameObject = this.gameObject, frame = this.frame, pivotX = frame.width * this.pivot.x, pivotY = frame.height * this.pivot.y;
//             context.save();
//             context.translate(gameObject.x, gameObject.y);
//             context.scale(gameObject.scale, gameObject.scale);
//             context.drawImage(this.image, frame.x, frame.y, frame.width, frame.height, -pivotX, -pivotY, frame.width, frame.height);
//             context.restore();
//         }
//     };
// };

// const AnimatorComponent = ({ clips, defaultClip }) => {
//     return {
//         attach(gameObject) {
//             this.gameObject = gameObject;
//             this.clips = clips;
//             this.play(defaultClip);
//             this.accumulatedTime = 0;
//             this.currentFrameIndex = 0;
//             this.currentClip = null;
//         },
//         play(clipName) {
//             this.currentClip = this.clips?.[clipName] ?? null;
//             this.accumulatedTime = 0;
//             this.currentFrameIndex = 0;
//         },
//         update(deltaTime) {
//             if (!this.currentClip) return;
//             this.accumulatedTime += Math.max(0, Math.min(deltaTime, 0.05)) * (this.currentClip.speed ?? 1);
//             const currentFrame = this.currentClip.frames[this.currentFrameIndex];
//             if (!currentFrame) return;
//             while (this.accumulatedTime >= currentFrame.duration) {
//                 this.accumulatedTime -= currentFrame.duration;
//                 this.currentFrameIndex = (this.currentFrameIndex + 1) % this.currentClip.frames.length;
//             }
//             const sprite = this.gameObject.components.find(component => component.frame && component.image);
//             if (sprite) sprite.frame = this.currentClip.frames[this.currentFrameIndex].frame;
//         }
//     };
// };

// const AABBComponent = ({ width, height, offset = { x: 0, y: 0 }, layer = 1, mask = 1 }) => {
//     return {
//         attach(gameObject) {
//             this.gameObject = gameObject;
//             this.width = width;
//             this.height = height;
//             this.offset = offset;
//             this.layer = layer;
//             this.mask = mask;
//         },
//         getAABB() {
//             const gameObject = this.gameObject;
//             return {
//                 x: gameObject.x + this.offset.x * gameObject.scale,
//                 y: gameObject.y + this.offset.y * gameObject.scale,
//                 width: this.width * gameObject.scale,
//                 height: this.height * gameObject.scale
//             };
//         }
//     };
// };

// const AreaComponent = ({ group }) => {
//     return {
//         attach(gameObject) {
//             this.gameObject = gameObject;
//             this.insideObjects = new Set();
//             this.group = group;
//         },
//         update() {
//             const selfComponent = this.gameObject.components.find(component => component.getAABB?.());
//             if (!selfComponent) return;
//             const selfAABB = selfComponent.getAABB();
//             const overlappingObjects = new Set();
//             for (const otherObject of (runtime.groups[this.group] || [])) {
//                 if (otherObject === this.gameObject) continue;
//                 const otherComponent = otherObject.components.find(component => component.getAABB?.());
//                 if (!otherComponent) continue;
//                 const otherAABB = otherComponent.getAABB();
//                 if (selfAABB.x < otherAABB.x + otherAABB.width && selfAABB.x + selfAABB.width > otherAABB.x && selfAABB.y < otherAABB.y + otherAABB.height && selfAABB.y + selfAABB.height > otherAABB.y) {
//                     overlappingObjects.add(otherObject);
//                 }
//             }
//             for (const object of overlappingObjects) if (!this.insideObjects.has(object)) {
//                 this.insideObjects.add(object);
//                 this.gameObject.emitDeferred("area_enter", object);
//             }
//             for (const object of [...this.insideObjects]) if (!overlappingObjects.has(object)) {
//                 this.insideObjects.delete(object);
//                 this.gameObject.emitDeferred("area_exit", object);
//             }
//         }
//     };
// };

// const RaycastComponent = ({ maxDistance = 64, stepSize = 1 }) => {
//     return {
//         attach(gameObject) {
//             this.gameObject = gameObject;
//             this.maxDistance = maxDistance;
//             this.stepSize = stepSize;
//         },
//         cast(direction) {
//             let x = this.gameObject.x, y = this.gameObject.y;
//             for (let distance = 0; distance <= this.maxDistance; distance += this.stepSize) {
//                 if (runtime.tilemapCollides(x, y)) return { hit: true, x, y, type: "tile" };
//                 const colliders = runtime.groups["colliders"] || [];
//                 for (const collider of colliders) {
//                     const colliderComponent = collider.components.find(component => component.getAABB?.());
//                     if (!colliderComponent) continue;
//                     const colliderAABB = colliderComponent.getAABB();
//                     if (x >= colliderAABB.x && x <= colliderAABB.x + colliderAABB.width && y >= colliderAABB.y && y <= colliderAABB.y + colliderAABB.height) {
//                         return { hit: true, x, y, object: collider };
//                     }
//                 }
//                 x += direction.x * this.stepSize;
//                 y += direction.y * this.stepSize;
//             }
//             return { hit: false };
//         }
//     };
// }

// const Camera = (x,y, width, height, scale= 1) => {
//     return {
//         x,
//         y,
//         width,
//         height,
//         scale,
//         update() {
//             // Update camera position and scale
//         },
//         getViewport() {
//             return {
//                 x: this.x,
//                 y: this.y,
//                 width: this.width / this.scale,
//                 height: this.height / this.scale
//             };
//         }
//     };
// };

// //initiate all variables below
// const resetLevel = () => {
//     camPosition = { x: 0, y: 64 * 8 - 16 * 8 };
//     cameraSpeed = 7;
//     speed = 30;
//     prevCam = 0, prevP = { x: 0, y: 0 };
//     lives = 9;
//     keySum = 0;
//     nextDamageTick = 0;

//     // let key = { x: 13 * 8, y: 45 * 8 };
//     keys = [
//         new GameObject(2 * 8, 16 * 8, 17),
//         new GameObject(8 * 8, 60 * 8, 17),
//         new GameObject(13 * 8, 45 * 8, 17)
//     ];

//     doors = [
//         { x: 8 * 8, y: 57 * 8, width: 16, height: 16 },
//         { x: 6 * 8, y: 39 * 8, width: 16, height: 16 },
//         { x: 4 * 8, y: 0, width: 16, height: 16 }
//     ]; //x,y is to left corner of door




//     pGP = { x: 64, y: 62 * 8 };
//     pLP = { x: 64, y: 64 };
// }
// let keys = [];
// let doors = [];
// let camPosition, cameraSpeed, speed, prevCam, prevP, lives, keySum, nextDamageTick, pGP, pLP;
// let playerCollisionBox = { x: 2, y: 3, width: 3, height: 4 };
// const player = new Player(
//     0, 0, 8, 8,
//     { x: 2, y: 3, width: 3, height: 4 },
//     new AnimationPlayer(animations = {
//         idle: new Animation([0], 0.5),
//         up: new Animation([1, 2, 3, 4], 0.5),
//         down: new Animation([5, 6, 7, 8], 0.5)
//     })
// );



// let currentAnimation = 'idle';
// let currentFrame = 0;
// let nextAnimationFrame = 0;
// resetLevel();

// const calculateOffset = (x, y) => {
//     return { x: x - camPosition.x, y: y - camPosition.y };
// };

// function _init() {
//     console.log("Game initialized with player position:", pGP);
// }


// function _update(dt) {
//     if (nextDamageTick > 0) {
//         nextDamageTick -= dt;
//     }
//     if (pLP.y > 128) {
//         resetLevel();

//     }
//     if (collide_box(pGP.x + 2, pGP.y + 5, playerCollisionBox.width, playerCollisionBox.height, 4)) {
//         if (nextDamageTick <= 0) {
//             lives--;
//             nextDamageTick = 0.5; // reset damage tick
//             if (lives <= 0) {
//                 resetLevel();
//             }
//         }
//     }

//     for (let key of keys) {
//         if (collide_boxes(pGP.x + 2, pGP.y + 5, playerCollisionBox.width, playerCollisionBox.height, key.x, key.y, 8, 8)) {
//             //remove key from array
//             keys.splice(keys.indexOf(key), 1);
//             keySum++;
//         }
//     }
//     prevCam = camPosition.y;
//     prevP = { x: pGP.x, y: pGP.y };

//     // Input
//     let nextX = pGP.x;
//     let nextY = pGP.y;

//     if (btn(0)) nextX -= dt * speed; // left
//     if (btn(1)) nextX += dt * speed; // right
//     if (btn(2)) nextY -= dt * speed; // up
//     if (btn(3)) nextY += dt * speed; // down
//     //normalize
//     if (nextY < 0) playAnimation('up');
//     if (nextY > 0) playAnimation('down');
//     handleAnimation(dt);

//     let noDoorX = true;
//     let noDoorY = true;
//     // const doorsInProximity = getObjectsInProximity(doors, nextX, nextY, 32);
//     // log(doorsInProximity);
//     // Check collisions before updating position
//     if (!collide_box(nextX + 2, pGP.y + 5, playerCollisionBox.width, playerCollisionBox.height)) {
//         for (let door of doors) {
//             if (collide_boxes(nextX + 2, pGP.y + 5, playerCollisionBox.width, playerCollisionBox.height, door.x, door.y, door.width, door.height)) {
//                 if (keySum > 0) {
//                     keySum--;
//                     // remove the door
//                     doors.splice(doors.indexOf(door), 1);
//                 } else {
//                     noDoorX = false; // there is a door and no key
//                 }
//                 break;
//             }
//         }
//         if (noDoorX) {
//             pGP.x = nextX;
//         }
//     }


//     if (!collide_box(pGP.x + 2, nextY + 5, playerCollisionBox.width, playerCollisionBox.height)) {
//         for (let door of doors) {
//             if (collide_boxes(pGP.x + 2, nextY + 5, playerCollisionBox.width, playerCollisionBox.height, door.x, door.y, door.width, door.height)) {
//                 if (keySum > 0) {
//                     keySum--;
//                     // remove the door
//                     doors.splice(doors.indexOf(door), 1);
//                     pGP.y = nextY;
//                 } else {
//                     noDoorY = false;
//                 }
//             }
//         }
//         if (noDoorY) {
//             pGP.y = nextY;
//         }
//     }

//     camPosition.y -= dt * cameraSpeed;
//     pLP = calculateOffset(pGP.x, pGP.y);
// }

// function _draw(alfa) {
//     cls(4);
//     const camY = prevCam + (camPosition.y - prevCam) * alfa;
//     const playerPosition = { x: prevP.x + (pGP.x - prevP.x) * alfa, y: prevP.y + (pGP.y - prevP.y) * alfa };
//     camera(camPosition.x, camY, 2);
//     keys.forEach(key => {
//         spr(17, calculateOffset(key.x, key.y).x, calculateOffset(key.x, key.y).y);
//     });
//     doors.forEach(door => {
//         spr(32, calculateOffset(door.x, door.y).x, calculateOffset(door.x, door.y).y);
//         spr(33, calculateOffset(door.x + 8, door.y).x, calculateOffset(door.x + 8, door.y).y);
//         spr(48, calculateOffset(door.x, door.y + 8).x, calculateOffset(door.x, door.y + 8).y);
//         spr(49, calculateOffset(door.x + 8, door.y + 8).x, calculateOffset(door.x + 8, door.y + 8).y);
//     });
//     spr(currentFrame, calculateOffset(playerPosition.x, playerPosition.y).x, calculateOffset(playerPosition.x, playerPosition.y).y);
//     //ui
//     rect(0, 0, 128, 8, 2);
//     for (let i = 0; i < lives; i++) {
//         spr(20, 2 + i * 4, 2, { scale: 0.5 });
//     }
//     spr(17, 128 - 12, 2, { scale: 0.5 });
//     print(keySum, 128 - 8, 1.8, 7, 0.5);
// }

// function handleAnimation(dt) {
//     const frames = animations[currentAnimation];
//     if (frames) {
//         const animationSpeed = 2 * dt; // Adjust speed as needed
//         nextAnimationFrame += animationSpeed;

//         if (nextAnimationFrame >= 1) {
//             nextAnimationFrame = 0;
//             currentFrame++;
//             console.log(nextAnimationFrame, currentFrame);
//             if (currentFrame >= frames.length) {
//                 currentFrame = frames[0];
//             }
//         }

//         currentSprite = frames[Math.floor(currentFrame)];
//     }
// }

// function playAnimation(animationName) {
//     if (animations[animationName] && currentAnimation !== animationName) {
//         currentAnimation = animationName;
//         currentFrame = animations[animationName][0];
//         nextAnimationFrame = 0;
//     }
// }

// // === Helper Functions ===
// function screenX(worldX, camX) { return (worldX - camX) | 0; }

// function boxCircleOverlap(rx, ry, rw, rh, cx, cy, cr) {
//     const closestX = Math.max(rx, Math.min(cx, rx + rw));
//     const closestY = Math.max(ry, Math.min(cy, ry + rh));
//     const dx = cx - closestX;
//     const dy = cy - closestY;
//     return (dx * dx + dy * dy) <= (cr * cr);
// }

// function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// function getObjectsInProximity(objects, x, y, radius) {
//     return objects.filter(obj => {
//         const dx = obj.x - x;
//         const dy = obj.y - y;
//         return (dx * dx + dy * dy) <= (radius * radius);
//     });
// }
const BoxDrawComponent = ({ w = 8, h = 8, color = 8 }) => ({
    attach(owner) { this.owner = owner; },
    update(dt) {
        if (btn(0)) this.owner.x -= 60 * dt;
        if (btn(1)) this.owner.x += 60 * dt;
    },
    draw() {
        const g = this.owner;
        // anropa ditt existerande API (rect) via parser
        rect(g.x, g.y, w, h, color);
    }
});

let camera = { x: 0, y: 63 * 8 - 16 * 8 };
let cameraSpeed = 7;
keys = [
    new GameObject({ x: 2 * 8, y: 16 * 8 }),
    new GameObject({ x: 8 * 8, y: 60 * 8 }),
    new GameObject({ x: 13 * 8, y: 45 * 8 })
];

doors = [
    { x: 8 * 8, y: 57 * 8, width: 16, height: 16 },
    { x: 6 * 8, y: 39 * 8, width: 16, height: 16 },
    { x: 4 * 8, y: 0, width: 16, height: 16 }
]; //x,y is to left corner of door

let player = new GameObject({ x: 8 * 8, y: 61 * 8 });
player.keys = 0;
player.add(Sprite({ id: 1, scale: 1 }));
player.add(AnimationPlayer({
    animations: {
        idle: { frames: [13, 14], speed: 1 },
        down: { frames: [1, 2, 3, 4], speed: 9 },
        up: { frames: [5, 6, 7, 8], speed: 9 },
        sideways: { frames: [9, 10, 11, 12], speed: 9 }
    },
    defaultAnimation: "idle"
}))
player.add(CollisionBox({ width: 3, height: 3, offsetX: 2, offsetY: 5 }));

function _init() {
    keys.forEach(key => {
        key.add(Sprite({ id: 17, scale: 1 }));
        key.add(CollisionBox({ width: 8, height: 8 }));
        addObject(key);
    });
    addObject(player);
}

function _update(dt) {
    keys.forEach((key, index) => {
        if (colliding_boxes(player.collisionBox.getAABB(), key.collisionBox.getAABB())) {
            player.keys++;
            key.destroy();
            keys.splice(index, 1);
        }
    });

    player.velocity.x = 0;
    player.velocity.y = 0;
    if (btn(0)) {
        player.sprite.flipX = false; player.velocity.x = -50 * 30 * dt;
        player.animationPlayer.play("sideways");
    }
    if (btn(1)) {
        player.sprite.flipX = true; player.velocity.x = 50 * 30 * dt;
        player.animationPlayer.play("sideways");
    }
    if (btn(2)) {
        player.velocity.y = -50 * 30 * dt;
        player.animationPlayer.play("up");
    }
    if (btn(3)) {
        player.velocity.y = 50 * 30 * dt;
        player.animationPlayer.play("down");
    }
    if (player.velocity.x === 0 && player.velocity.y === 0) {
        player.animationPlayer.play("idle");
    }
    camera.y -= cameraSpeed * dt;
}

function colliding_boxes(boxA, boxB) {
    return collide_boxes(boxA.x, boxA.y, boxA.w, boxA.h, boxB.x, boxB.y, boxB.w, boxB.h);
}

function _draw(alfa) {
    cls(4);
    cam(camera.x, camera.y, 1);
    print("Keys: " + player.keys, 1, 1, 7, 1);
}