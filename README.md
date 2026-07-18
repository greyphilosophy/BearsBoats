# Bears Boats

A browser-based boat game starring Bear, a polar bear, and their stuffed animal crew.

## Concept

Explore the ocean, customize your boats, and build offshore platforms — all as adorable stuffed animals!

## Features

- **Boat Customization** — Mix and match hulls, engines, cabins, and deck slots (MechWarrior / FTL style)
- **Maritime Operations** — Fish, crab, haul cargo, ferry passengers, tug, survey, build, and rescue
- **Tile-Based Map** — Point-and-click navigation across a top-down ocean with harbors
- **Offshore Platforms** — Deploy and expand buoys, windmills, oil rigs, and modular platforms
- **Stuffed Animal Crew** — Recruit a crew of plush characters, each with unique skills

## Installation

### Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9 (comes with Node.js)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/greyphilosophy/BearsBoats.git
cd BearsBoats

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Building for Production

```bash
# Build an optimized bundle in `dist/`
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
├── index.html        # Entry point
├── package.json      # Dependencies & scripts
├── vite.config.js    # Vite configuration
├── public/           # Static assets
├── src/              # Source files
│   ├── main.js       # Phaser game initialization
│   ├── crew.js       # Crew management
│   ├── equipment.js  # Deck equipment & slots
│   └── skills.js     # Crew skill system
└── dist/             # Production build output
```

## Tech Stack

- **Engine**: Phaser 3 (HTML5 Canvas)
- **Build**: Vite
- **State**: Zustand
- **Tiles**: JSON map + SpriteSheet
