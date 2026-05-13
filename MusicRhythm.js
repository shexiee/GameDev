// ===== CONSTANTS =====
const CONTAINER_H  = 650;
const NOTE_H       = 80;
const HIT_ZONE_LOW  = 540;
const HIT_ZONE_HIGH = 630;
const PERFECT_LOW   = 558;
const PERFECT_HIGH  = 612;

// ===== STATE =====
let score = 0, combo = 0, maxCombo = 0, health = 10;
let totalNotes = 0, hitNotes = 0, perfectNotes = 0;
let gameRunning = false, gamePaused = false;
let difficultySpeed = 2000, noteSpeed = 5;
let noteSpawnInterval, progressInterval, demoInterval;
let activeNotes = [];
const heldKeys = new Set();
const anticipationCount = { "lane-1": 0, "lane-2": 0, "lane-3": 0, "lane-4": 0 };
const ANTICIPATION_LOW = 400;

// ===== DOM =====
const scoreDisplay = document.getElementById("score");
const comboDisplay = document.getElementById("combo");
const healthFill   = document.getElementById("health-bar-fill");
const message      = document.getElementById("message");
const bgMusic      = document.getElementById("bg-music");

// ===== DATA =====
const lanes = ["lane-1", "lane-2", "lane-3", "lane-4"];
const laneColors = { "lane-1": "#00ffff", "lane-2": "#ffff00", "lane-3": "#ff00ff", "lane-4": "#00ff00" };
const noteArrows = {
    "lane-1": "left",
    "lane-2": "down",
    "lane-3": "right",
    "lane-4": "up"
};
const keyLaneMap = { "ArrowLeft": "lane-1", "ArrowDown": "lane-2", "ArrowRight": "lane-3", "ArrowUp": "lane-4" };

// ===== PATTERNS =====
const notePatterns = [
    [0, 2, 1, 3], [0, 1, 2, 3], [3, 2, 1, 0],
    [0, 3, 1, 2], [2, 3, 0, 1], [0, 1, 3, 2],
    [1, 2, 1, 2], [0, 2, 3, 1], [3, 0, 2, 1],
    [0, 0, 2, 2], [1, 3, 1, 3],
];
let patternIdx = 0, noteInPattern = 0;

function getNextLane() {
    const pattern = notePatterns[patternIdx % notePatterns.length];
    const laneIndex = pattern[noteInPattern % pattern.length];
    noteInPattern++;
    if (noteInPattern >= pattern.length) { noteInPattern = 0; patternIdx++; }
    return lanes[laneIndex];
}

// ===== HIGH SCORE =====
function getHighScore() { return parseInt(localStorage.getItem("rhythmHighScore") || "0"); }
function saveHighScore() { if (score > getHighScore()) localStorage.setItem("rhythmHighScore", score); }

