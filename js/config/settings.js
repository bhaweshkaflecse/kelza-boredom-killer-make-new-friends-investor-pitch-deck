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
  }),

  scene003: Object.freeze({
    discoveryMinTime: 3.0,
    approachDuration: 4.0,
    pauseDuration: 1.5,
    filamentFadeInDuration: 2.0,
    pulseDuration: 2.5,
    pulseSize: 2.0,
    filamentMaxOpacity: 0.18,
    filamentMaxWidth: 1.4,
    filamentBreathSpeed: 0.3,
    filamentNoiseScale: 0.01,
    approachForce: 0.08,
    pauseRadius: 25,
    discoveryRadius: 100,
    rippleStrength: 0.002,
    rippleRadius: 200,
    cameraEaseSpeed: 0.8
  }),

  scene004: Object.freeze({
    influence: Object.freeze({
      radius: 180,
      strength: 0.12,
      decayRate: 0.985,
      expansionSpeed: 8,
      connectionWeight: 1.0,
      maxSources: 8
    }),
    ripple: Object.freeze({
      speed: 3,
      maxRadius: 400,
      decayRate: 0.992,
      residualStrength: 0.04,
      expansionDelay: 4.0,
      maxRipples: 4
    }),
    curiosity: Object.freeze({
      searchStrength: 0.06,
      noiseScale: 0.008,
      noiseSpeed: 0.3,
      activationThreshold: 0.05,
      deactivationRadius: 250,
      seed: 523
    }),
    synchronization: Object.freeze({
      groupSize: 4,
      syncDuration: 3.0,
      divergeDuration: 2.0,
      syncStrength: 0.03,
      detectionRadius: 60,
      maxGroups: 6,
      updateInterval: 12,
      seed: 631
    }),
    phases: Object.freeze({
      silence: Object.freeze({ start: 0, duration: 4 }),
      influence: Object.freeze({ start: 4, duration: 6 }),
      ripple: Object.freeze({ start: 10, duration: 6 }),
      discovery: Object.freeze({ start: 16, duration: 5 }),
      hope: Object.freeze({ start: 21, duration: 4 })
    }),
    environment: Object.freeze({
      warmthTransitionSpeed: 0.4,
      fogBreathSpeedMult: 1.3,
      densityIncrease: 0.02
    }),
    camera: Object.freeze({
      broadenSpeed: 0.3,
      influenceTrackingWeight: 0.08,
      maxBroadenRadius: 5,
      reducedMotionFactor: 0.2
    })
  }),

  scene002: Object.freeze({
    intelligenceField: Object.freeze({
      strength: 0.002,
      noiseSpeed: 0.08,
      noiseScale: 0.003,
      gridResolution: 32,
      seed: 137
    }),
    behaviors: Object.freeze({
      enabled: Object.freeze(['wander', 'drift', 'organize']),
      wander: Object.freeze({
        strength: 0.15,
        noiseScale: 0.01,
        noiseSpeed: 0.4,
        seed: 201
      }),
      drift: Object.freeze({
        strength: 0.05,
        directionX: 0.3,
        directionY: -0.1,
        variation: 0.02
      }),
      organize: Object.freeze({
        strength: 0.08,
        pullFactor: 0.002,
        dampening: 0.95
      })
    }),
    clusters: Object.freeze({
      minSize: 3,
      maxSize: 8,
      radius: 80,
      updateInterval: 8,
      noiseSpeed: 0.05,
      thresholdMin: 0.3,
      thresholdMax: 0.7,
      seed: 311
    }),
    connections: Object.freeze({
      maxNeighbors: 5,
      updateInterval: 4,
      gridCellSize: 100,
      maxDistance: 120
    }),
    pulses: Object.freeze({
      maxConcurrent: 3,
      spawnInterval: 4.0,
      spawnVariation: 2.0,
      strength: 0.003,
      speed: 60,
      maxRadius: 300,
      decayRate: 0.92,
      seed: 419
    }),
    depth: Object.freeze({
      minDepth: 0,
      maxDepth: 8
    }),
    cameraIntelligence: Object.freeze({
      clusterBias: 0.15,
      biasSpeed: 0.5
    })
  })
});
