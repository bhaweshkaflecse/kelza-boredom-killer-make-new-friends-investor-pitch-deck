/**
 * UniverseEngine
 * Top-level orchestrator for the living universe experience.
 * Owns TimeEngine, CanvasManager, BackgroundRenderer, ParticleEngine, LightingEngine.
 * Integrates with Engine.js via the standard manager pattern.
 */

import { MANAGER_STATES, UNIVERSE_LAYERS, DEVICE_TIERS } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { isReducedMotion } from '../../utils/helpers.js';
import { TimeEngine } from './TimeEngine.js';
import { CanvasManager } from './CanvasManager.js';
import { BackgroundRenderer } from './BackgroundRenderer.js';
import { ParticleEngine } from './ParticleEngine.js';
import { LightingEngine } from './LightingEngine.js';

const FPS_CHECK_INTERVAL = 60;
const DEGRADATION_THRESHOLD = 45;
const RECOVERY_THRESHOLD = 55;
const DENSITY_REDUCTION_STEP = 0.1;
const DENSITY_RECOVERY_STEP = 0.05;
const MIN_DENSITY = 0.2;
const MAX_DENSITY = 1.0;

export class UniverseEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.timeEngine = new TimeEngine();
    this.canvasManager = new CanvasManager();
    this.backgroundRenderer = new BackgroundRenderer();
    this.particleEngine = new ParticleEngine();
    this.lightingEngine = new LightingEngine();
    this.reducedMotion = false;
    this.currentDensity = MAX_DENSITY;
    this.fpsCheckCounter = 0;
    this.performanceManager = null;
    this.cursorManager = null;
    this.container = null;
  }

  /**
   * Initialize the universe engine and all subsystems.
   * @param {Object} options - Initialization options
   * @param {HTMLElement} options.container - DOM container for the canvas
   * @param {Object} [options.performanceManager] - Reference to PerformanceManager
   * @param {Object} [options.cursorManager] - Reference to CursorManager
   */
  init(options = {}) {
    this.state = MANAGER_STATES.INITIALIZING;
    this.container = options.container;
    this.performanceManager = options.performanceManager || null;
    this.cursorManager = options.cursorManager || null;
    this.reducedMotion = isReducedMotion();

    const deviceTier = this.getDeviceTier();

    this.timeEngine.init();
    this.canvasManager.init(this.container);

    const { width, height } = this.canvasManager.getDimensions();

    this.backgroundRenderer.init(width, height);
    this.particleEngine.init(width, height, deviceTier, this.reducedMotion);
    this.lightingEngine.init(this.reducedMotion);

    this.setupLayerRenderers();
    this.logDebugInfo(deviceTier);

    this.state = MANAGER_STATES.READY;
  }

  /**
   * Wire up particle and lighting renderers to the background layer system.
   */
  setupLayerRenderers() {
    this.backgroundRenderer.setLayerRenderer(
      UNIVERSE_LAYERS.PARTICLE_FIELD,
      (ctx) => { this.particleEngine.render(ctx); }
    );

    this.backgroundRenderer.setLayerRenderer(
      UNIVERSE_LAYERS.AMBIENT_LIGHTING,
      (ctx) => {
        const { width, height } = this.canvasManager.getDimensions();
        this.lightingEngine.render(ctx, width, height);
      }
    );
  }

  /**
   * Get the device tier from the performance manager or fallback.
   * @returns {string} Device tier identifier
   */
  getDeviceTier() {
    if (this.performanceManager && this.performanceManager.getDeviceTier) {
      return this.performanceManager.getDeviceTier();
    }
    return DEVICE_TIERS.HIGH;
  }

  /**
   * Log debug information if debug mode is enabled.
   * @param {string} deviceTier - Detected device tier
   */
  logDebugInfo(deviceTier) {
    if (!settings.universe.debug.enabled) return;

    const { width, height, pixelRatio } = this.canvasManager.getDimensions();
    console.log('[UniverseEngine] Initialized', {
      deviceTier,
      canvasSize: `${width}x${height}`,
      pixelRatio,
      reducedMotion: this.reducedMotion,
      particleTarget: this.particleEngine.targetCount
    });
  }

  /**
   * Update the universe each frame. Called by Engine.tick().
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.timeEngine.update(deltaTime);

    const elapsedTime = this.timeEngine.getTime();
    const scaledDelta = this.timeEngine.getDelta();

    this.updateCursorBroadcast();
    this.lightingEngine.update(scaledDelta, elapsedTime);
    this.particleEngine.update(scaledDelta, elapsedTime);
    this.adaptPerformance();
    this.render();
  }

  /**
   * Broadcast cursor position from CursorManager to particle system.
   */
  updateCursorBroadcast() {
    if (!this.cursorManager) return;

    const { x, y } = this.cursorManager.smoothPosition || { x: 0, y: 0 };
    this.particleEngine.setCursorPosition(x, y);
  }

  /**
   * Render the complete universe frame.
   */
  render() {
    const ctx = this.canvasManager.getContext();
    if (!ctx) return;

    this.canvasManager.clear();

    const time = this.timeEngine.getTime();
    const delta = this.timeEngine.getDelta();

    this.backgroundRenderer.render(ctx, time, delta);
  }

  /**
   * Adapt rendering quality based on FPS performance.
   */
  adaptPerformance() {
    this.fpsCheckCounter++;
    if (this.fpsCheckCounter < FPS_CHECK_INTERVAL) return;
    this.fpsCheckCounter = 0;

    if (!this.performanceManager) return;

    const fps = this.performanceManager.getFPS();
    if (fps === 0) return;

    if (fps < DEGRADATION_THRESHOLD) {
      this.degradeQuality();
    } else if (fps > RECOVERY_THRESHOLD && this.currentDensity < MAX_DENSITY) {
      this.recoverQuality();
    }
  }

  /**
   * Reduce rendering quality to maintain performance.
   */
  degradeQuality() {
    this.currentDensity = Math.max(
      MIN_DENSITY,
      this.currentDensity - DENSITY_REDUCTION_STEP
    );
    this.particleEngine.setDensity(this.currentDensity);
  }

  /**
   * Gradually recover rendering quality when FPS is stable.
   */
  recoverQuality() {
    this.currentDensity = Math.min(
      MAX_DENSITY,
      this.currentDensity + DENSITY_RECOVERY_STEP
    );
    this.particleEngine.setDensity(this.currentDensity);
  }

  /**
   * Handle window resize event.
   * @param {number} width - New viewport width
   * @param {number} height - New viewport height
   */
  resize(width, height) {
    this.canvasManager.resize(width, height);
    this.backgroundRenderer.resize(width, height);
    this.particleEngine.resize(width, height);
  }

  /**
   * Set reduced motion preference for all subsystems.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
    this.particleEngine.setReducedMotion(enabled);
    this.lightingEngine.setReducedMotion(enabled);
  }

  /**
   * Set the lighting theme.
   * @param {string} themeName - Theme identifier
   */
  setTheme(themeName) {
    this.lightingEngine.setTheme(themeName);
  }

  /**
   * Get access to a subsystem engine.
   * @param {string} name - Subsystem name (time, canvas, background, particles, lighting)
   * @returns {Object|undefined} Subsystem instance
   */
  getSubsystem(name) {
    const map = {
      time: this.timeEngine,
      canvas: this.canvasManager,
      background: this.backgroundRenderer,
      particles: this.particleEngine,
      lighting: this.lightingEngine
    };
    return map[name];
  }

  /**
   * Destroy the universe engine and all subsystems.
   */
  destroy() {
    this.lightingEngine.destroy();
    this.particleEngine.destroy();
    this.backgroundRenderer.destroy();
    this.canvasManager.destroy();
    this.timeEngine.destroy();
    this.performanceManager = null;
    this.cursorManager = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
