# Basement Cat Ascends

My entry for the [js13kGames 2025](https://js13kgames.com) competition.  
Theme: **Black Cat**

---

## Playable version
The actual game is in the [`index.html`](./index.html) file.  
This is the standalone build that was zipped into the ≤13 KB package submitted to the competition. I used advzip to do additional compression of the zip file.

To play locally, simply open `index.html` in a modern browser.

---

## Source code
This repository contains two parts:

1. **Game source (this folder)**  
   - The game logic, levels, assets (compressed into JavaScript arrays), and build artifacts.  
   - The playable entry is just a single HTML file, but the readable version here uses descriptive variable names and is easier to follow.

2. **Engine: Pico-JS (in `/pico-js/`)**  
   - A small JavaScript engine inspired by [PICO-8](https://www.lexaloffle.com/pico-8.php).  
   - This is a work-in-progress editor and runtime I built... just to try it out. Turns out my son likes playing with it so I kept building it. The version here is incomplete and modified for the js13kGames competition.
   - It includes the sprite/tilemap/collision system used by *Basement Cat Ascends*.  
   - The tilemap, and sprites are included as .json in the `/assets/` folder. You can import these in the editor by clicking the bottom right icon (white square) in either the sprite editor or the map editor and select the corresponding .json file.

The engine is **not required** to play the submitted game, but is included here for transparency, as required by the competition rules.

---

## Building
The entry does not require a build step – the final HTML is already included. But if you want to build it just click the folder icon in the top bar, third from the right and the files should be downloaded as a zip file.  

To run the editor locally, do the following:

```bash
cd pico-js
npm install
npm run dev
# open the editor in your browser or run the dev server (if configured)
