# Eggplant Intelligence

Think carefully. Discover wisely.

Eggplant Intelligence is a browser puzzle in the style of Sudoku and logic grids. Each level hides eggplants on a colored board. Nothing is shown at the start. You find them by deduction.

## Play

Open `index.html` in a browser. The game has no build step, no server, and no external libraries.

## Rules

Every level follows the same rules:

- Each row contains exactly one eggplant.
- Each column contains exactly one eggplant.
- Each colored region contains exactly one eggplant.
- Eggplants cannot touch, even diagonally.
- Every level starts with 3 lives.
- Each level has one valid solution.

## Controls

- Click or tap once to mark a cell with ×. This is only a note. It does not reveal the cell, score a point, or cost a life. Click the cell again to remove the mark.
- Double-click or double-tap to uncover a cell. An eggplant scores 1 point. An empty cell costs 1 life.
- A marked cell can still be uncovered. The × is removed and the real result is shown.

## Levels

| Level | Name | Difficulty | Board |
| --- | --- | --- | --- |
| 1 | The Beginning | Easy | 5×5 |
| 2 | The Challenge | Medium | 6×6 |
| 3 | The Expert | Expert | 8×8 |
| 4 | Level 4 | Hard | 7×7 |

Level 1 is unlocked at the start. Finishing a level unlocks the next one. Losing all 3 lives does not. Cleared levels can be replayed.

Progress is stored in the browser under the key `eggplant-intelligence-progress-v1`, so unlocked and cleared levels remain after a refresh.

## Files

- `index.html` — page structure
- `style.css` — layout, colors, and motion
- `script.js` — rules, levels, and game flow
- `how-to-win.md` — spoiler walkthrough for every level

The eggplant graphic is the `🍆` character, drawn in one place in `script.js` (`EggplantArt.create`) so it can later be swapped for an SVG.
