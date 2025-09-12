import { saveSpriteSheet, saveTileMap, saveCollisionLayer } from "./localStorageHandler";

export async function importSpriteSheet() {
    try {
        const data = await importWithPicker();
        if (data) {
            saveSpriteSheet(data);
        }
    } catch (err) {
        console.error("Failed to import sprite sheet:", err);
    }
}

export async function importTileMap() {
    try {
        const data = await importWithPicker();
        if (data) {
            const { tileMap, collisionLayer } = data;
            saveTileMap(tileMap);
            saveCollisionLayer(collisionLayer);
        }
    } catch (err) {
        console.error("Failed to import tile map:", err);
    }
}

async function importWithPicker() {
    if (!window.showOpenFilePicker) {
        console.log('showOpenFilePicker not supported, using fallback');
        return await importWithInputFallback();
    }
    try {
        const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
        });
        const file = await handle.getFile();
        const text = await file.text();
        return JSON.parse(text); // Returnerar parsed JSON-data
    } catch (err) {
        if (err.name !== "AbortError") console.error(err);
        return null;
    }
}

async function importWithInputFallback() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    resolve(JSON.parse(text)); // Returnerar parsed JSON-data
                } catch (err) {
                    console.error('Failed to parse JSON file:', err);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        };
        input.click();
    });
}
