import { loadSpriteSheet, loadTileMap, loadCollisionLayer } from "./localStorageHandler";

export function exportSpriteSheetToJSON() {
    const spriteSheet = loadSpriteSheet();
    const json = JSON.stringify(spriteSheet);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spriteSheet.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportTileMapToJSON() {
    const tileMap = loadTileMap();
    const collisionLayer = loadCollisionLayer();
    const json = JSON.stringify({ tileMap, collisionLayer });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tileMap.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}