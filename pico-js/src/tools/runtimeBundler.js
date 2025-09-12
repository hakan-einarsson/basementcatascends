const RUNTIME_FILES = [
    "src/renderer.js",
    "src/gameParser.js",
    "src/RunTime.js",
    "src/tools/exportBootCode.js",
    // Lägg till fler vid behov
];

export async function renderRuntimeCode() {
    let code = 'import { gameData } from "./game_data.js";\n';
    const fileContents = await Promise.all(
        RUNTIME_FILES.map(path => fetch(path).then(res => res.text()))
    );

    for (let i = 0; i < fileContents.length; i++) {
        let code = fileContents[i];
        code = code.replace(/^export\s+default\s+class\s+/gm, 'class ');
        code = code.replace(/^export\s+default\s+\w+;$/gm, '');
        code = code.replace(/^export\s+{[^}]*};?$/gm, '');
        code = code.replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');
        code = code.replace(/\/\/# sourceMappingURL=.*$/gm, '');
        fileContents[i] = code;
    }

    code += fileContents.join("\n\n");
    return code;
}

export async function renderIndexFile(gameDataCode, runtimeCode) {
    let bundled = gameDataCode + "\n" + runtimeCode;
    bundled = minifyCodeFromAtlas(bundled);

    // ta bort ES-modulgrejer
    bundled = bundled.replace(/export\s+{[^}]*};?/g, "");
    bundled = bundled.replace(/export\s+default\s+[^;]+;/g, "");
    bundled = bundled.replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ");
    bundled = bundled.replace(/import\s+[^;]+;/g, "");
    // remove import{gameData}from"./game_data.js";
    bundled = bundled.replace(/import\s*\{\s*gameData\s*\}\s*from\s*["']\.\/game_data\.js["'];?\n?/, "");
    // const indexPath = "src/tools/exportIndex.html";
    // const indexContent = await fetch(indexPath).then(res => res.text());
    const indexContent = `
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Basement Cat Ascends</title>
</head>
<style>
    body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: black;
    }

    #app {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    canvas {
        border: 1px solid black;
    }
</style>

<body>
    <div id="app"></div>
    <script >
        ${bundled}
    </script>
</body>

</html>
    `
    return indexContent;
}

function minifyCodeFromAtlas(code) {
    const atlas = {
        "Renderer": "R",
        // "canvas": "c",
        "colorPalette": "cp",
        "charBitmaps": "cb",
        "spriteSize": "ss",
        "numberOfCols": "nc",
        "scale": "s",
        "tileMap": "tm",
        "fontTextureWidth": "ftw",
        "fontTextureHeight": "fth",
        "palette": "p",
        "spriteTrueSize": "sts",
        "fontCharMap": "fcm",
        "gl": "g",
        "drawQueue": "dq",
        "initGL": "iGL",
        "textureMap": "txm",
        "offscreenTexture": "ot",
        "maxSprites": "ms",
        "vertexSize": "vs",
        "spriteBatch": "sb",
        "spriteSheetCanvas": "ssc",
        "tileMapCanvas": "tmc",
        "loadFontTextureFromBitmaps": "lFTFB",
        "prepTexture": "pT",
        "createShaderProgram": "cSP",
        "setPalette": "sP",
        "loadSpriteDataToTexture": "lSDT",
        "loadTilemapDataToTexture": "lTDT",
        "clearScreen": "cS",
        "drawRect": "dR",
        "drawCircle": "dC",
        "drawLinedRect": "dLR",
        "drawSprite": "dS",
        "drawText": "dT",
        "drawTilemap": "dTM",
        "flushSpriteBatchRange": "fSBR",
        "renderTilemap": "rTM",
        "clearDrawQueue": "cDQ",
        "drawFont": "dF",
        "drawRectImmediate": "dRI",
        "drawEvenCircleFill": "dECF",
        "drawPixel": "dP",
        "drawTilemapTexture": "dTMT",
        "render": "r",
        "GameParser": "GP",
        "CollisionHelper": "CH",
        "GameObject": "GO",
        "RunTime": "RT"
    };

    for (const [key, value] of Object.entries(atlas)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        console.log(`Replacing ${key} with ${value}`);
        code = code.replace(regex, value);
    }
    return code;
}
