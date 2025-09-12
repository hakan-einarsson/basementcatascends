import UIElement from './UIElement.js';
import { saveSpriteSheet, loadSpriteSheet } from './tools/localStorageHandler.js';
import { NUMBER_OF_COLS, SPRITE_SIZE, SCALE } from "./config/constants.js";
import { COLOR_PALETTE } from './config/colors.js';

class SpriteSheet extends UIElement {
    constructor(x, y, width, height, spriteData) {
        super(x, y, width, height);
        this.spriteData = spriteData ?? this.populateSpriteDataWithEmptySprites() // Array med alla sprites
        this.selectedSprite = 0; // Vilken sprite som är aktiv
        this.isSelecting = false;
        this.saveTimeout = null;
        this.selectionExpanded = false; // Flagga för att hålla koll på om urvalet har expanderats. Den markerade ytan är då 2x2 sprites istället för 1x1.
        this.spriteSheetIndex = 0; // Index för den aktuella sprite sheeten
    }

    init(renderer) {
        this.spriteData = loadSpriteSheet();
        if (!this.spriteData || this.spriteData.length === 0) {
            this.spriteData = this.populateSpriteDataWithEmptySprites();
            console.warn("Sprite data is empty, initializing with empty sprites.");
            this.saveSpriteSheetDebounced(); // Save the initialized empty sprite data
        }
    }

    populateSpriteDataWithEmptySprites() {
        return Array(SPRITE_SIZE * SPRITE_SIZE).fill().map(() => Array(SPRITE_SIZE).fill().map(() => Array(SPRITE_SIZE).fill(255)));
    }

    updateSpriteData(spritePixels) {
        if (this.selectionExpanded) {
            const selectedSprites = this.getExpandedSelection();
            //sprite pixels is 16x16, needs to be converted into 4 x 8x8 sprites
            const sprites = [];
            for (let i = 0; i < 4; i++) {
                sprites[i] = [];
                for (let j = 0; j < 4; j++) {
                    sprites[i][j] = spritePixels.slice(i * 8, (i + 1) * 8).map(row => row.slice(j * 8, (j + 1) * 8));
                }
            }
            this.spriteData[selectedSprites[0]] = sprites[0][0];
            this.spriteData[selectedSprites[1]] = sprites[0][1];
            this.spriteData[selectedSprites[2]] = sprites[1][0];
            this.spriteData[selectedSprites[3]] = sprites[1][1];
            this.saveSpriteSheetDebounced();
        } else {
            this.spriteData[this.selectedSprite] = JSON.parse(JSON.stringify(spritePixels)); // Kopiera pixels
            this.saveSpriteSheetDebounced();
        }
    }

    copySprite() {
        if (this.selectionExpanded) {
            const selectedSprites = this.getExpandedSelection();
            this.copiedSprite = selectedSprites.map(index => JSON.parse(JSON.stringify(this.spriteData[index])));
        } else {
            this.copiedSprite = JSON.parse(JSON.stringify(this.spriteData[this.selectedSprite]));
        }
    }

    pasteSprite(spriteCanvas) {
        if (this.copiedSprite) {
            if (this.selectionExpanded && Array.isArray(this.copiedSprite)) {
                const selectedSprites = this.getExpandedSelection();
                selectedSprites.forEach((index, i) => {
                    if (this.copiedSprite[i]) {
                        this.spriteData[index] = JSON.parse(JSON.stringify(this.copiedSprite[i]));
                    }
                });
                spriteCanvas.loadSprite(this.getSpriteData(this.getExpandedSelection()));
            } else {
                this.spriteData[this.selectedSprite] = JSON.parse(JSON.stringify(this.copiedSprite));
                spriteCanvas.loadSprite(this.getSpriteData(this.selectedSprite));
            }
            this.saveSpriteSheetDebounced();
        } else {
            console.log("Ingen sprite att klistra in!");
        }
    }

    expandSelection() {
        this.selectionExpanded = !this.selectionExpanded;
    }

