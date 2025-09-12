export const COLOR_PALETTE = [
    [0, 0, 0],        // 0  - Black
    [0.114, 0.169, 0.326],  // 1  - Dark Blue
    [0.475, 0.224, 0.506],  // 2  - Dark Purple
    [0, 0.667, 0.278],  // 3  - Dark Green
    [0.796, 0.251, 0.161],  // 5  - Dark Red
    [0.275, 0.275, 0.275],  // 13 - Dark Gray
    [0.667, 0.667, 0.667],  // 14 - Light Gray
    [1.0, 1.0, 1.0],  // 15 - White
    [1.0, 0.0, 0.263],  // 6  - Red
    [1.0, 0.635, 0.0],  // 7  - Orange
    [1.0, 0.988, 0.0],  // 8  - Yellow
    [0.0, 0.933, 0.255],  // 9  - Green
    [0.0, 0.745, 1.0],  // 10 - Blue
    [0.392, 0.608, 0.922],  // 11 - Lavender
    [1.0, 0.506, 0.98],  // 12 - Pink
    [0.949, 0.667, 0.263],  // 4  - Brown
];

export function convertColorToIndex(color) {
    // Convert RGB color to index in COLOR_PALETTE
    for (let i = 0; i < COLOR_PALETTE.length; i++) {
        if (COLOR_PALETTE[i][0] === color[0] && COLOR_PALETTE[i][1] === color[1] && COLOR_PALETTE[i][2] === color[2]) {
            return i;
        }
    }
    return -1; // Return -1 if color not found
}