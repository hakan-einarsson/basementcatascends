import UIElement from "./UIElement";
import { SCALE } from "./config/constants";

class ValueStepperUI extends UIElement {
    constructor(x, y, width, height, {
        value = 0,
        min = 0,
        max = 999,
        step = 1,
        textWidth = 40,
        formatter = (v) => v.toString(),
        onChange = () => { }
    } = {}) {
        super(x, y, width, height);
        this.value = value;
        this.min = min;
        this.max = max;
        this.step = step;
        this.textWidth = textWidth;
        this.formatter = formatter;
        this.onChange = onChange;
    }

    draw(renderer) {
        // Rita bakgrund
        renderer.drawRect(this.x, this.y, this.width, this.height, [0.2, 0.2, 0.2]);

        // Dela upp i tre delar: [-] [text] [+]
        const btnWidth = (this.width - this.textWidth) / 2;

        // Minus
        renderer.drawRect(this.x, this.y, btnWidth, this.height, [0.3, 0.3, 0.3]);
        renderer.drawText("-", this.x / SCALE + btnWidth / SCALE / 3.5, this.y / SCALE + 1.5, 7, { scale: 0.5 });
        // Text
        renderer.drawRect(this.x + btnWidth, this.y, this.textWidth, this.height, [0.1, 0.1, 0.1]);
        renderer.drawText(this.formatter(this.value), this.x / SCALE + btnWidth / SCALE + 1, this.y / SCALE + 1.5, 7, { scale: 0.5 });

        // Plus
        renderer.drawRect(this.x + btnWidth + this.textWidth, this.y, btnWidth, this.height, [0.3, 0.3, 0.3]);
        renderer.drawText("+", this.x / SCALE + this.width / SCALE - btnWidth / SCALE / 1.33, this.y / SCALE + 1.5, 7, { scale: 0.5 });
    }

    handleClick(mouseX, mouseY, event) {
        const btnWidth = (this.width - this.textWidth) / 2;
        if (mouseX < this.x + btnWidth) {
            this.setValue(this.value - this.step); // klick på minus
        } else if (mouseX > this.x + btnWidth + this.textWidth) {
            this.setValue(this.value + this.step); // klick på plus
        }
    }

    setValue(value) {
        const newValue = Math.min(this.max, Math.max(this.min, value));
        if (newValue !== this.value) {
            this.value = newValue;
            this.onChange(newValue);
        }
    }
}

export default ValueStepperUI;