// ===== START =====
function startGame() {
    const selectedSong = document.getElementById("song-selection").value;
    const difficulty   = document.getElementById("difficulty-selection").value;

    if      (difficulty === "easy")   { difficultySpeed = 2000; noteSpeed = 5;  }
    else if (difficulty === "medium") { difficultySpeed = 1400; noteSpeed = 8;  }
    else                              { difficultySpeed = 900;  noteSpeed = 12; }

    document.getElementById("selection-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
    document.getElementById("high-score-display").textContent = getHighScore();

    bgMusic.src = selectedSong;
    bgMusic.onended = () => gameOver();

    stopDemo();

    startCountdown(() => {
        bgMusic.play();
        gameRunning = true;
        noteSpawnInterval = setInterval(createNote, difficultySpeed);
        startProgress();
    });
}

// ===== SONG PROGRESS =====
function startProgress() {
    const fill = document.getElementById("song-progress-fill");
    progressInterval = setInterval(() => {
        if (bgMusic.duration && !isNaN(bgMusic.duration)) {
            const pct = Math.min(100, (bgMusic.currentTime / bgMusic.duration) * 100);
            fill.style.width = pct + "%";
        }
    }, 150);
}

// ===== COUNTDOWN =====
function startCountdown(callback) {
    const overlay  = document.getElementById("countdown-overlay");
    const display  = document.getElementById("countdown-display");
    const sequence = ["3", "2", "1", "GO!"];
    let i = 0;
    overlay.style.display = "flex";

    function tick() {
        display.textContent = sequence[i];
        display.classList.remove("countdown-pop");
        void display.offsetWidth;
        display.classList.add("countdown-pop");
        i++;
        if (i < sequence.length) {
            setTimeout(tick, 900);
        } else {
            setTimeout(() => { overlay.style.display = "none"; callback(); }, 500);
        }
    }
    tick();
}

// ===== CREATE NOTE =====
function createNote() {
    if (!gameRunning || gamePaused) return;
    totalNotes++;

    const laneId = getNextLane();
    const lane   = document.getElementById(laneId);
    const isHold = Math.random() < 0.22;
    const color  = laneColors[laneId];

    const dir = noteArrows[laneId];

    if (isHold) {
        const holdLen = [80, 120, 160][Math.floor(Math.random() * 3)];
        const note = document.createElement("div");
        note.classList.add("note", "hold-note");
        note.style.top    = -(NOTE_H + holdLen) + "px";
        note.style.height = (NOTE_H + holdLen)  + "px";
        note.innerHTML =
            `<div class="hold-body" style="height:${holdLen}px"></div>` +
            `<div class="hold-head arrow-${dir}"></div>`;
        lane.appendChild(note);
        const noteObj = { element: note, lane: laneId, isHold: true, holdLen, scored: false };
        activeNotes.push(noteObj);
        moveNote(note, lane, laneId, holdLen, noteObj);
    } else {
        const note = document.createElement("div");
        note.classList.add("note", "arrow-" + dir);
        note.style.top  = -NOTE_H + "px";
        lane.appendChild(note);
        const noteObj = { element: note, lane: laneId, isHold: false, holdLen: 0, scored: false };
        activeNotes.push(noteObj);
        moveNote(note, lane, laneId, 0, noteObj);
    }
}

// ===== MOVE NOTE =====
function moveNote(note, lane, laneId, holdLen, noteObj) {
    let position = -(NOTE_H + holdLen);
    noteObj.anticipating = false;

    const interval = setInterval(() => {
        if (!note.isConnected) { clearInterval(interval); return; }
        if (!gameRunning)      { clearInterval(interval); return; }
        if (gamePaused) return;

        position += noteSpeed;
        note.style.top = position + "px";

        // Head position (hold notes: head is BELOW the body)
        const headPos = position + holdLen;

        // Anticipation glow: head approaching hit zone
        const shouldAnticipate = !noteObj.scored && headPos > ANTICIPATION_LOW && headPos < HIT_ZONE_HIGH;
        if (shouldAnticipate !== noteObj.anticipating) {
            noteObj.anticipating = shouldAnticipate;
            if (shouldAnticipate) addAnticipation(laneId);
            else                  removeAnticipation(laneId);
        }

        // Hold-note state machine
        if (holdLen > 0) {
            const tailPos = position; // top of body = tail (leaves zone last)

            // Activate the hold if key is held while head is in zone
            if (!noteObj.scored && heldKeys.has(laneId) && headPos > HIT_ZONE_LOW && headPos < HIT_ZONE_HIGH) {
                noteObj.scored = true;
                noteObj.holding = true;
                noteObj.activatedPerfect = headPos > PERFECT_LOW && headPos < PERFECT_HIGH;
                note.classList.add("hold-active");
            }

            // While holding, watch for release (break) or tail-exit (complete)
            if (noteObj.holding) {
                if (!heldKeys.has(laneId)) {
                    noteObj.holding = false;
                    note.classList.remove("hold-active");
                    note.classList.add("hold-broken");
                    onHoldBreak(laneId);
                } else if (tailPos > HIT_ZONE_HIGH) {
                    noteObj.holding = false;
                    note.classList.remove("hold-active");
                    note.classList.add("hold-complete");
                    registerHit(laneId, noteObj.activatedPerfect, 2);
                }
            }
        }

        // Miss: head past hit zone, not scored
        if (!noteObj.scored && headPos > HIT_ZONE_HIGH) {
            clearInterval(interval);
            cleanupNote(noteObj, lane);
            onMiss(laneId);
            return;
        }

        // Cleanup: scored note fully off screen
        if (noteObj.scored && position > CONTAINER_H + 100) {
            clearInterval(interval);
            cleanupNote(noteObj, lane);
        }
    }, 50);
}

function cleanupNote(noteObj, lane) {
    if (noteObj.anticipating) {
        removeAnticipation(noteObj.lane);
        noteObj.anticipating = false;
    }
    activeNotes = activeNotes.filter(n => n !== noteObj);
    if (noteObj.element.parentNode) lane.removeChild(noteObj.element);
}

function addAnticipation(laneId) {
    anticipationCount[laneId]++;
    document.getElementById(laneId).classList.add("anticipating");
}

function removeAnticipation(laneId) {
    anticipationCount[laneId] = Math.max(0, anticipationCount[laneId] - 1);
    if (anticipationCount[laneId] === 0) {
        document.getElementById(laneId).classList.remove("anticipating");
    }
}

// ===== HIT DETECTION (keypress) =====
function checkLaneHit(laneId) {
    // Regular notes
    for (const noteObj of activeNotes) {
        if (noteObj.lane !== laneId || noteObj.isHold || noteObj.scored) continue;
        const headPos = parseInt(noteObj.element.style.top);
        if (headPos > HIT_ZONE_LOW && headPos < HIT_ZONE_HIGH) {
            noteObj.scored = true;
            const isPerfect = headPos > PERFECT_LOW && headPos < PERFECT_HIGH;
            registerHit(laneId, isPerfect, 1);
            if (noteObj.anticipating) { removeAnticipation(laneId); noteObj.anticipating = false; }
            noteObj.element.remove();
            activeNotes = activeNotes.filter(n => n !== noteObj);
            return;
        }
    }
    // Hold notes — keypress only ACTIVATES the hold (scoring waits for tail completion)
    for (const noteObj of activeNotes) {
        if (noteObj.lane !== laneId || !noteObj.isHold || noteObj.scored) continue;
        const headPos = parseInt(noteObj.element.style.top) + noteObj.holdLen;
        if (headPos > HIT_ZONE_LOW && headPos < HIT_ZONE_HIGH) {
            noteObj.scored = true;
            noteObj.holding = true;
            noteObj.activatedPerfect = headPos > PERFECT_LOW && headPos < PERFECT_HIGH;
            noteObj.element.classList.add("hold-active");
            if (noteObj.anticipating) { removeAnticipation(laneId); noteObj.anticipating = false; }
            return;
        }
    }
}

// ===== REGISTER HIT =====
function registerHit(laneId, isPerfect, pointMult) {
    if (isPerfect) perfectNotes++;
    hitNotes++;
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    const mult = getMultiplier();
    const points = (isPerfect ? 2 : 1) * mult * pointMult;
    score += points;
    scoreDisplay.textContent = score;
    showScorePopup(points, mult);
    updateCombo();
    flashLane(laneId);
    spawnParticles(laneId, isPerfect);
    showFeedback(laneId, isPerfect ? "PERFECT!" : "GOOD!", isPerfect ? "perfect" : "good");
}

function showScorePopup(amount, mult) {
    const wrap = document.querySelector(".score-wrap");
    if (!wrap) return;
    const popup = document.createElement("div");
    popup.className = "score-popup" + (mult >= 3 ? " mult-3" : mult >= 2 ? " mult-2" : "");
    popup.textContent = "+" + amount + (mult > 1 ? " ×" + mult : "");
    wrap.appendChild(popup);
    setTimeout(() => popup.remove(), 700);
}

function onMiss(laneId) {
    combo = 0;
    updateCombo();
    health = Math.max(0, health - 1);
    updateHealthBar();
    showFeedback(laneId, "MISS", "miss");
    if (health <= 0) gameOver();
}

function onHoldBreak(laneId) {
    combo = 0;
    updateCombo();
    health = Math.max(0, health - 1);
    updateHealthBar();
    showFeedback(laneId, "BREAK!", "miss");
    if (health <= 0) gameOver();
}

function getMultiplier() {
    if (combo >= 10) return 3;
    if (combo >= 5)  return 2;
    return 1;
}

// ===== KEYBOARD =====
document.addEventListener("keydown", (event) => {
    // Block browser scroll on arrow / space / page keys
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","PageUp","PageDown","Home","End"].includes(event.code)) {
        event.preventDefault();
    }
    if (event.code === "Escape") {
        if (gameRunning || gamePaused) togglePause();
        return;
    }
    if (!gameRunning || gamePaused) return;
    const laneId = keyLaneMap[event.code];
    if (!laneId) return;
    if (heldKeys.has(laneId)) return; // prevent repeat fires
    heldKeys.add(laneId);
    checkLaneHit(laneId);
}, { passive: false });

