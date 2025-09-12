// fillUtils.js
export function floodFill2D({
    startX,
    startY,
    getValue,
    setValue,
    matchValue,
    maxWidth,
    maxHeight,
}) {
    if (matchValue == null) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        if (x < 0 || y < 0 || x >= maxWidth || y >= maxHeight) continue;
        if (getValue(x, y) !== matchValue) continue;

        setValue(x, y);

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }
}
