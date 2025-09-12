const scaleCanvas = () => {
    const container = document.getElementById("app");
    const canvas = document.querySelector("canvas");

    // Hämta container-storlek
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Beräkna skalfaktor baserat på kortaste sidan
    const scale = Math.floor(Math.min(containerWidth / 128, containerHeight / 128));

    // Sätt ny storlek på canvas
    canvas.style.width = `${128 * scale}px`;
    canvas.style.height = `${128 * scale}px`;
    const canvasBounds = canvas.getBoundingClientRect();

    const textArea = document.getElementById("code-editor");
    if (textArea) {
        textArea.style.left = `${canvasBounds.left + scale}px`; // Justera positionen baserat på skalan
        textArea.style.top = `${canvasBounds.top + 8 * scale + scale}px`;
        textArea.style.width = `${canvasBounds.width - 3.2 * scale}px`;
        textArea.style.height = `${canvasBounds.height - 16 * scale - 3.2 * scale}px`;
    }

    const gameViewCanvas = document.getElementById("game-view-canvas");
    if (gameViewCanvas) {
        gameViewCanvas.style.left = `${canvasBounds.left}px`;
        gameViewCanvas.style.top = `${canvasBounds.top + 8 * scale}px`;
        gameViewCanvas.style.width = `${canvasBounds.width - 0.5 * scale + 1}px`;
        gameViewCanvas.style.height = `${canvasBounds.height - 16 * scale}px`;
    }
}

export default scaleCanvas;