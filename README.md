# Music Rhythm Game

A browser-based arcade rhythm game built with vanilla HTML, CSS, and JavaScript. Developed as an internship project at **Lifewood Data Technology**.

---

## Overview

Players hit arrow-key notes in sync with music as they fall down four colored lanes. The game features an arcade/retro aesthetic with CRT scanlines, neon glow effects, and a full scoring system including combos, health, and letter grades.

---

## Features

- **4-Lane gameplay** — Arrow keys (← ↓ → ↑) mapped to cyan, yellow, magenta, and green lanes
- **Two note types** — Tap notes and hold notes (22% spawn rate)
- **Three difficulty levels** — Easy, Medium, Hard (affects note speed and spawn rate)
- **Three songs** — Selectable from the song selection screen
- **Combo & multiplier system** — 2× at 5 combo, 3× at 10 combo
- **Health bar** — 10 HP; misses and broken holds deduct 1 HP each
- **Letter grading** — S / A / B / C / F based on accuracy and perfect hit ratio
- **High score persistence** — Saved to `localStorage`
- **Pause support** — Toggle with `Esc`
- **Touch support** — Playable on mobile via on-screen touch zones
- **Demo mode** — Animated notes fall in the background on the selection screen
- **Responsive viewport fitting** — Auto-scales to any screen size without scrolling

---

## Getting Started

No build tools or dependencies required.

1. Clone or download this repository.
2. Open `index.html` in any modern browser.
3. Select a song and difficulty, then click **PRESS START**.

```
GameDev/
├── index.html        # Game markup and screens
├── MusicRhythm.js    # Game logic
├── style.css         # Styling and animations
└── audio/
    ├── song1.mp3
    ├── song2.mp3
    └── song3.mp3
```

> **Note:** Due to browser autoplay restrictions, the game must be started via a user interaction (the Start button), which is already handled.

---

## Controls

| Key         | Lane    | Color   |
|-------------|---------|---------|
| `←` Left    | Lane 1  | Cyan    |
| `↓` Down    | Lane 2  | Yellow  |
| `→` Right   | Lane 3  | Magenta |
| `↑` Up      | Lane 4  | Green   |
| `Esc`       | Pause / Resume | — |

**Hold notes:** Press and hold the key while the note's head is in the hit zone; release only after the tail has passed.

---

## Scoring

| Hit Type     | Base Points |
|--------------|-------------|
| Good         | 1           |
| Perfect      | 2           |
| Hold (Good)  | 2           |
| Hold (Perfect)| 4          |

Combo multipliers apply on top of base points:

| Combo  | Multiplier |
|--------|-----------|
| 0–4    | ×1        |
| 5–9    | ×2        |
| 10+    | ×3        |

### Grades

| Grade | Condition                                      |
|-------|------------------------------------------------|
| S     | ≥90% accuracy AND ≥60% of hits are Perfect     |
| A     | ≥80% accuracy                                  |
| B     | ≥65% accuracy                                  |
| C     | ≥50% accuracy                                  |
| F     | Below 50% accuracy                             |

---

## Technical Details

- **Pure vanilla stack** — No frameworks or build tools; runs entirely in the browser
- **CSS clip-path arrows** — Note shapes are pure CSS polygons (no sprite sheets)
- **Interval-based note movement** — Notes update position every 50 ms
- **Anticipation system** — Hit areas pulse when a note enters the approach zone
- **Particle effects** — Burst particles on every successful hit
- **Viewport zoom** — `--ui-zoom` CSS variable scales the entire UI to fit any viewport height

---

## Development

Built and tested in Google Chrome. Compatible with all modern browsers that support CSS `clip-path`, `localStorage`, and the Web Audio API.

To add songs, place `.mp3` files in the `audio/` folder and add `<option>` entries in the `#song-selection` dropdown inside `index.html`.

---

## Internship Context

This project was developed by **Sherlyn Olalo** as part of an internship at **Lifewood Data Technology**. It demonstrates proficiency in DOM manipulation, game loop design, CSS animation, and browser API usage (Audio API, localStorage, Touch Events).

---

## License

For internal and educational use at Lifewood Data Technology.
