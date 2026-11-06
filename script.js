/**
 * Eggplant Intelligence
 * A queens-style deduction puzzle. One eggplant per row, column, and region.
 * Eggplants cannot touch, including diagonally.
 *
 * Swap EggplantArt.create() if the emoji should become an SVG later.
 */

const STARTING_LIVES = 3;
const STORAGE_KEY = "eggplant-intelligence-progress-v1";
const MARK_DELAY_MS = 180;
const DOUBLE_WINDOW_MS = 420;

const TONES = [
  { className: "tone-0", rgb: [247, 183, 200] },
  { className: "tone-1", rgb: [246, 212, 139] },
  { className: "tone-2", rgb: [169, 221, 176] },
  { className: "tone-3", rgb: [169, 206, 245] },
  { className: "tone-4", rgb: [216, 194, 246] },
  { className: "tone-5", rgb: [247, 192, 164] },
  { className: "tone-6", rgb: [143, 212, 203] },
  { className: "tone-7", rgb: [239, 224, 138] },
];

const LEVELS = [
  {
    id: 1,
    name: "The Beginning",
    difficulty: "Easy",
    boardSize: 5,
    blurb: "A gentle board. Compare a color with its row and the first eggplants fall into place.",
    regions: [
      [2, 2, 1, 0, 0],
      [2, 2, 1, 0, 3],
      [2, 2, 3, 3, 3],
      [2, 2, 4, 3, 3],
      [2, 4, 4, 4, 3],
    ],
    eggplants: [
      [0, 4],
      [1, 2],
      [2, 0],
      [3, 3],
      [4, 1],
    ],
  },
  {
    id: 2,
    name: "The Challenge",
    difficulty: "Medium",
    boardSize: 6,
    blurb: "The bottom color claims a whole row, then the other shapes start arguing.",
    regions: [
      [1, 1, 0, 0, 0, 3],
      [2, 1, 1, 0, 0, 3],
      [2, 2, 4, 4, 0, 3],
      [5, 5, 4, 4, 3, 3],
      [5, 5, 5, 4, 4, 4],
      [5, 5, 5, 5, 5, 5],
    ],
    eggplants: [
      [0, 4],
      [1, 2],
      [2, 0],
      [3, 5],
      [4, 3],
      [5, 1],
    ],
  },
  {
    id: 3,
    name: "The Expert",
    difficulty: "Expert",
    boardSize: 8,
    blurb: "A wide board. The top band is only the opening move.",
    regions: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 0, 1, 0, 1, 1],
      [0, 2, 2, 0, 1, 1, 1, 3],
      [2, 2, 4, 4, 4, 5, 3, 3],
      [2, 2, 4, 4, 5, 5, 3, 3],
      [2, 4, 4, 5, 5, 5, 3, 6],
      [4, 4, 4, 4, 7, 7, 7, 6],
      [4, 4, 4, 7, 7, 7, 7, 6],
    ],
    eggplants: [
      [0, 0],
      [1, 4],
      [2, 1],
      [3, 6],
      [4, 2],
      [5, 5],
      [6, 7],
      [7, 3],
    ],
  },
  {
    id: 4,
    name: "Level 4",
    difficulty: "Hard",
    boardSize: 7,
    blurb: "A 7×7 board. The right edge gives the first color away.",
    regions: [
      [0, 0, 0, 0, 0, 0, 0],
      [3, 0, 0, 2, 2, 2, 1],
      [3, 0, 0, 2, 2, 2, 1],
      [3, 3, 2, 2, 2, 2, 1],
      [5, 3, 3, 3, 4, 4, 6],
      [5, 3, 3, 4, 4, 4, 6],
      [5, 5, 4, 4, 4, 6, 6],
    ],
    eggplants: [
      [0, 2],
      [1, 6],
      [2, 3],
      [3, 1],
      [4, 4],
      [5, 0],
      [6, 5],
    ],
  },
];

