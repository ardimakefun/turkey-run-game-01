# Turkey Run — Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/ardimakefun/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/ardimakefun/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A zero-dependency, offline-first HTML5 Canvas arcade escape game built for **turkey-run-game-01** (*"Make the best turkey escape game"*).

## Quick Play (Static Files, Zero Network)
- **Direct file open:** Double-click `game/index.html` in any desktop browser (`file://` compatible — uses classic `<script defer>` tags, procedural Canvas 2D artwork, and Web Audio API synthesis with zero external assets or network requests).
- **Local static server (optional):** `node serve.ts` (or `python -m http.server 8080 --directory game`) and open `http://localhost:8080`.
- **Package output & dossier:** `MAKEFUN_OUTPUT_DIR=out node main.ts`

## Controls (Keyboard + Mouse)
- **Jump / Double-Flap / Hold to Glide:** `Space`, `W`, `ArrowUp`, or **Left Mouse Click**
- **Belly Slide / Air Fast-Fall:** `S`, `ArrowDown`, or **Right Mouse Click**
- **Dash Parry (smashes knives, ovens & skillets!):** `Shift`, `E`, `D`, `ArrowRight`, **Middle Click**, or HUD **Dash** button
- **Gobble Wave (reflects knives back into Farmer Barnaby, cools steam vents & magnetizes treats!):** `F`, `G`, or HUD **Wave** button (also tracks mouse reticle!)
- **Pause / Resume:** `P` or `Escape`
- **Mute / Unmute Audio:** `M`
- **Restart Run:** `R` (or `Space` / `Enter` on End Screen)

## Signature Features
- **Cloche Escape Intro & 3-Zone Campaign (0m–1,000m) + Endless Panic:**
  - Burst off the silver Thanksgiving cloche in **Farmhouse Kitchen (0–350m)**, crash out the screen door into **Barn & Harvest Yard (350–700m)**, and survive **Autumn Freedom Woods (700–1,000m)** to reach the Sanctuary Gate!
- **Return-to-Sender Knife Reflection (`BONK!`):**
  - Fire a Gobble Sonic Wave (`F` / `G` / HUD `Wave`) to send spinning carving knives flying backward into Farmer Barnaby, stunning him with dizzy stars and pushing him back!
- **Farmer Frenzy Wheelbarrow Finale (`855m–965m`):**
  - Farmer Barnaby hops onto a speeding harvest wheelbarrow and unleashes a Triple Knife Volley + Sizzling Skillet before wiping out near the Sanctuary!
- **Clutch Slow-Mo, Fever x5+ & Bouncy Pumpkins:**
  - Razor-thin `< 15px` dodges trigger cinematic Clutch Slow-Motion; x5+ combo ignites golden **Fever** (`+25%` score); Harvest Pumpkins launch Tom sky-high into bonus arcs.
- **4 Turkey Costumes & 7 Achievements:**
  - Classic Tom, Pilgrim, Rogue Chef, and Golden King with live Title Screen preview and offline `localStorage` records.

---

<sub>Entered on [make.fun](https://make.fun/?ref=0vh6bwht&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
