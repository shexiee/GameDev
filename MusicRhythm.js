let score = 0;
let combo = 0;
let maxCombo = 0;
let health = 10;
let gameRunning = false;
let difficultySpeed = 2000;
let noteSpeed = 5;
const lanes = ["lane-1", "lane-2", "lane-3", "lane-4"];
const scoreDisplay = document.getElementById("score");
const comboDisplay = document.getElementById("combo");
const healthFill = document.getElementById("health-bar-fill");
const message = document.getElementById("message");
const bgMusic = document.getElementById("bg-music");
let noteSpawnInterval;
let activeNotes = [];

const noteImages = {
    "lane-1": "assets/leftarrow.png",
    "lane-2": "assets/downarrow.png",
    "lane-3": "assets/rightarrow.png",
    "lane-4": "assets/uparrow.png"
};

function getHighScore() {
    return parseInt(localStorage.getItem("rhythmHighScore") || "0");
}

function saveHighScore() {
    if (score > getHighScore()) localStorage.setItem("rhythmHighScore", score);
}

function startGame() {
    const selectedSong = document.getElementById("song-selection").value;
    const difficulty = document.getElementById("difficulty-selection").value;

    if (difficulty === "easy")        { difficultySpeed = 2000; noteSpeed = 4; }
    else if (difficulty === "medium") { difficultySpeed = 1500; noteSpeed = 6; }
    else                              { difficultySpeed = 1000; noteSpeed = 9; }

    document.getElementById("selection-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("high-score-display").textContent = getHighScore();

    bgMusic.src = selectedSong;
    bgMusic.play();
    gameRunning = true;

    noteSpawnInterval = setInterval(createNote, difficultySpeed);
    bgMusic.onended = () => gameOver();
}

function createNote() {
    if (!gameRunning) return;

    const laneId = lanes[Math.floor(Math.random() * lanes.length)];
    const lane = document.getElementById(laneId);
    const note = document.createElement("img");
    note.classList.add("note");
    note.src = noteImages[laneId];
    note.style.top = "-80px";
    note.style.left = "0";
    lane.appendChild(note);
    activeNotes.push({ element: note, lane: laneId });
    moveNote(note, lane, laneId);
}

function moveNote(note, lane, laneId) {
    let position = -80;
    let missed = false;
    const interval = setInterval(() => {
        if (!gameRunning || !note.isConnected) {
            clearInterval(interval);
            return;
        }
        position += noteSpeed;
        note.style.top = position + "px";

        if (position > 480 && !missed) {
            missed = true;
            clearInterval(interval);
            activeNotes = activeNotes.filter(n => n.element !== note);
            lane.removeChild(note);
            onMiss(laneId);
        }
    }, 50);
}

function onMiss(laneId) {
    combo = 0;
    updateCombo();
    health = Math.max(0, health - 1);
    updateHealthBar();
    showFeedback(laneId, "MISS", "miss");
    if (health <= 0) gameOver();
}

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
    if (health <= 3)      healthFill.className = "hp-low";
    else if (health <= 6) healthFill.className = "hp-mid";
    else                  healthFill.className = "";
}

function showFeedback(laneId, text, type) {
    const lane = document.getElementById(laneId);
    const fb = document.createElement("div");
    fb.className = `feedback ${type}`;
    fb.textContent = text;
    lane.appendChild(fb);
    setTimeout(() => fb.remove(), 600);
}

function flashLane(laneId) {
    const lane = document.getElementById(laneId);
    lane.classList.add("lane-flash");
    setTimeout(() => lane.classList.remove("lane-flash"), 150);
}

function getMultiplier() {
    if (combo >= 10) return 3;
    if (combo >= 5)  return 2;
    return 1;
}

document.addEventListener("keydown", (event) => {
    if (!gameRunning) return;

    const keyLaneMap = {
        "ArrowLeft":  "lane-1",
        "ArrowDown":  "lane-2",
        "ArrowRight": "lane-3",
        "ArrowUp":    "lane-4"
    };

    const laneId = keyLaneMap[event.code];
    if (!laneId) return;

    const notes = activeNotes.filter(n => n.lane === laneId);

    for (const noteObj of notes) {
        const notePos = parseInt(noteObj.element.style.top);
        if (notePos > 420 && notePos < 480) {
            const isPerfect = notePos > 430 && notePos < 470;
            const multiplier = getMultiplier();
            combo++;
            maxCombo = Math.max(maxCombo, combo);
            score += (isPerfect ? 2 : 1) * multiplier;
            scoreDisplay.textContent = score;
            updateCombo();
            flashLane(laneId);
            showFeedback(laneId, isPerfect ? "PERFECT!" : "GOOD!", isPerfect ? "perfect" : "good");
            noteObj.element.remove();
            activeNotes = activeNotes.filter(n => n !== noteObj);
            return;
        }
    }
});

function gameOver() {
    gameRunning = false;
    clearInterval(noteSpawnInterval);
    bgMusic.pause();
    saveHighScore();

    const hs = getHighScore();
    const newHigh = score > 0 && score >= hs;
    message.innerHTML =
        `<div class="game-over-banner">GAME OVER</div>` +
        `<div class="game-over-stats">SCORE: ${score}<br>MAX COMBO: ${maxCombo}×` +
        (newHigh ? `<br><span class="new-high">★ NEW HIGH SCORE! ★</span>` : '') +
        `</div>`;
    document.getElementById("high-score-display").textContent = hs;

    activeNotes.forEach(n => n.element.remove());
    activeNotes = [];
}

function restartGame() {
    location.reload();
}

document.getElementById("high-score-selection").textContent = getHighScore();
