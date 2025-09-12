import UIElement from "./UIElement";
import { loadCode, saveCode } from "./tools/localStorageHandler";

class CodeEditorUI extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.backgroundColor = [0.1137, 0.1686, 0.3255];
        this.textArea = this.createTextArea();
        this.saveTimeout = null;
        const appElement = document.getElementById('app');
        appElement.appendChild(this.textArea);
    }

    init() {
        const code = loadCode();
        this.textArea.value = code;
    }

    draw(renderer) {
        renderer.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor);
    }

    saveCodeToLocalStorage() {
        const code = document.getElementById("code-editor").value;
        localStorage.setItem("userCode", code);
    }

    createTextArea() {
        const textarea = document.createElement('textarea');
        textarea.id = 'code-editor';
        textarea.style.position = 'absolute';
        textarea.style.left = '64px';
        textarea.style.top = '0';
        textarea.style.width = '512px';
        textarea.style.height = '512px';
        textarea.style.display = 'none';
        textarea.style.background = '#1d2b53';
        textarea.style.color = 'white';
        textarea.style.fontFamily = '"Courier New", monospace';
        textarea.style.lineHeight = '1.2';
        textarea.style.fontSize = '12px';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.padding = '4px';
        textarea.style.resize = 'none';

        textarea.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();

                const start = this.selectionStart;
                const end = this.selectionEnd;

                // Sätt in en tab på aktuell plats
                const indent = '    '; // 4 spaces for tab
                this.value = this.value.substring(0, start) + indent + this.value.substring(end);

                // Flytta caret
                this.selectionStart = this.selectionEnd = start + 1;
            }
        });

        textarea.addEventListener('input', () => {
            this.saveCodeDebounced();
        });

        return textarea;
    }

    saveCodeDebounced() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            saveCode(this.textArea.value);
        }, 500); // Delay of 500ms
    }


}
export default CodeEditorUI;