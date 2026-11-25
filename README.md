# Friends Chase — 3D Endless Runner

A fast-paced, browser-based 3D endless runner built with **Three.js**, **React**, **TypeScript**, and **Tailwind CSS**. Sprint down endless city blocks while **3 to 4 customizable AI friends** chase dynamically right behind you.

## Features

- **Friends Chase System**: 3 or 4 AI-controlled friends sprint behind your runner with distinct behaviors (Sprinter, Flanker, Tank, Wildcard). They weave lanes, leap over barriers, duck under overhead gates, surge closer when you stumble, and physically tag you if they catch up.
- **Live 3D Character & Squad Customization**: Customize your runner's name, outfit colors, hair, skin tone, sneakers, and accessories (`Cap`, `Headphones`, `Backpack`, `Bandana`), plus customize all 3–4 chasing friends with live 3D nameplates.
- **Three-Lane Endless Gameplay**: Smooth lane switching, jumping, fast-fall sliding, escalating speed, coin combos, and cyan Sprint Boost pickups.
- **Three Environmental Themes**: Switch anytime between **Sunny Suburbia**, **Sunset Boulevard**, and **Neon Night District**.
- **Procedural 3D Graphics & Web Audio**: Articulated multi-part characters, PBR materials with `RoomEnvironment` reflections, contact shadows, pooled particle bursts, and zero-dependency procedural Web Audio sound effects.
- **Persistent Progress**: Player settings, friend squad customization, best score, best distance, and banked coins are saved automatically in `localStorage`.

## Controls

### Desktop
- **Move Left**: `Left Arrow` or `A`
- **Move Right**: `Right Arrow` or `D`
- **Jump**: `Up Arrow`, `W`, or `Space`
- **Slide / Fast-Fall**: `Down Arrow` or `S`
- **Pause / Resume**: `Esc` or `P`

### Mobile / Touch
- **Switch Lanes**: Swipe Left / Right
- **Jump**: Swipe Up
- **Slide / Fast-Fall**: Swipe Down

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Production Build & Deployment

```bash
npm run build
```

The static production bundle is generated in `dist/`, ready to deploy directly to **Vercel**, **Netlify**, or **GitHub Pages**.
