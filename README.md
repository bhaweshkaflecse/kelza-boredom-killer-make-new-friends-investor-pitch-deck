# Kelza Experience Platform

An immersive cinematic product experience and interactive investor platform. Built with modern web technologies, designed for performance, crafted for storytelling.

## Overview

The Kelza Experience Platform is not a conventional website. It is a cinematic, interactive narrative engine built from scratch using vanilla JavaScript, Three.js, GSAP, and modern web APIs. The architecture draws inspiration from game engines, prioritizing separation of concerns, performance, and long-term maintainability.

## Architecture

The platform follows a game-engine-inspired architecture:

```
Engine (Orchestrator)
  |
  |-- SceneManager       (Scene lifecycle and transitions)
  |-- AnimationManager   (GSAP integration and timeline control)
  |-- ScrollManager      (Lenis smooth scroll and scroll state)
  |-- CursorManager      (Custom cursor interactions)
  |-- PhysicsManager     (Lightweight physics for UI)
  |-- LightingManager    (Three.js lighting architecture)
  |-- PerformanceManager (FPS monitoring and quality scaling)
  |-- AudioManager       (Web Audio API and sound control)
```

Each manager is a self-contained module with `init()`, `update()`, and `destroy()` lifecycle methods. The Engine orchestrates all managers through a unified `requestAnimationFrame` loop with delta time.

## Folder Structure

```
.
├── index.html              # Semantic HTML5 entry point
├── vite.config.js          # Vite production configuration
├── package.json            # Dependencies and scripts
├── assets/
│   ├── fonts/              # Custom typefaces
│   ├── images/             # Optimized images
│   ├── icons/              # SVG/icon assets
│   ├── models/             # 3D models (glTF, OBJ)
│   ├── videos/             # Video assets
│   ├── audio/              # Sound files
│   └── lottie/             # Lottie animation JSONs
├── css/
│   ├── reset.css           # Modern CSS reset
│   ├── variables.css       # Complete design token system
│   ├── typography.css      # Type scale and font styles
│   ├── layout.css          # Container and grid system
│   ├── utilities.css       # Helper classes
│   ├── animations.css      # Keyframe definitions
│   ├── components.css      # Base component patterns
│   └── main.css            # Import orchestrator
├── js/
│   ├── app.js              # Application entry point
│   ├── config/
│   │   ├── constants.js    # Immutable application constants
│   │   └── settings.js     # Runtime configuration
│   ├── engine/
│   │   ├── Engine.js       # Core orchestrator
│   │   ├── SceneManager.js
│   │   ├── AnimationManager.js
│   │   ├── ScrollManager.js
│   │   ├── CursorManager.js
│   │   ├── PhysicsManager.js
│   │   ├── LightingManager.js
│   │   ├── PerformanceManager.js
│   │   └── AudioManager.js
│   ├── scenes/             # Scene implementations
│   ├── ui/                 # UI components
│   ├── effects/            # Visual effects
│   ├── shaders/            # GLSL shaders
│   └── utils/
│       ├── helpers.js      # General utilities
│       ├── dom.js          # DOM manipulation
│       └── math.js         # Mathematical functions
├── data/                   # Static data files
├── public/                 # Public static assets
├── service-worker/         # PWA service worker
└── docs/                   # Documentation
```

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Vite** | Build tool with HMR, tree-shaking, and code splitting |
| **GSAP** | Production-grade animation with ScrollTrigger |
| **Three.js** | WebGL 3D rendering and effects |
| **Lenis** | Buttery smooth scroll with momentum |
| **Lottie Web** | Vector animation playback |
| **Motion** | Lightweight animation utilities |
| **Lucide** | Consistent icon system |

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts Vite dev server at `http://localhost:3000` with hot module replacement.

### Build

```bash
npm run build
```

Produces an optimized production build in the `dist/` directory with:
- Code splitting (vendor chunks for GSAP, Three.js, Lenis, Lottie, Motion)
- Tree shaking
- Terser minification (console/debugger statements removed)
- Asset hashing for cache busting

### Preview

```bash
npm run preview
```

Serves the production build locally for verification.

## Coding Philosophy

1. **Simplicity** - Prefer straightforward solutions over clever abstractions
2. **Maintainability** - Code should be readable a year from now
3. **Performance** - 60 FPS minimum, optimize from day one
4. **Scalability** - Architecture supports growth without rewrites
5. **Readability** - Self-documenting code with meaningful names
6. **Accessibility** - WCAG compliance, reduced motion support, keyboard navigation

## Performance Targets

- 95+ Lighthouse score
- 60 FPS minimum during interactions
- First Contentful Paint under 1.5s
- Lazy loading for heavy assets
- Tree-shaking friendly ES Modules
- Automatic quality reduction on low-end devices

## Accessibility

- Semantic HTML5 landmarks and structure
- Skip-to-content navigation link
- `prefers-reduced-motion` respected at all levels
- Focus management for modal and overlay content
- ARIA labels and roles where needed
- Color contrast meeting WCAG AA standards
- Keyboard navigation support throughout

## Contribution Guidelines

### Code Standards

- ES Modules exclusively (import/export)
- One responsibility per file
- Meaningful, descriptive names for all identifiers
- No magic numbers (use constants)
- No duplicated code
- Document all exported classes and public methods
- No `console.log` in production code
- No TODO comments or dead code

### File Naming

- Files: `PascalCase` for classes, `camelCase` for utilities
- CSS: `kebab-case` for filenames and custom properties
- Constants: `UPPER_SNAKE_CASE`

### Architecture Rules

- Managers handle one domain only
- Scenes own their visual lifecycle
- Utilities are pure, stateless functions
- Configuration is centralized
- No circular dependencies

## License

UNLICENSED - Proprietary
