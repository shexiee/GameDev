let score = 0;
let gameRunning = false;
let difficultySpeed = 2000;
let lanes = ["lane-1", "lane-2", "lane-3", "lane-4"];
const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
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

// Start Game Function
function startGame() {
    let selectedSong = document.getElementById("song-selection").value;
    let difficulty = document.getElementById("difficulty-selection").value;

    // Set difficulty speed
    difficultySpeed = (difficulty === "easy") ? 2000 :
                      (difficulty === "medium") ? 1500 : 1000;

    // Hide selection screen, show game screen
    document.getElementById("selection-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";

    // Set song and play
    bgMusic.src = selectedSong;
    bgMusic.play();
    gameRunning = true;

    // Start Note Spawning
    noteSpawnInterval = setInterval(createNote, difficultySpeed);

    // Automatically end the game when song finishes
    bgMusic.onended = () => {
        gameOver();
    };
}

// Create Notes Function
function createNote() {
    if (!gameRunning) return;

    let laneIndex = Math.floor(Math.random() * lanes.length);
    let lane = document.getElementById(lanes[laneIndex]);

    let note = document.createElement("img");
    note.classList.add("note");
    note.src = noteImages[lanes[laneIndex]];
    note.style.top = "-80px";
    note.style.left = "0";

    lane.appendChild(note);
    activeNotes.push({ element: note, lane: lanes[laneIndex] });

    moveNote(note, lane);
}

// Move Notes Function
function moveNote(note, lane) {
    let position = -80;
    let interval = setInterval(() => {
        position += 5;
        note.style.top = position + "px";

        if (position > 480) {
            clearInterval(interval);
            activeNotes = activeNotes.filter(n => n.element !== note);
            lane.removeChild(note);
        }
    }, 50);
}

// Key Press Detection
document.addEventListener("keydown", (event) => {
    if (!gameRunning) return;

    let keyLaneMap = {
        "ArrowLeft": "lane-1",
        "ArrowDown": "lane-2",
        "ArrowRight": "lane-3",
        "ArrowUp": "lane-4"
    };

    let laneId = keyLaneMap[event.code];
    if (!laneId) return;

    let lane = document.getElementById(laneId);
    let notes = activeNotes.filter(n => n.lane === laneId);
    
    for (let noteObj of notes) {
        let note = noteObj.element;
        let notePosition = parseInt(note.style.top);
        
        if (notePosition > 420 && notePosition < 480) {
            score++;
            scoreDisplay.textContent = score;
            lane.removeChild(note);
            activeNotes = activeNotes.filter(n => n !== noteObj);
            return;
        }
    }
});

// Game Over Function
function gameOver() {
    gameRunning = false;
    clearInterval(noteSpawnInterval);
    message.textContent = `Game Over! Final Score: ${score}`;

    // Stop all remaining notes from moving
    activeNotes.forEach(noteObj => {
        let note = noteObj.element;
        note.remove();
    });

    activeNotes = [];
}

// Restart Game Function
function restartGame() {
    location.reload();
}