    onClick(mouseX, mouseY, event) {
        if (event.type === 'mousedown') {
            this.isSelecting = true;
        }

        if (event.type === 'mouseup') {
            this.isSelecting = false;
        }
        if (this.isSelecting) {
            const spriteSize = this.width / NUMBER_OF_COLS; // NUMBER_OF_COLS sprites per rad
            let gridX = Math.floor((mouseX - this.x) / spriteSize);
            let gridY = Math.floor((mouseY - this.y) / spriteSize);
            if (this.selectionExpanded) {
                // sprite index should always be the top left sprite even if the sprite below or to the right is selected
                gridX = Math.min(gridX, NUMBER_OF_COLS - 1);
                gridY = Math.min(gridY, Math.floor(this.spriteData.length / NUMBER_OF_COLS) - 1);
            }
            let spriteIndex = gridY * NUMBER_OF_COLS + gridX;
            //if spriteIndex is on the fourth row, set it to one row up
            if (gridY === 3 && this.selectionExpanded) {
                spriteIndex -= NUMBER_OF_COLS;
            }
            spriteIndex = spriteIndex + this.spriteSheetIndex * SPRITE_SIZE * SPRITE_SIZE;
            this.selectedSprite = spriteIndex; // Uppdatera vald sprite
            if (this.selectionExpanded) {
                //Return an array of indexes, spriteIndex, the sprite to the right, below and the one to the right and below
                return [spriteIndex, spriteIndex + 1, spriteIndex + NUMBER_OF_COLS, spriteIndex + NUMBER_OF_COLS + 1];
            }
            return spriteIndex; // Returnera den valda sprite-datan

        }
    }

    draw(renderer) {
        if (!this.spriteData || this.spriteData.length === 0) {
            this.populateSpriteDataWithEmptySprites();
            console.warn("Sprite data is empty, initializing with empty sprites.");
            this.saveSpriteSheetDebounced(); // Save the initialized empty sprite data
            return;
        }
        const spriteSize = this.width / NUMBER_OF_COLS; // NUMBER_OF_COLS sprites per rad
        for (let i = 0; i < this.spriteData.length / 2; i++) {
            let x = (i % NUMBER_OF_COLS) * spriteSize + this.x;
            let y = Math.floor(i / NUMBER_OF_COLS) * spriteSize + this.y;

            let spriteIndex = this.spriteSheetIndex * SPRITE_SIZE * SPRITE_SIZE + i;

            // Rita varje sprite genom att iterera över dess 8x8-pixlar
            for (let py = 0; py < SPRITE_SIZE; py++) {
                for (let px = 0; px < SPRITE_SIZE; px++) {
                    if (this.spriteData[spriteIndex] && this.spriteData[spriteIndex][py] && this.spriteData[spriteIndex][py][px] !== undefined) {
                        let pixel = this.spriteData[spriteIndex][py][px];
                        let color = COLOR_PALETTE[pixel] || [0.1, 0.1, 0.1];
                        renderer.drawRect(
                            x + px * SCALE, y + py * SCALE, SCALE, SCALE, color);
                    }
                }
            }
        }

        // Markera vald sprite
        let indexAdjusted = this.selectedSprite - this.spriteSheetIndex * SPRITE_SIZE * SPRITE_SIZE;
        if (indexAdjusted < 0) indexAdjusted = 0; // Justera index om det är negativt
        if (indexAdjusted > SPRITE_SIZE * SPRITE_SIZE - 1) indexAdjusted = SPRITE_SIZE * SPRITE_SIZE - 1; // Justera index om det är för stort

        if (this.selectionExpanded) {
            const selectedX = (indexAdjusted % NUMBER_OF_COLS) * spriteSize + this.x;
            const selectedY = Math.floor(indexAdjusted / NUMBER_OF_COLS) * spriteSize + this.y;
            renderer.drawLinedRect(selectedX, selectedY, spriteSize * 2, spriteSize * 2, [1, 1, 1]); // Vit ram för expanderat urval
        } else {
            let selectedX = (indexAdjusted % NUMBER_OF_COLS) * spriteSize + this.x;
            let selectedY = Math.floor(indexAdjusted / NUMBER_OF_COLS) * spriteSize + this.y;
            renderer.drawLinedRect(selectedX, selectedY, spriteSize, spriteSize, [1, 1, 1]); // Vit ram
        }
    }

