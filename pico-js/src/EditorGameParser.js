import { COLOR_PALETTE } from "./config/colors.js";
import { loadCollisionLayer } from "./tools/localStorageHandler.js";
import { SCALE, SPRITE_TRUE_SIZE } from "./config/constants.js";
import { INPUT_MAP } from "./config/input_map.js";
import GameParser from "./GameParser.js";

class EditorGameParser extends GameParser {
    constructor(code, renderer) {
        super(code, renderer, COLOR_PALETTE, SCALE, SPRITE_TRUE_SIZE, INPUT_MAP, loadCollisionLayer());
    }
}

export default EditorGameParser;

