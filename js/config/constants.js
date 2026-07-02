/**
 * Application Constants
 * Immutable values used throughout the Kelza Experience Platform.
 */

export const BREAKPOINTS = Object.freeze({
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
});

export const Z_INDEX = Object.freeze({
  BELOW: -1,
  BASE: 0,
  ABOVE: 1,
  DROPDOWN: 100,
  STICKY: 200,
  HEADER: 300,
  OVERLAY: 400,
  MODAL: 500,
  POPOVER: 600,
  TOOLTIP: 700,
  NOTIFICATION: 800,
  CURSOR: 900,
  MAX: 9999
});

export const DURATIONS = Object.freeze({
  INSTANT: 0.05,
  FAST: 0.15,
  NORMAL: 0.3,
  SLOW: 0.5,
  SLOWER: 0.7,
  SLOWEST: 1.0,
  CINEMATIC: 1.5,
  EPIC: 2.5
});

export const EASINGS = Object.freeze({
  LINEAR: 'none',
  IN: 'power2.in',
  OUT: 'power2.out',
  IN_OUT: 'power2.inOut',
  SMOOTH: 'power3.out',
  CINEMATIC: 'power4.inOut',
  BOUNCE: 'back.out(1.7)',
  ELASTIC: 'elastic.out(1, 0.3)',
  EXPO_OUT: 'expo.out'
});

export const SCENE_STATES = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  PRELOADING: 'preloading',
  ENTERING: 'entering',
  ACTIVE: 'active',
  INTERACTIVE: 'interactive',
  LEAVING: 'leaving',
  CLEANUP: 'cleanup',
  DESTROYED: 'destroyed'
});

export const MANAGER_STATES = Object.freeze({
  UNINITIALIZED: 'uninitialized',
  INITIALIZING: 'initializing',
  READY: 'ready',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error',
  DESTROYED: 'destroyed'
});

export const DEVICE_TIERS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  ULTRA: 'ultra'
});

export const EVENTS = Object.freeze({
  RESIZE: 'kelza:resize',
  SCROLL: 'kelza:scroll',
  SCENE_CHANGE: 'kelza:scene:change',
  SCENE_READY: 'kelza:scene:ready',
  ENGINE_READY: 'kelza:engine:ready',
  PERFORMANCE_WARNING: 'kelza:performance:warning'
});

export const UNIVERSE_LAYERS = Object.freeze({
  DEEP_SPACE: 'deepSpace',
  GRADIENTS: 'gradients',
  AMBIENT_LIGHTING: 'ambientLighting',
  PARTICLE_FIELD: 'particleField',
  DEPTH_FOG: 'depthFog',
  CONSTELLATIONS: 'constellations',
  SCENE_OVERLAYS: 'sceneOverlays'
});

export const PARTICLE_LIMITS = Object.freeze({
  [DEVICE_TIERS.LOW]: 4000,
  [DEVICE_TIERS.MEDIUM]: 8000,
  [DEVICE_TIERS.HIGH]: 15000,
  [DEVICE_TIERS.ULTRA]: 25000
});

export const LIGHTING_THEMES = Object.freeze({
  dark: Object.freeze({ r: 20, g: 15, b: 40 }),
  purple: Object.freeze({ r: 80, g: 40, b: 120 }),
  magenta: Object.freeze({ r: 120, g: 30, b: 80 }),
  blue: Object.freeze({ r: 30, g: 60, b: 140 }),
  gold: Object.freeze({ r: 140, g: 110, b: 40 }),
  white: Object.freeze({ r: 200, g: 200, b: 220 })
});

export const PARTICLE_FAMILY_IDS = Object.freeze({
  AMBIENT_DUST: 'ambientDust',
  STARS: 'stars',
  ENERGY: 'energy',
  CONNECTIONS: 'connections',
  AI: 'ai',
  REVENUE: 'revenue',
  TRUST: 'trust'
});

export const CAMERA_DEFAULTS = Object.freeze({
  DRIFT_SPEED: 0.02,
  DRIFT_AMPLITUDE_X: 3,
  DRIFT_AMPLITUDE_Y: 2,
  ROTATION_AMPLITUDE: 0.0005,
  ZOOM_BASE: 1,
  ZOOM_AMPLITUDE: 0.002
});

export const FOG_CONFIG = Object.freeze({
  LAYER_COUNT: 3,
  BASE_OPACITY: 0.015,
  DRIFT_SPEED: 0.008
});

export const AUDIO_CHANNEL_IDS = Object.freeze({
  AMBIENT_DRONES: 'ambientDrones',
  PARTICLE_WHISPERS: 'particleWhispers',
  GLASS_INTERACTIONS: 'glassInteractions',
  ENVIRONMENTAL_SOUNDS: 'environmentalSounds'
});

export const LAYER_CATEGORIES = Object.freeze({
  ENVIRONMENT: 'environment',
  CONTENT: 'content',
  UI: 'ui'
});

export const LIGHT_SOURCE_IDS = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ACCENT: 'accent'
});

export const BEHAVIOR_IDS = Object.freeze({
  WANDER: 'wander',
  DRIFT: 'drift',
  ATTRACT: 'attract',
  ORBIT: 'orbit',
  REPEL: 'repel',
  IDLE: 'idle',
  FOLLOW: 'follow',
  ORGANIZE: 'organize'
});

export const CLUSTER_EVENTS = Object.freeze({
  FORMED: 'cluster:formed',
  DISSOLVED: 'cluster:dissolved',
  REFORMED: 'cluster:reformed'
});

export const SCENE_DIRECTOR_PHASES = Object.freeze({
  DORMANT: 'dormant',
  AWAKENING: 'awakening',
  EXPLORING: 'exploring',
  CONNECTING: 'connecting',
  FLOURISHING: 'flourishing'
});

export const TIMELINE_CHAPTERS = Object.freeze({
  VOID: 'void',
  FIRST_BREATH: 'firstBreath',
  AWAKENING: 'awakening',
  DISCOVERY: 'discovery',
  CONNECTION: 'connection',
  COMMUNITY: 'community'
});