    deleteCurrentSprite() {
        if (this.spriteData.length > 0) {
            if (this.selectionExpanded) {
                const selectedSprites = this.getExpandedSelection();
                selectedSprites.forEach(spriteIndex => {
                    this.spriteData[spriteIndex] = Array(SPRITE_SIZE).fill().map(() => Array(SPRITE_SIZE).fill(255));
                });
            } else {
                this.spriteData[this.selectedSprite] = Array(SPRITE_SIZE).fill().map(() => Array(SPRITE_SIZE).fill(255));
            }
            this.saveSpriteSheetDebounced();
            return this.selectedSprite; // Return the index of the deleted sprite
        }
    }

    flipHorizontal() {
        if (this.selectionExpanded) {
            const selectedSprites = this.getExpandedSelection();
            const sprites = selectedSprites.map(index => this.spriteData[index]);

            // Flip each sprite horizontally
            sprites.forEach(sprite => {
                sprite.forEach(row => row.reverse());
            });

            // Swap left and right sprites
            [this.spriteData[selectedSprites[0]], this.spriteData[selectedSprites[1]]] = [sprites[1], sprites[0]];
            [this.spriteData[selectedSprites[2]], this.spriteData[selectedSprites[3]]] = [sprites[3], sprites[2]];
        } else {
            const currentSprite = this.spriteData[this.selectedSprite];
            for (let row = 0; row < SPRITE_SIZE; row++) {
                currentSprite[row].reverse(); // Flip each row horizontally
            }
        }
        this.saveSpriteSheetDebounced();
        return this.selectedSprite; // Return the index of the flipped sprite
    }
    rotateSprite() {
        if (this.selectionExpanded) {
            const selectedSprites = this.getExpandedSelection();
            const sprites = selectedSprites.map(index => this.spriteData[index]);

            // Combine the 4 sprites into one 16x16 sprite
            const combinedSprite = Array(SPRITE_SIZE * 2).fill().map(() => Array(SPRITE_SIZE * 2).fill(255));
            for (let y = 0; y < SPRITE_SIZE; y++) {
                for (let x = 0; x < SPRITE_SIZE; x++) {
                    combinedSprite[y][x] = sprites[0][y][x];
                    combinedSprite[y][x + SPRITE_SIZE] = sprites[1][y][x];
                    combinedSprite[y + SPRITE_SIZE][x] = sprites[2][y][x];
                    combinedSprite[y + SPRITE_SIZE][x + SPRITE_SIZE] = sprites[3][y][x];
                }
            }

            // Rotate the combined sprite
            const rotatedSprite = Array(SPRITE_SIZE * 2).fill().map(() => Array(SPRITE_SIZE * 2).fill(255));
            for (let y = 0; y < SPRITE_SIZE * 2; y++) {
                for (let x = 0; x < SPRITE_SIZE * 2; x++) {
                    rotatedSprite[x][SPRITE_SIZE * 2 - 1 - y] = combinedSprite[y][x];
                }
            }

            // Split the rotated sprite back into 4 sprites
            for (let y = 0; y < SPRITE_SIZE; y++) {
                for (let x = 0; x < SPRITE_SIZE; x++) {
                    sprites[0][y][x] = rotatedSprite[y][x];
                    sprites[1][y][x] = rotatedSprite[y][x + SPRITE_SIZE];
                    sprites[2][y][x] = rotatedSprite[y + SPRITE_SIZE][x];
                    sprites[3][y][x] = rotatedSprite[y + SPRITE_SIZE][x + SPRITE_SIZE];
                }
            }

            // Update the sprite data
            selectedSprites.forEach((index, i) => {
                this.spriteData[index] = sprites[i];
            });
        } else {
            const currentSprite = this.spriteData[this.selectedSprite];
            const rotatedSprite = Array(SPRITE_SIZE).fill().map(() => Array(SPRITE_SIZE).fill(255));
            for (let y = 0; y < SPRITE_SIZE; y++) {
                for (let x = 0; x < SPRITE_SIZE; x++) {
                    rotatedSprite[x][SPRITE_SIZE - 1 - y] = currentSprite[y][x];
                }
            }
            this.spriteData[this.selectedSprite] = rotatedSprite;
        }
        this.saveSpriteSheetDebounced();
        return this.selectedSprite; // Return the index of the rotated sprite
    }

