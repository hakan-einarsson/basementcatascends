import './style.css'
import EditorRenderer from './EditorRenderer.js';
import scaleCanvas from './tools/scaleCanvas.js';
import EditorUI from './EditorUi.js';
import { CANVAS_WIDTH, COL_SIZE } from "./config/constants";

const handleClick = (x, y, e) => {
  const scale = Number(canvas.clientHeight) / CANVAS_WIDTH;
  const adjustedX = Math.ceil(x / scale);
  const adjustedY = Math.ceil(y / scale);
  editorUI.handleClick(adjustedX, adjustedY, e);

}

const handleClickGlobal = (e) => {
  const rect = canvas.getBoundingClientRect();
  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (!inside) {
    editorUI.handleClickGlobal(e);
  }
}

const canvas = document.createElement('canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_WIDTH;
canvas.style.imageRendering = "pixelated";
const appElement = document.getElementById('app');
appElement.appendChild(canvas);

const renderer = new EditorRenderer(canvas);
const editorUI = new EditorUI(0, COL_SIZE, CANVAS_WIDTH, COL_SIZE * 14, renderer);
window.addEventListener('resize', scaleCanvas);
window.addEventListener('mouseup', (e) => handleClickGlobal(e));
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mousedown', (e) => { handleClick(e.offsetX, e.offsetY, e); e.preventDefault(); });
canvas.addEventListener('mouseup', (e) => handleClick(e.offsetX, e.offsetY, e));
canvas.addEventListener('mousemove', (e) => handleClick(e.offsetX, e.offsetY, e));
canvas.addEventListener('wheel', (e) => { handleClick(e.offsetX, e.offsetY, e); e.preventDefault(); });
window.addEventListener('keydown', (e) => {
  editorUI.handleKeyDown(e);
});
window.addEventListener('keyup', (e) => {
  editorUI.handleKeyUp(e);
});
scaleCanvas();

function gameLoop() {
  renderer.clearDrawQueue();
  editorUI.draw(renderer);
  renderer.render();
  requestAnimationFrame(gameLoop);
}

gameLoop();