document.addEventListener("keyup", (event) => {
    const laneId = keyLaneMap[event.code];
    if (laneId) heldKeys.delete(laneId);
});

// ===== TOUCH =====
document.querySelectorAll(".touch-zone").forEach(zone => {
    zone.addEventListener("touchstart", e => {
        e.preventDefault();
        if (!gameRunning || gamePaused) return;
        const laneId = zone.dataset.lane;
        if (!heldKeys.has(laneId)) {
            heldKeys.add(laneId);
            checkLaneHit(laneId);
        }
    }, { passive: false });
    zone.addEventListener("touchend", e => {
        e.preventDefault();
        heldKeys.delete(zone.dataset.lane);
    }, { passive: false });
});

// ===== PAUSE =====
function togglePause() {
    if (!gameRunning && !gamePaused) return;
    gamePaused = !gamePaused;
    const overlay = document.getElementById("pause-overlay");
    if (gamePaused) {
        bgMusic.pause();
        overlay.style.display = "flex";
    } else {
        bgMusic.play();
        overlay.style.display = "none";
    }
}

// ===== VISUALS =====
function updateCombo() {
    if (combo >= 2) {
        comboDisplay.textContent = `${combo}× COMBO`;
        comboDisplay.className = "";
        void comboDisplay.offsetWidth;
        comboDisplay.className = "combo-active";
    } else {
        comboDisplay.textContent = "";
        comboDisplay.className = "";
    }
}

