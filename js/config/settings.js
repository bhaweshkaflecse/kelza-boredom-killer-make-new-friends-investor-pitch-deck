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
  }),

  universe: Object.freeze({
    particles: Object.freeze({
      initialDensity: 0.4,
      spawnRate: 5,
      baseSpeed: 8,
      depthLayers: 5,
      fadeInDuration: 0.1,
      fadeOutStart: 0.8,
      alphaMin: 0.1,
      alphaMax: 0.6,
      sizeMin: 0.3,
      sizeMax: 1.5,
      speedMin: -8,
      speedMax: 8,
      lifetimeMin: 8,
      lifetimeMax: 25
    }),
    lighting: Object.freeze({
      defaultTheme: 'dark',
      breathSpeed: 0.15,
      breathAmplitude: 0.03,
      transitionSpeed: 0.8,
      minOpacity: 0.02,
      maxOpacity: 0.08
    }),
    background: Object.freeze({
      baseColor: '#0a0a0f',
      layerCount: 7
    }),
    camera: Object.freeze({
      driftSpeed: 0.02,
      driftAmplitudeX: 3,
      driftAmplitudeY: 2,
      rotationAmplitude: 0.0005,
      zoomBase: 1,
      zoomAmplitude: 0.002,
      reducedMotionFactor: 0.2
    }),
    fog: Object.freeze({
      layerCount: 3,
      baseOpacity: 0.015,
      driftSpeed: 0.008,
      reducedMotionSpeedFactor: 0.3
    }),
    vignette: Object.freeze({
      intensity: 0.4,
      innerRadiusRatio: 0.3,
      outerRadiusRatio: 0.85
    }),
    gradients: Object.freeze({
      layerCount: 4,
      baseOpacity: 0.025,
      driftSpeed: 0.005,
      reducedMotionSpeedFactor: 0.3
    }),
    audioArchitecture: Object.freeze({
      muted: true,
      channels: Object.freeze([
        'ambientDrones',
        'particleWhispers',
        'glassInteractions',
        'environmentalSounds'
      ])
    }),
    debug: Object.freeze({
      enabled: false,
      showFPS: false,
      showParticles: false,
      showLighting: false,
      showSceneNames: false,
      showMemory: false,
      showRenderer: false
    })
  }),

  scene001: Object.freeze({
    particleFamilies: Object.freeze(['ambientDust', 'stars']),
    lightingTheme: 'dark',
    fogEnabled: true,
    gradientsEnabled: true,
    vignetteEnabled: true,
    cameraDrift: true
  })
});
