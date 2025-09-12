export function loadSpriteSheet() {
    const spriteData = localStorage.getItem("spriteSheet");
    return spriteData ? JSON.parse(spriteData) : null;
}

export function saveSpriteSheet(spriteData) {
    localStorage.setItem("spriteSheet", JSON.stringify(spriteData));
}

export async function loadCode() {
    // const response = await fetch("assets/exampleCode.js")
    const response = await fetch("assets/BasementCatAscends/game.js");
    const userCode = await response.text();
    // const userCode = localStorage.getItem("userCode");
    return userCode ? userCode : "";
}

export function saveCode(code) {
    localStorage.setItem("userCode", code);
}

export function saveTileMap(tileMap) {
    localStorage.setItem("tileMap", JSON.stringify(tileMap));
}

export function loadTileMap() {
    const tileMapData = localStorage.getItem("tileMap");
    return tileMapData ? JSON.parse(tileMapData) : Array.from({ length: 64 }, () => Array(128).fill(null));
}

export function saveCollisionLayer(collisionLayer) {
    localStorage.setItem("collisionLayer", JSON.stringify(collisionLayer));
}

export function loadCollisionLayer() {
    const collisionLayerData = localStorage.getItem("collisionLayer");
    return collisionLayerData ? JSON.parse(collisionLayerData) : Array.from({ length: 64 }, () => Array(128).fill(0));
}

export function saveCollisionLayerMap(collisionLayerMap) {
    localStorage.setItem("collisionLayerMap", JSON.stringify(collisionLayerMap));
}

export function loadCollisionLayerMap() {
    const collisionLayerMapData = localStorage.getItem("collisionLayerMap");
    return collisionLayerMapData ? JSON.parse(collisionLayerMapData) : {};
}

export function saveSfx(sfx) {
    localStorage.setItem("sfx", JSON.stringify(sfx));
}

export function loadSfx() {
    const sfxData = localStorage.getItem("sfx");
    return sfxData ? JSON.parse(sfxData) : null;
}