    reloadSpriteData() {
        this.spriteData = loadSpriteSheet() || Array.from({ length: 64 }, () => Array(SPRITE_SIZE).fill(null));
    }

    saveSpriteSheetDebounced() {
        clearTimeout(this.saveTimeout); // Rensa eventuell tidigare timer
        this.saveTimeout = setTimeout(() => {
            saveSpriteSheet(this.spriteData);
        }, 500); // Vänta 500ms innan sparning
    }

    getExpandedSelection() {
        if (this.selectionExpanded) {
            // Return an array of indexes, spriteIndex, the sprite to the right, below and the one to the right and below
            return [
                this.selectedSprite,
                this.selectedSprite + 1,
                this.selectedSprite + NUMBER_OF_COLS,
                this.selectedSprite + NUMBER_OF_COLS + 1
            ];
        }
    }

    setSpriteSheetIndex(index) {
        this.spriteSheetIndex = index;
        //check if spritedata is sprite size * sprite size, if so, add populateSpriteDataWithEmptySprites to spriteData
        if (this.spriteData.length === SPRITE_SIZE * SPRITE_SIZE) {
            this.spriteData = this.spriteData.concat(this.populateSpriteDataWithEmptySprites());
        }

    }

    getSpriteData(spriteIndex) {

        if (this.selectionExpanded) {
            //check if sprite index is an array, if so set tl = spriteIndex[0], tr = spriteIndex[1], bl = spriteIndex[2] and br = spriteIndex[3]
            let tl, tr, bl, br;
            if (Array.isArray(spriteIndex)) {
                tl = this.spriteData[spriteIndex[0]]; // Top-left sprite
                tr = this.spriteData[spriteIndex[1]]; // Top-right sprite
                bl = this.spriteData[spriteIndex[2]]; // Bottom-left sprite
                br = this.spriteData[spriteIndex[3]]; // Bottom-right sprite
            } else {
                tl = this.spriteData[spriteIndex]; // Top-left sprite
                tr = this.spriteData[spriteIndex + 1]; // Top-right sprite
                bl = this.spriteData[spriteIndex + NUMBER_OF_COLS];
                br = this.spriteData[spriteIndex + NUMBER_OF_COLS + 1]; // Bottom-right sprite
            }
            const spriteData = [];
            for (let y = 0; y < 16; y++) {
                spriteData[y] = [];
                for (let x = 0; x < 16; x++) {
                    if (x < 8 && y < 8) {
                        spriteData[y][x] = tl[y][x]; // Top-left
                    } else if (x >= 8 && y < 8) {
                        spriteData[y][x] = tr[y][x - 8]; // Top-right
                    } else if (x < 8 && y >= 8) {
                        spriteData[y][x] = bl[y - 8][x]; // Bottom-left
                    } else {
                        spriteData[y][x] = br[y - 8][x - 8]; // Bottom-right
                    }
                }
            }
            return spriteData;
        }
        const spriteData = this.spriteData[spriteIndex];
        return spriteData;
    }
}


export default SpriteSheet;

export const reformatSpriteData = (spriteData) => {
    //if null set it to 255
    return spriteData.map(sprite => {
        return sprite.map(row => {
            return row.map(pixel => {
                return pixel === null ? 255 : pixel;
            });
        });
    });
};