function updateHealthBar() {
    healthFill.style.width = (health / 10 * 100) + "%";
    if      (health <= 3) healthFill.className = "hp-low";
    else if (health <= 6) healthFill.className = "hp-mid";
    else                  healthFill.className = "";
}

function showFeedback(laneId, text, type) {
    const lane = document.getElementById(laneId);
    const fb   = document.createElement("div");
    fb.className   = `feedback ${type}`;
    fb.textContent = text;
    lane.appendChild(fb);
    setTimeout(() => fb.remove(), 600);
}

function flashLane(laneId) {
    const lane = document.getElementById(laneId);
    lane.classList.add("lane-flash");
    setTimeout(() => lane.classList.remove("lane-flash"), 150);
}

function spawnParticles(laneId, isPerfect) {
    const lane  = document.getElementById(laneId);
    const color = laneColors[laneId];
    const count = isPerfect ? 12 : 7;
    for (let i = 0; i < count; i++) {
        const p     = document.createElement("div");
        const angle = Math.random() * Math.PI * 2;
        const dist  = 25 + Math.random() * 55;
        p.className = "particle";
        p.style.cssText = `--color:${color};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;bottom:75px;left:calc(50% - 3px)`;
        lane.appendChild(p);
        setTimeout(() => p.remove(), 550);
    }
}

// ===== GRADE =====
function getGrade() {
    if (totalNotes === 0) return { letter: "?", color: "#888" };
    const acc       = hitNotes / totalNotes;
    const perfRatio = hitNotes > 0 ? perfectNotes / hitNotes : 0;
    if (acc >= 0.90 && perfRatio >= 0.60) return { letter: "S", color: "#ffff00" };
    if (acc >= 0.80)                       return { letter: "A", color: "#00ffff" };
    if (acc >= 0.65)                       return { letter: "B", color: "#00ff88" };
    if (acc >= 0.50)                       return { letter: "C", color: "#ffaa00" };
    return { letter: "F", color: "#ff4444" };
}

// ===== GAME OVER =====
function gameOver() {
    if (!gameRunning && !gamePaused) return;
    gameRunning = false;
    gamePaused  = false;
    clearInterval(noteSpawnInterval);
    clearInterval(progressInterval);
    bgMusic.pause();
    document.getElementById("pause-overlay").style.display    = "none";
    document.getElementById("countdown-overlay").style.display = "none";
    saveHighScore();

    const hs      = getHighScore();
    const newHigh = score > 0 && score >= hs;
    const grade   = getGrade();
    const acc     = totalNotes > 0 ? Math.round(hitNotes / totalNotes * 100) : 0;

    message.innerHTML =
        `<div class="game-over-banner">GAME OVER</div>` +
        `<div class="grade-letter" style="color:${grade.color};text-shadow:0 0 24px ${grade.color}">${grade.letter}</div>` +
        `<div class="game-over-stats">` +
            `SCORE: ${score}<br>` +
            `ACCURACY: ${acc}%<br>` +
            `MAX COMBO: ${maxCombo}×` +
            (newHigh ? `<br><span class="new-high">★ NEW HIGH SCORE! ★</span>` : "") +
        `</div>`;
    message.classList.add("show");

    document.getElementById("high-score-display").textContent = hs;
    activeNotes.forEach(n => n.element.remove());
    activeNotes = [];
}

function restartGame() { location.reload(); }

// ===== DEMO MODE (selection screen) =====
function startDemo() {
    const container = document.getElementById("selection-demo");
    if (!container) return;
    demoInterval = setInterval(() => {
        if (gameRunning) return;
        const laneId = lanes[Math.floor(Math.random() * 4)];
        const dir    = noteArrows[laneId];
        const dot = document.createElement("div");
        dot.className = "demo-note demo-" + laneId + " arrow-" + dir;
        dot.style.left = (Math.random() * 88) + "%";
        dot.style.animationDuration = (3 + Math.random() * 3) + "s";
        container.appendChild(dot);
        setTimeout(() => dot.remove(), 6500);
    }, 380);
}

function stopDemo() {
    clearInterval(demoInterval);
    const container = document.getElementById("selection-demo");
    if (container) container.innerHTML = "";
}

// ===== VIEWPORT FIT (no scroll, always fits) =====
function fitToViewport() {
    const NATURAL_H = 770; // total content height for game-screen
    const padding   = 20;
    const zoom = Math.min(1, (window.innerHeight - padding) / NATURAL_H);
    document.documentElement.style.setProperty("--ui-zoom", zoom);
}
fitToViewport();
window.addEventListener("resize", fitToViewport);

// ===== INIT =====
document.getElementById("high-score-selection").textContent = getHighScore();
startDemo();
