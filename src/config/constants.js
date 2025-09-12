export const SPRITE_SIZE = 8; // Size of each sprite in pixels
export const SCALE = 8; // Scale factor for the canvas rendering
export const SPRITE_TRUE_SIZE = SPRITE_SIZE * SCALE; // True size of each sprite in pixels (for rendering)  
export const NUMBER_OF_COLS = 16; // Number of columns in the sprite sheet
export const NUMBER_OF_ROWS = 16; // Number of rows in the sprite sheet
export const SPRITE_SHEET_WIDTH = SPRITE_SIZE * NUMBER_OF_COLS; // Width of the sprite sheet in pixels
export const CANVAS_WIDTH = SPRITE_TRUE_SIZE * NUMBER_OF_COLS; // Width of the canvas in pixels
export const COL_SIZE = CANVAS_WIDTH / NUMBER_OF_COLS; // Size of each column in the canvas
export const EXPORT_CONSTANTS = {
    SPRITE_SIZE,
    SCALE,
    NUMBER_OF_COLS
};
