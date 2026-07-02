/**
 * Application Settings
 * Configurable runtime settings for the Kelza Experience Platform.
 */

export const settings = Object.freeze({
  debug: false,

  performance: Object.freeze({
    targetFPS: 60,
    fpsWarningThreshold: 45,
    memoryWarningMB: 512,
    maxDeltaTime: 0.1,
    enableMonitoring: false
  }),

  audio: Object.freeze({
    muted: true,
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    crossfadeDuration: 1.5
  }),

  scroll: Object.freeze({
    smooth: true,
    lerp: 0.1,
    duration: 1.2,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    infinite: false
  }),

  animation: Object.freeze({
    respectReducedMotion: true,
    defaultDuration: 0.3,
    defaultEase: 'power2.out',
    staggerInterval: 0.05
  }),

  cursor: Object.freeze({
    enabled: true,
    smoothing: 0.15,
    scale: 1,
    magneticStrength: 0.3
  }),

  features: Object.freeze({
    smoothScroll: true,
    customCursor: true,
    particles: true,
    postProcessing: true,
    ambientAudio: true,
    hapticFeedback: true
  }),

  three: Object.freeze({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)
  })
});
