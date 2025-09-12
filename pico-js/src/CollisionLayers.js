import UIElement from "./UIElement";
import { SPRITE_TRUE_SIZE, SCALE } from "./config/constants";
import { loadCollisionLayerMap, saveCollisionLayerMap } from "./tools/localStorageHandler";
import { decodeFlags, encodeFlags } from "./tools/bitmapTools";
import { COLOR_PALETTE } from "./config/colors";

class CollisionLayer extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.tileIndex = 0;
        this.collisionLayerMap = loadCollisionLayerMap();
        this.collisionLayers = this.decodeCollisionLayerData();
    }

    draw(renderer) {
        renderer.drawText(`Bitmap layer: ${encodeFlags(this.collisionLayers)}`, this.x / SCALE, this.y / SCALE, 5, { scale: 0.25 });
        for (let x = 0; x < 7; x++) {
            if (this.collisionLayers.includes(x + 1)) {
                renderer.drawRect(this.x + x * (SPRITE_TRUE_SIZE / 2 + SCALE / 2), this.y + SPRITE_TRUE_SIZE / 2, SPRITE_TRUE_SIZE / 2, SPRITE_TRUE_SIZE / 2, COLOR_PALETTE[5]);
            } else {
                renderer.drawLinedRect(this.x + x * (SPRITE_TRUE_SIZE / 2 + SCALE / 2), this.y + SPRITE_TRUE_SIZE / 2, SPRITE_TRUE_SIZE / 2, SPRITE_TRUE_SIZE / 2, COLOR_PALETTE[5]);
            }
        }
    }

    handleClick(x, y) {
        const col = Math.floor((x - this.x) / (SPRITE_TRUE_SIZE / 2 + SCALE / 2));
        if (col >= 0 && col < 8) {
            // this.collisionLayers[col] = !this.collisionLayers[col];
            this.updateCollisionLayer(col);
        }
    }

    setTileIndex(index) {
        this.tileIndex = index;
        this.collisionLayers = this.decodeCollisionLayerData();
    }

    updateCollisionLayer(col) {
        //check if col + 1 is in the collisionLayers, if so remove, else add
        if (this.collisionLayers.includes(col + 1)) {
            this.collisionLayers = this.collisionLayers.filter(layer => layer !== col + 1);
        } else {
            this.collisionLayers.push(col + 1);
        }
        let mapEncoded = encodeFlags(this.collisionLayers);
        this.collisionLayerMap[this.tileIndex] = mapEncoded;
        saveCollisionLayerMap(this.collisionLayerMap);
    }

    decodeCollisionLayerData() {
        return decodeFlags(this.collisionLayerMap[this.tileIndex] || 0);
    }
}

export default CollisionLayer;