const Icons = {
  use(id, viewBox) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${id}`);
    svg.append(use);
    return svg;
  },
};

const EggplantArt = {
  create() {
    const art = Icons.use("icon-eggplant", "0 0 128 128");
    art.classList.add("eggplant-art");
    return art;
  },
};

const PuzzleValidator = {
  validate(level) {
    const errors = [];
    const { regions, eggplants, boardSize } = level;
    const n = boardSize;

    if (!Array.isArray(regions) || regions.length !== n) {
      errors.push(`${level.name} does not have a ${n}×${n} region map.`);
      return errors;
    }

    for (let row = 0; row < n; row += 1) {
      if (!Array.isArray(regions[row]) || regions[row].length !== n) {
        errors.push(`${level.name} has a jagged row.`);
        return errors;
      }
    }

    if (!this.regionsAreConnected(regions)) {
      errors.push(`${level.name} has a disconnected or misnumbered region.`);
    }

    if (!Array.isArray(eggplants) || eggplants.length !== n) {
      errors.push(`${level.name} must hide exactly ${n} eggplants.`);
      return errors;
    }

    if (!this.placementIsLegal(regions, eggplants)) {
      errors.push(`${level.name} breaks the eggplant placement rules.`);
    }

    const solutions = this.countSolutions(regions, 2);
    if (solutions !== 1) {
      errors.push(`${level.name} has ${solutions} solutions, not one.`);
    }

    return errors;
  },

  regionsAreConnected(regions) {
    const n = regions.length;
    const ids = new Set();
    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) ids.add(regions[row][col]);
    }
    if (ids.size !== n) return false;
    for (let id = 0; id < n; id += 1) {
      if (!ids.has(id)) return false;
    }

    for (let id = 0; id < n; id += 1) {
      const cells = [];
      for (let row = 0; row < n; row += 1) {
        for (let col = 0; col < n; col += 1) {
          if (regions[row][col] === id) cells.push([row, col]);
        }
      }
      if (cells.length === 0) return false;
      const seen = new Set([`${cells[0][0]},${cells[0][1]}`]);
      const stack = [cells[0]];
      while (stack.length) {
        const [row, col] = stack.pop();
        const neighbors = [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1],
        ];
        neighbors.forEach(([nextRow, nextCol]) => {
          if (nextRow < 0 || nextCol < 0 || nextRow >= n || nextCol >= n) return;
          if (regions[nextRow][nextCol] !== id) return;
          const key = `${nextRow},${nextCol}`;
          if (seen.has(key)) return;
          seen.add(key);
          stack.push([nextRow, nextCol]);
        });
      }
      if (seen.size !== cells.length) return false;
    }
    return true;
  },

  placementIsLegal(regions, eggplants) {
    const n = regions.length;
    const rows = new Set();
    const cols = new Set();
    const regionIds = new Set();

    for (let index = 0; index < eggplants.length; index += 1) {
      const [row, col] = eggplants[index];
      if (row < 0 || col < 0 || row >= n || col >= n) return false;
      if (rows.has(row) || cols.has(col)) return false;
      rows.add(row);
      cols.add(col);
      regionIds.add(regions[row][col]);
      for (let other = 0; other < index; other += 1) {
        const [otherRow, otherCol] = eggplants[other];
        const distance = Math.max(Math.abs(row - otherRow), Math.abs(col - otherCol));
        if (distance <= 1) return false;
      }
    }

    return rows.size === n && cols.size === n && regionIds.size === n;
  },

  countSolutions(regions, limit) {
    const n = regions.length;
    let count = 0;
    const usedCols = new Array(n).fill(false);
    const usedRegions = new Array(n).fill(false);

    const search = (row, previousCol) => {
      if (count >= limit) return;
      if (row === n) {
        count += 1;
        return;
      }
      for (let col = 0; col < n; col += 1) {
        if (usedCols[col]) continue;
        if (previousCol !== null && Math.abs(col - previousCol) === 1) continue;
        const regionId = regions[row][col];
        if (usedRegions[regionId]) continue;
        usedCols[col] = true;
        usedRegions[regionId] = true;
        search(row + 1, col);
        usedRegions[regionId] = false;
        usedCols[col] = false;
        if (count >= limit) return;
      }
    };

    search(0, null);
    return count;
  },
};

function assignTones(regions) {
  const n = regions.length;
  const adjacent = Array.from({ length: n }, () => new Set());

  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      const regionId = regions[row][col];
      if (col + 1 < n && regions[row][col + 1] !== regionId) {
        adjacent[regionId].add(regions[row][col + 1]);
        adjacent[regions[row][col + 1]].add(regionId);
      }
      if (row + 1 < n && regions[row + 1][col] !== regionId) {
        adjacent[regionId].add(regions[row + 1][col]);
        adjacent[regions[row + 1][col]].add(regionId);
      }
    }
  }

  const order = [...Array(n).keys()].sort(
    (a, b) => adjacent[b].size - adjacent[a].size,
  );
  const toneOfRegion = new Array(n).fill(-1);
  const used = new Set();

  const distance = (first, second) => {
    const dr = first[0] - second[0];
    const dg = first[1] - second[1];
    const db = first[2] - second[2];
    return dr * dr + dg * dg + db * db;
  };

  order.forEach((regionId) => {
    let bestTone = 0;
    let bestScore = -1;
    TONES.forEach((tone, toneIndex) => {
      if (used.has(toneIndex)) return;
      let score = Infinity;
      adjacent[regionId].forEach((neighbor) => {
        if (toneOfRegion[neighbor] >= 0) {
          score = Math.min(score, distance(tone.rgb, TONES[toneOfRegion[neighbor]].rgb));
        }
      });
      if (score === Infinity) score = 1e9;
      if (score > bestScore) {
        bestScore = score;
        bestTone = toneIndex;
      }
    });
    toneOfRegion[regionId] = bestTone;
    used.add(bestTone);
  });

  return toneOfRegion;
}

class LevelManager {
  constructor() {
    this.completed = new Set();
    this.lastPlayed = 1;
    this.load();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const completed = Array.isArray(saved.completed) ? saved.completed : [];
      completed.forEach((id) => {
        if (LEVELS.some((level) => level.id === id)) this.completed.add(id);
      });
      if (LEVELS.some((level) => level.id === saved.lastPlayed)) {
        this.lastPlayed = saved.lastPlayed;
      }
    } catch {
      this.completed = new Set();
      this.lastPlayed = 1;
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      completed: [...this.completed],
      lastPlayed: this.lastPlayed,
    }));
  }

  isCompleted(id) {
    return this.completed.has(id);
  }

  isUnlocked(id) {
    return id === 1 || this.completed.has(id) || this.completed.has(id - 1);
  }

  highlightedId() {
    if (this.isUnlocked(this.lastPlayed)) return this.lastPlayed;
    const pending = LEVELS.find((level) => this.isUnlocked(level.id) && !this.isCompleted(level.id));
    return pending ? pending.id : 1;
  }

  markCompleted(id) {
    this.completed.add(id);
    this.lastPlayed = id;
    this.save();
  }

  remember(id) {
    this.lastPlayed = id;
    this.save();
  }
}

class BoardManager {
  constructor(boardEl, game) {
    this.boardEl = boardEl;
    this.game = game;
    this.armed = null;
    this.buttons = new Map();
    this.boardEl.addEventListener("click", (event) => this.onClick(event));
    this.boardEl.addEventListener("dblclick", (event) => event.preventDefault());
  }

  render(level, cells) {
    this.cancelGesture(false);
    this.buttons.clear();
    this.boardEl.replaceChildren();
    this.boardEl.style.setProperty("--n", String(level.boardSize));
    this.boardEl.classList.remove("is-locked");

    const tones = assignTones(level.regions);
    const size = level.boardSize;

    cells.forEach((row) => {
      row.forEach((cell) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `cell ${TONES[tones[cell.regionId]].className}`;
        button.dataset.row = String(cell.row);
        button.dataset.col = String(cell.col);
        button.setAttribute("role", "gridcell");

        if (cell.col + 1 === size) button.classList.add("edge-e");
        else if (level.regions[cell.row][cell.col + 1] !== cell.regionId) button.classList.add("sep-e");

        if (cell.row + 1 === size) button.classList.add("edge-s");
        else if (level.regions[cell.row + 1][cell.col] !== cell.regionId) button.classList.add("sep-s");

        const mark = document.createElement("span");
        mark.className = "mark";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = "×";

        const slot = document.createElement("span");
        slot.className = "eggplant-slot";

        const dot = document.createElement("span");
        dot.className = "empty-dot";
        dot.setAttribute("aria-hidden", "true");

        button.append(mark, slot, dot);
        button.addEventListener("animationend", (event) => {
          if (event.target !== button) return;
          button.classList.remove("just-found", "just-missed");
        });

        this.paint(button, cell);
        this.buttons.set(this.key(cell.row, cell.col), button);
        this.boardEl.append(button);
      });
    });
  }

  lock() {
    this.cancelGesture(false);
    this.boardEl.classList.add("is-locked");
    this.buttons.forEach((button) => {
      button.disabled = true;
    });
  }

  onClick(event) {
    const button = event.target.closest(".cell");
    if (!button || this.boardEl.classList.contains("is-locked")) return;
    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    if (!this.game.canInteract(row, col)) return;

    if (this.armed && this.armed.row === row && this.armed.col === col) {
      this.cancelGesture(false);
      this.game.uncover(row, col);
      return;
    }

    this.cancelGesture(true);
    this.armed = {
      row,
      col,
      committed: false,
      markTimer: window.setTimeout(() => {
        if (!this.armed || this.armed.row !== row || this.armed.col !== col) return;
        this.armed.committed = true;
        this.game.mark(row, col);
      }, MARK_DELAY_MS),
      expireTimer: window.setTimeout(() => {
        if (this.armed && this.armed.row === row && this.armed.col === col) {
          this.armed = null;
        }
      }, DOUBLE_WINDOW_MS),
    };
  }

  cancelGesture(commitSingle) {
    if (!this.armed) return;
    window.clearTimeout(this.armed.markTimer);
    window.clearTimeout(this.armed.expireTimer);
    const gesture = this.armed;
    this.armed = null;
    if (commitSingle && !gesture.committed) this.game.mark(gesture.row, gesture.col);
  }

  updateCell(cell, effect) {
    const button = this.buttons.get(this.key(cell.row, cell.col));
    if (!button) return;
    this.paint(button, cell, effect);
  }

  paint(button, cell, effect) {
    button.classList.toggle("is-marked", cell.marked && !cell.revealed);
    button.classList.toggle("is-eggplant", cell.revealed && cell.hasEggplant);
    button.classList.toggle("is-empty", cell.revealed && !cell.hasEggplant);
    button.setAttribute("aria-label", this.label(cell));

    if (cell.revealed && cell.hasEggplant) {
      const slot = button.querySelector(".eggplant-slot");
      if (!slot.firstChild) slot.append(EggplantArt.create());
    }

    if (effect === "found") {
      button.classList.add("just-found");
      this.floater(button, "+1", "floater-good");
    }
    if (effect === "miss") {
      button.classList.add("just-missed");
      this.floater(button, "−1", "floater-bad");
    }
  }

  floater(button, text, className) {
    const floater = document.createElement("span");
    floater.className = `floater ${className}`;
    floater.setAttribute("aria-hidden", "true");
    floater.textContent = text;
    button.append(floater);
    floater.addEventListener("animationend", () => floater.remove());
  }

  label(cell) {
    const place = `Row ${cell.row + 1}, column ${cell.col + 1}`;
    if (cell.revealed && cell.hasEggplant) return `${place}. Eggplant found.`;
    if (cell.revealed) return `${place}. Empty.`;
    if (cell.marked) return `${place}. Marked with an X.`;
    return `${place}. Covered.`;
  }

  key(row, col) {
    return `${row},${col}`;
  }
}

class UIManager {
  constructor() {
    this.selectScreen = document.querySelector("#select-screen");
    this.gameScreen = document.querySelector("#game-screen");
    this.levelList = document.querySelector("#level-list");
    this.levelNav = document.querySelector("#level-nav");
    this.boardEl = document.querySelector("#board");
    this.toastEl = document.querySelector("#toast");
    this.liveRegion = document.querySelector("#live-region");
    this.livesEl = document.querySelector("#hud-lives");
    this.helpOverlay = document.querySelector("#help-overlay");
    this.victoryOverlay = document.querySelector("#victory-overlay");
    this.defeatOverlay = document.querySelector("#defeat-overlay");
    this.toastTimer = 0;
    this.helpWasFocused = null;

    document.querySelector("#help-button").addEventListener("click", () => this.openHelp());
    document.querySelector("#help-close").addEventListener("click", () => this.closeHelp());
    this.helpOverlay.addEventListener("click", (event) => {
      if (event.target === this.helpOverlay) this.closeHelp();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.helpOverlay.hidden) this.closeHelp();
    });
  }

  showSelect(levels, game) {
    this.closeOverlays();
    this.selectScreen.hidden = false;
    this.gameScreen.hidden = true;
    this.renderLevelSelect(levels, game);
  }

  showGame() {
    this.selectScreen.hidden = true;
    this.gameScreen.hidden = false;
  }

  renderLevelSelect(levelManager, game) {
    const highlight = levelManager.highlightedId();
    this.levelList.replaceChildren();

    LEVELS.forEach((level) => {
      const unlocked = levelManager.isUnlocked(level.id);
      const completed = levelManager.isCompleted(level.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card";
      if (!unlocked) card.classList.add("is-locked");
      if (completed) card.classList.add("is-complete");
      if (level.id === highlight) card.classList.add("is-current");

      const preview = document.createElement("div");
      preview.className = "mini-board";
      preview.setAttribute("aria-hidden", "true");
      preview.style.gridTemplateColumns = `repeat(${level.boardSize}, 1fr)`;
      const tones = assignTones(level.regions);
      level.regions.forEach((row) => {
        row.forEach((regionId) => {
          const swatch = document.createElement("span");
          swatch.className = `mini-cell ${TONES[tones[regionId]].className}`;
          preview.append(swatch);
        });
      });

      const body = document.createElement("div");
      body.className = "level-card-body";
      const kicker = document.createElement("div");
      kicker.className = "level-kicker";
      kicker.append(this.pill(`Level ${level.id}`));
      kicker.append(this.pill(level.difficulty));
      if (completed) kicker.append(this.pill("Cleared", "pill-good"));
      if (!unlocked) kicker.append(this.pill("Locked", "pill-lock"));

      const title = document.createElement("h3");
      title.textContent = level.name;
      const meta = document.createElement("p");
      meta.className = "level-meta";
      meta.textContent = `${level.boardSize}×${level.boardSize} · ${level.boardSize} eggplants · 3 lives`;
      const blurb = document.createElement("p");
      blurb.className = "level-meta";
      blurb.textContent = level.blurb;

      body.append(kicker, title, meta, blurb);
      card.append(preview, body);
      card.addEventListener("click", () => {
        if (!unlocked) {
          const previous = LEVELS.find((item) => item.id === level.id - 1);
          this.toast(`Complete ${previous.name} to unlock this puzzle.`);
          this.announce(`Complete ${previous.name} to unlock ${level.name}.`);
          return;
        }
        game.startLevel(level.id);
      });
      this.levelList.append(card);
    });
  }

  renderLevelNav(levelManager, game, activeId) {
    this.levelNav.replaceChildren();
    LEVELS.forEach((level) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nav-level";
      button.textContent = String(level.id);
      const unlocked = levelManager.isUnlocked(level.id);
      if (level.id === activeId) button.classList.add("is-current");
      if (levelManager.isCompleted(level.id)) button.classList.add("is-done");
      if (!unlocked) button.classList.add("is-locked");
      button.setAttribute("aria-label", `${level.name}${unlocked ? "" : ", locked"}`);
      button.addEventListener("click", () => {
        if (!unlocked) {
          const previous = LEVELS.find((item) => item.id === level.id - 1);
          this.toast(`Complete ${previous.name} to unlock this puzzle.`);
          return;
        }
        if (level.id !== activeId) game.startLevel(level.id);
      });
      this.levelNav.append(button);
    });
  }

  updateHud(game, options = {}) {
    const level = game.level;
    document.querySelector("#hud-level").textContent = `${level.id} · ${level.name}`;
    document.querySelector("#hud-difficulty").textContent = level.difficulty;
    document.querySelector("#hud-score").textContent = String(game.score);
    document.querySelector("#hud-found").textContent = `${game.found} / ${level.boardSize}`;
    this.renderLives(game.lives, Boolean(options.lostHeart));
  }

  renderLives(lives, justLost) {
    this.livesEl.replaceChildren();
    this.livesEl.setAttribute("aria-label", `${lives} lives remaining`);
    if (justLost) {
      this.livesEl.classList.remove("is-shaking");
      window.requestAnimationFrame(() => this.livesEl.classList.add("is-shaking"));
    }
    for (let index = 0; index < STARTING_LIVES; index += 1) {
      const heart = document.createElement("span");
      heart.className = "heart";
      heart.append(Icons.use("icon-heart", "0 0 128 128"));
      if (index >= lives) heart.classList.add("is-spent");
      if (justLost && index === lives) heart.classList.add("is-breaking");
      this.livesEl.append(heart);
    }
  }

  toast(message) {
    window.clearTimeout(this.toastTimer);
    this.toastEl.textContent = message;
    this.toastEl.classList.add("is-shown");
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.textContent = "";
      this.toastEl.classList.remove("is-shown");
    }, 2400);
  }

  clearToast() {
    window.clearTimeout(this.toastTimer);
    this.toastEl.textContent = "";
    this.toastEl.classList.remove("is-shown");
  }

  announce(message) {
    this.liveRegion.textContent = "";
    window.setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 30);
  }

  openHelp() {
    this.helpWasFocused = document.activeElement;
    this.helpOverlay.hidden = false;
    document.querySelector("#help-close").focus();
  }

  closeHelp() {
    this.helpOverlay.hidden = true;
    if (this.helpWasFocused && typeof this.helpWasFocused.focus === "function") {
      this.helpWasFocused.focus();
    }
  }

  showVictory(game) {
    const next = LEVELS.find((level) => level.id === game.level.id + 1);
    document.querySelector("#victory-copy").textContent = next
      ? `${game.level.name} is complete. ${next.name} is now unlocked.`
      : "Every puzzle is cleared. The garden has no secrets left.";
    document.querySelector("#victory-score").textContent = String(game.score);
    document.querySelector("#victory-lives").textContent = String(game.lives);
    document.querySelector("#victory-found").textContent = `${game.found} / ${game.level.boardSize}`;

    const nextButton = document.querySelector("#victory-next");
    nextButton.hidden = !next;
    if (next) nextButton.textContent = `Next: ${next.name}`;

    this.fillConfetti(this.victoryOverlay.querySelector(".confetti"));
    this.victoryOverlay.hidden = false;
    (next ? nextButton : document.querySelector("#victory-levels")).focus();
    this.announce(`${game.level.name} complete. Score ${game.score}. ${game.lives} lives remaining.`);
  }

  showDefeat(game) {
    document.querySelector("#defeat-copy").textContent = `${game.level.name} is still unsolved. The next level stays locked.`;
    document.querySelector("#defeat-score").textContent = String(game.score);
    document.querySelector("#defeat-found").textContent = `${game.found} / ${game.level.boardSize}`;
    this.defeatOverlay.hidden = false;
    document.querySelector("#defeat-retry").focus();
    this.announce(`No lives left. Score ${game.score}.`);
  }

  closeOverlays() {
    this.victoryOverlay.hidden = true;
    this.defeatOverlay.hidden = true;
    this.victoryOverlay.querySelector(".confetti").replaceChildren();
  }

  fillConfetti(host) {
    host.replaceChildren();
    const pieces = [
      ["icon-eggplant", "0 0 128 128"],
      ["icon-star", "0 0 128 128"],
      ["icon-dot", "0 0 128 128"],
      ["icon-heart", "0 0 128 128"],
    ];
    for (let index = 0; index < 16; index += 1) {
      const [id, viewBox] = pieces[index % pieces.length];
      const piece = document.createElement("span");
      piece.append(Icons.use(id, viewBox));
      piece.style.left = `${6 + (index * 5.7) % 88}%`;
      piece.style.animationDelay = `${(index % 6) * 0.05}s`;
      host.append(piece);
    }
  }

  pill(text, extraClass) {
    const span = document.createElement("span");
    span.className = extraClass ? `pill ${extraClass}` : "pill";
    span.textContent = text;
    return span;
  }
}

class GameManager {
  constructor(ui, levels) {
    this.ui = ui;
    this.levels = levels;
    this.board = new BoardManager(ui.boardEl, this);
    this.level = null;
    this.cells = [];
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.found = 0;
    this.phase = "select";
    this.outcomeTimer = 0;

    document.querySelector("#levels-button").addEventListener("click", () => this.showSelect());
    document.querySelector("#restart-button").addEventListener("click", () => this.restart());
    document.querySelector("#victory-next").addEventListener("click", () => {
      const next = LEVELS.find((level) => level.id === this.level.id + 1);
      if (next) this.startLevel(next.id);
    });
    document.querySelector("#victory-replay").addEventListener("click", () => this.restart());
    document.querySelector("#victory-levels").addEventListener("click", () => this.showSelect());
    document.querySelector("#defeat-retry").addEventListener("click", () => this.restart());
    document.querySelector("#defeat-levels").addEventListener("click", () => this.showSelect());
  }

  showSelect() {
    window.clearTimeout(this.outcomeTimer);
    this.phase = "select";
    this.board.cancelGesture(false);
    this.ui.clearToast();
    this.ui.showSelect(this.levels, this);
  }

  startLevel(id) {
    const level = LEVELS.find((item) => item.id === id);
    if (!level || !this.levels.isUnlocked(level.id)) return;
    window.clearTimeout(this.outcomeTimer);
    this.level = level;
    this.levels.remember(level.id);
    this.phase = "playing";
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.found = 0;
    this.cells = this.createCells(level);
    this.ui.closeOverlays();
    this.ui.clearToast();
    this.ui.showGame();
    this.ui.renderLevelNav(this.levels, this, level.id);
    this.ui.updateHud(this);
    this.board.render(level, this.cells);
    this.ui.announce(`${level.name}. ${level.boardSize} by ${level.boardSize}. Three lives.`);
  }

  restart() {
    if (!this.level) return;
    this.startLevel(this.level.id);
  }

  createCells(level) {
    const planted = new Set(level.eggplants.map(([row, col]) => `${row},${col}`));
    return level.regions.map((row, rowIndex) => row.map((regionId, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      regionId,
      hasEggplant: planted.has(`${rowIndex},${colIndex}`),
      marked: false,
      revealed: false,
    })));
  }

  canInteract(row, col) {
    if (this.phase !== "playing") return false;
    const cell = this.cells[row] && this.cells[row][col];
    return Boolean(cell) && !cell.revealed;
  }

  mark(row, col) {
    if (!this.canInteract(row, col)) return;
    const cell = this.cells[row][col];
    cell.marked = !cell.marked;
    this.board.updateCell(cell);
  }

  uncover(row, col) {
    if (!this.canInteract(row, col)) return;
    const cell = this.cells[row][col];
    cell.revealed = true;
    cell.marked = false;

    if (cell.hasEggplant) {
      this.score += 1;
      this.found += 1;
      this.board.updateCell(cell, "found");
      this.ui.updateHud(this);
      this.ui.announce(`Eggplant found. ${this.found} of ${this.level.boardSize}.`);
      if (this.found === this.level.boardSize) this.finishWin();
      return;
    }

    this.lives -= 1;
    this.board.updateCell(cell, "miss");
    this.ui.updateHud(this, { lostHeart: true });
    this.ui.toast("Empty cell. You lost a life.");
    this.ui.announce(`Empty cell. ${this.lives} lives left.`);
    if (this.lives <= 0) this.finishLoss();
  }

  finishWin() {
    this.phase = "won";
    this.board.lock();
    this.levels.markCompleted(this.level.id);
    this.ui.renderLevelNav(this.levels, this, this.level.id);
    this.outcomeTimer = window.setTimeout(() => this.ui.showVictory(this), 460);
  }

  finishLoss() {
    this.phase = "lost";
    this.board.lock();
    this.outcomeTimer = window.setTimeout(() => this.ui.showDefeat(this), 520);
  }
}

function boot() {
  const failures = LEVELS.flatMap((level) => PuzzleValidator.validate(level));
  const ui = new UIManager();
  if (failures.length) {
    const message = document.createElement("p");
    message.className = "lede";
    message.textContent = failures.join(" ");
    document.querySelector("#select-screen").append(message);
    return;
  }
  const game = new GameManager(ui, new LevelManager());
  game.showSelect();
}

document.addEventListener("DOMContentLoaded", boot);
