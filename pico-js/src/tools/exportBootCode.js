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
gameData.sprites = unflatten3D(unpack(gameData.sprites), 26, 8, 8);
gameData.tilemap = unflatten2D(unpack(gameData.tilemap), 64, 96);
gameData.collision = unflatten2D(unpack(gameData.collision), 64, 96);
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
