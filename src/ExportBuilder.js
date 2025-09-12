import { loadTileMap, loadSpriteSheet, loadCollisionLayer, loadCode } from "./tools/dataHandler";
import { COLOR_PALETTE } from "./config/colors";
import { CHAR_BITMAPS } from "./config/fullCharBitmaps";
import { EXPORT_CONSTANTS } from "./config/constants";
import { INPUT_MAP } from "./config/input_map";
import { renderRuntimeCode, renderIndexFile } from "./tools/runtimeBundler";
import JSZip from "jszip";
import { minify } from "terser";



// Helper functions: Flatten nested array
const flatten = (arr) => arr.reduce((acc, val) => acc.concat(val), []);

function uint8ToBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

function trimTilemapX(fullTileMap, usedWidth = 96) {
    return fullTileMap.map(row => row.slice(0, usedWidth));
}

const gameData = async () => {
    let spriteData = loadSpriteSheet();           // 3D → 1D
    spriteData = spriteData.slice(0, 26);
    spriteData = flatten(flatten(spriteData));
    const fullTileMap = loadTileMap();
    const reducedTileMap = trimTilemapX(fullTileMap, 96);
    const tileMapData = flatten(flatten(reducedTileMap));
    const fullCollision = loadCollisionLayer();
    const reducedCollision = trimTilemapX(fullCollision, 96);
    const collisionData = flatten(flatten(reducedCollision));
    // const collisionData = flatten(flatten(loadCollisionLayer()));
    const ALLOWED_CHARS = "ABCDEFGHIJKLMNOPRSTUVWY0123456789:.'!/() ";

    const charMap = Object.keys(CHAR_BITMAPS).filter(c => ALLOWED_CHARS.includes(c));
    const charBitmapData = flatten(flatten(charMap.map(c => CHAR_BITMAPS[c])));
    const fullCode = await loadCode();
    const propsReducedCode = minifyProps(fullCode);
    const code = minifyCodeFromAtlas(propsReducedCode);
    return {
        sprites: uint8ToBase64(new Uint8Array(spriteData)),
        tilemap: uint8ToBase64(new Uint8Array(tileMapData)),
        collision: uint8ToBase64(new Uint8Array(collisionData)),
        charBitmapsData: uint8ToBase64(new Uint8Array(charBitmapData)),
        charMap: charMap,
        code: code,
        palette: COLOR_PALETTE,
        constants: EXPORT_CONSTANTS,
        inputMap: INPUT_MAP
    };
}

const minifyCodeFromAtlas = (code) => {
    const atlas = {
        "player": "p",
        "gameState": "gs",
        "startScreen": "ss",
        "cameraFromLevel": "cFL",
        "resetLevel": "rL",
        "renderStartScreen": "rSS",
        "renderPauseScreen": "rPS",
        "renderGameOverScreen": "rGOS",
        "renderAbilityScreen": "rAS",
        "showEndingScreen": "sES",
        "formatTime": "fT",
        "PlayerController": "PC",
        "DamageBoxComponent": "DBC",
        "levels": "lv",
        "camera": "ca",
        "options": "o",
        "game_modes": "gm"
    };
    for (const [orig, short] of Object.entries(atlas)) {
        const regex = new RegExp("\\b" + orig + "\\b", "g");
        code = code.replace(regex, short);
    }
    return code;
};

const minifyProps = (code) => {
    const atlas = {
        "onGround": "g",
        "prevOnGround": "pg",
        "landingTimer": "lt",
        "wallCoyote": "wc",
        "wallCoyoteMax": "wm",
        "wallJumpedTimer": "wj",
        "wallJumpDirection": "wd",
        "forceFlipTimer": "ff",
        "lastWallSide": "ls",
        "jumpCount": "jc",
        "boostUsed": "bu",
        "boosting": "bo",
        "ascending": "a",
        "paused": "p",
        "gameOver": "go",
        "selected": "sel",
        "options": "o",
        "game_modes": "gm",
        "hasPlayed": "hp",
        "ascension": "asc",
        "timeChallenge": "tc",
        "hardCore": "hc",
        "ascnded": "ad",
        "coyote": "c",
        "buffer": "b",
        "isOnWall": "iw",
        "deaths": "d",
        "time": "t",
        // "lives": "l",
        "level": "lv",
        "mode": "m",
        "saveToLocalStorage": "sfls",
        "loadFromLocalStorage": "lfls",
        "reset": "r",
    };


    for (const [orig, short] of Object.entries(atlas)) {
        // matchar .onGround, this.onGround och även objekt-litteraler { onGround: ... }
        const regex = new RegExp(`\\b${orig}\\b`, "g");
        code = code.replace(regex, short);
    }
    return code;
};


const buildGameDataFile = async (minifyCode = false) => {
    const data = await gameData();

    const code = minifyCode
        ? (await minify(data.code, {
            compress: true,
            mangle: true,
            format: { comments: false },
        })).code
        : data.code;

    return `export const gameData = {
        sprites: "${data.sprites}",
        tilemap: "${data.tilemap}",
        collision: "${data.collision}",
        charBitmapsData: "${data.charBitmapsData}",
        charMap: ${JSON.stringify(data.charMap)},
        code: \`${code.replace(/`/g, '\\`')}\`,
        palette: ${JSON.stringify(data.palette)},
        constants: ${JSON.stringify(data.constants)},
        inputMap: ${JSON.stringify(data.inputMap)}
    };`;
};

export const downloadGameDataFiles = () => {
    buildAndDownloadExportZip()
}

export async function buildAndDownloadExportZip() {
    const terserOptions = {
        compress: true,
        mangle: true,
        format: { comments: false }
    };

    const gameJS = await renderRuntimeCode(); // ev. med/minifierad version också
    const gameJSMin = await minify(gameJS, terserOptions).then(r => r.code); // med terser
    const gameDataJS = await buildGameDataFile(false); // läsbar version
    const gameDataMinJS = await buildGameDataFile(true); // minifierad code-sträng
    const indexHTML = await renderIndexFile(gameDataMinJS, gameJSMin); // antar att du redan har denna

    const zip = new JSZip();
    zip.file("index.html", indexHTML);
    zip.file("game.js", gameJS);
    zip.file("game.min.js", gameJSMin);
    zip.file("game_data.js", gameDataJS);
    zip.file("game_data.min.js", gameDataMinJS);

    const blob = await zip.generateAsync({ type: "blob" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "game_export.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
}


