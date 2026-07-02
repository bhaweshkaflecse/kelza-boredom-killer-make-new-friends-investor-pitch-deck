/**
 * UniverseEngine
 * Top-level orchestrator for the living universe experience.
 * Owns all subsystems and integrates with Engine.js via manager pattern.
 */

import { MANAGER_STATES, UNIVERSE_LAYERS, DEVICE_TIERS } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { isReducedMotion } from '../../utils/helpers.js';
import { TimeEngine } from './TimeEngine.js';
import { CanvasManager } from './CanvasManager.js';
import { BackgroundRenderer } from './BackgroundRenderer.js';
import { ParticleEngine } from './ParticleEngine.js';
import { LightingEngine } from './LightingEngine.js';
import { CameraController } from './CameraController.js';
import { FogRenderer } from './FogRenderer.js';
import { VignetteRenderer } from './VignetteRenderer.js';
import { GradientRenderer } from './GradientRenderer.js';
import { StarTwinkleSystem } from './StarTwinkleSystem.js';
import { UniverseLayerManager, LAYER_CATEGORIES } from './UniverseLayerManager.js';

const FPS_CHECK_INTERVAL = 60;
const DEGRADATION_THRESHOLD = 45;
const RECOVERY_THRESHOLD = 55;
const DENSITY_REDUCTION_STEP = 0.1;
const DENSITY_RECOVERY_STEP = 0.05;
const MIN_DENSITY = 0.2;
const MAX_DENSITY = 1.0;
const STAR_TWINKLE_MAX = 500;

export class UniverseEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.timeEngine = new TimeEngine();
    this.canvasManager = new CanvasManager();
    this.backgroundRenderer = new BackgroundRenderer();
    this.particleEngine = new ParticleEngine();
    this.lightingEngine = new LightingEngine();
    this.cameraController = new CameraController();
    this.fogRenderer = new FogRenderer();
    this.vignetteRenderer = new VignetteRenderer();
    this.gradientRenderer = new GradientRenderer();
    this.starTwinkleSystem = new StarTwinkleSystem();
    this.layerManager = new UniverseLayerManager();
    this.reducedMotion = false;
    this.currentDensity = MAX_DENSITY;
    this.fpsCheckCounter = 0;
    this.performanceManager = null;
    this.cursorManager = null;
    this.container = null;
    this.fogActive = false;
    this.vignetteActive = false;
    this.gradientsActive = false;
    this.cameraDriftActive = false;
  }

  /**
   * Initialize the universe engine and all subsystems.
   * @param {Object} options - Initialization options
   * @param {HTMLElement} options.container - DOM container for the canvas
   * @param {Object} [options.performanceManager] - PerformanceManager reference
   * @param {Object} [options.cursorManager] - CursorManager reference
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
    const width = this.canvasManager.width;
    const height = this.canvasManager.height;
    this.backgroundRenderer.init(width, height);
    this.particleEngine.init(width, height, deviceTier, this.reducedMotion);
    this.lightingEngine.init(this.reducedMotion);
    this.cameraController.init(this.reducedMotion);
    this.fogRenderer.init(this.reducedMotion);
    this.vignetteRenderer.init(settings.universe.vignette.intensity);
    this.gradientRenderer.init(this.reducedMotion);
    this.starTwinkleSystem.init(STAR_TWINKLE_MAX, this.reducedMotion);
    this.layerManager.init();
    this.setupLayerRenderers();
    this.registerEnvironmentLayers();
    this.state = MANAGER_STATES.READY;
  }

  /** Wire up renderers to the background layer system. Zero per-frame allocations. */
  setupLayerRenderers() {
    const self = this;
    this.backgroundRenderer.setLayerRenderer(UNIVERSE_LAYERS.GRADIENTS, (ctx, time) => {
      if (!self.gradientsActive) return;
      self.gradientRenderer.render(ctx, self.canvasManager.width, self.canvasManager.height, time);
    });
    this.backgroundRenderer.setLayerRenderer(UNIVERSE_LAYERS.AMBIENT_LIGHTING, (ctx) => {
      self.lightingEngine.render(ctx, self.canvasManager.width, self.canvasManager.height);
    });
    this.backgroundRenderer.setLayerRenderer(UNIVERSE_LAYERS.PARTICLE_FIELD, (ctx) => {
      const offset = self.cameraController.getParallaxOffset(1);
      self.particleEngine.render(ctx, offset.x, offset.y);
    });
    this.backgroundRenderer.setLayerActive(UNIVERSE_LAYERS.DEPTH_FOG, true);
    this.backgroundRenderer.setLayerRenderer(UNIVERSE_LAYERS.DEPTH_FOG, (ctx, time) => {
      if (!self.fogActive) return;
      self.fogRenderer.render(ctx, self.canvasManager.width, self.canvasManager.height, time);
    });
    this.backgroundRenderer.setLayerActive(UNIVERSE_LAYERS.SCENE_OVERLAYS, true);
    this.backgroundRenderer.setLayerRenderer(UNIVERSE_LAYERS.SCENE_OVERLAYS, (ctx) => {
      if (!self.vignetteActive) return;
      self.vignetteRenderer.render(ctx, self.canvasManager.width, self.canvasManager.height);
    });
  }

  /** Register environment layers with the UniverseLayerManager. */
  registerEnvironmentLayers() {
    const ids = ['deepSpace', 'gradients', 'ambientLighting', 'particleField', 'depthFog', 'vignette'];
    for (let i = 0; i < ids.length; i++) {
      this.layerManager.registerLayer({
        id: ids[i], zIndex: i, category: LAYER_CATEGORIES.ENVIRONMENT,
        renderFn: null, updateFn: null, active: true
      });
    }
  }

  /** @returns {string} Device tier identifier */
  getDeviceTier() {
    if (this.performanceManager && this.performanceManager.getDeviceTier) {
      return this.performanceManager.getDeviceTier();
    }
    return DEVICE_TIERS.HIGH;
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
    if (this.cameraDriftActive) this.cameraController.update(scaledDelta, elapsedTime);
    this.lightingEngine.update(scaledDelta, elapsedTime);
    this.particleEngine.update(scaledDelta, elapsedTime);
    this.starTwinkleSystem.update(scaledDelta, elapsedTime);
    this.applyStarTwinkle();
    this.adaptPerformance();
    this.render();
  }

  /** Apply star twinkle brightness to star-family particles. Gated on fade-in completion. */
  applyStarTwinkle() {
    const starSlot = this.particleEngine.getStarSlot();
    if (!starSlot) return;
    const starFamily = this.particleEngine.families[starSlot.familyIndex];
    const fadeInThreshold = starFamily ? starFamily.fadeInDuration : 0.2;
    this.starTwinkleSystem.setActiveCount(starSlot.count);
    const pool = this.particleEngine.pool;
    const end = Math.min(starSlot.start + starSlot.count, pool.length);
    for (let i = starSlot.start; i < end; i++) {
      const p = pool[i];
      if (!p.active) continue;
      const lifeRatio = p.lifetime / p.maxLifetime;
      if (lifeRatio < fadeInThreshold) continue;
      const twinkle = this.starTwinkleSystem.getBrightness(i - starSlot.start);
      if (twinkle > 0) {
        p.opacity = Math.min(p.targetOpacity, p.opacity + twinkle * p.targetOpacity);
      }
    }
  }

  /** Broadcast cursor position to particle system. */
  updateCursorBroadcast() {
    if (!this.cursorManager) return;
    const pos = this.cursorManager.smoothPosition || { x: 0, y: 0 };
    this.particleEngine.setCursorPosition(pos.x, pos.y);
  }

  /** Render the complete universe frame. */
  render() {
    const ctx = this.canvasManager.getContext();
    if (!ctx) return;
    this.canvasManager.clear();
    this.backgroundRenderer.render(ctx, this.timeEngine.getTime(), this.timeEngine.getDelta());
  }

  /** Adapt rendering quality based on FPS. */
  adaptPerformance() {
    this.fpsCheckCounter++;
    if (this.fpsCheckCounter < FPS_CHECK_INTERVAL) return;
    this.fpsCheckCounter = 0;
    if (!this.performanceManager) return;
    const fps = this.performanceManager.getFPS();
    if (fps === 0) return;
    if (fps < DEGRADATION_THRESHOLD) {
      this.currentDensity = Math.max(MIN_DENSITY, this.currentDensity - DENSITY_REDUCTION_STEP);
      this.particleEngine.setDensity(this.currentDensity);
    } else if (fps > RECOVERY_THRESHOLD && this.currentDensity < MAX_DENSITY) {
      this.currentDensity = Math.min(MAX_DENSITY, this.currentDensity + DENSITY_RECOVERY_STEP);
      this.particleEngine.setDensity(this.currentDensity);
    }
  }

  /** @param {Object[]} familyConfigs - Array of family config objects */
  setParticleFamilies(familyConfigs) { this.particleEngine.setFamilies(familyConfigs); }

  /** @param {boolean} active */
  setFogActive(active) { this.fogActive = active; }

  /** @param {boolean} active */
  setGradientsActive(active) { this.gradientsActive = active; }

  /** @param {boolean} active */
  setVignetteActive(active) { this.vignetteActive = active; }

  /** @param {boolean} active */
  setCameraDriftActive(active) { this.cameraDriftActive = active; }

  /** @param {number} width @param {number} height */
  resize(width, height) {
    this.canvasManager.resize(width, height);
    this.backgroundRenderer.resize(width, height);
    this.particleEngine.resize(width, height);
    this.fogRenderer.resize(width, height);
  }

  /**
   * Set reduced motion preference for all subsystems.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
    this.particleEngine.setReducedMotion(enabled);
    this.lightingEngine.setReducedMotion(enabled);
    this.cameraController.setReducedMotion(enabled);
    this.fogRenderer.setReducedMotion(enabled);
    this.gradientRenderer.setReducedMotion(enabled);
    this.starTwinkleSystem.setReducedMotion(enabled);
  }

  /** @param {string} themeName - Theme identifier */
  setTheme(themeName) { this.lightingEngine.setTheme(themeName); }

  /**
   * Get access to a subsystem.
   * @param {string} name - Subsystem name
   * @returns {Object|undefined}
   */
  getSubsystem(name) {
    const map = {
      time: this.timeEngine, canvas: this.canvasManager,
      background: this.backgroundRenderer, particles: this.particleEngine,
      lighting: this.lightingEngine, camera: this.cameraController,
      fog: this.fogRenderer, vignette: this.vignetteRenderer,
      gradients: this.gradientRenderer, starTwinkle: this.starTwinkleSystem,
      layers: this.layerManager
    };
    return map[name];
  }

  /**
   * Get the particle pool array for external subsystem access.
   * @returns {Object[]} Particle pool
   */
  getParticlePool() {
    return this.particleEngine.pool;
  }

  /**
   * Get the active particle count.
   * @returns {number} Active particle count
   */
  getActiveCount() {
    return this.particleEngine.activeCount;
  }

  /**
   * Get the canvas width.
   * @returns {number} Width in pixels
   */
  getWidth() {
    return this.canvasManager.width;
  }

  /**
   * Get the canvas height.
   * @returns {number} Height in pixels
   */
  getHeight() {
    return this.canvasManager.height;
  }

  /**
   * Apply an external behavior system to particles during update.
   * Called by scenes that manage their own behavior subsystems.
   * @param {Object} behaviorSystem - BehaviorSystem instance
   * @param {number} deltaTime - Frame delta
   * @param {number} elapsedTime - Elapsed time
   */
  applyBehaviors(behaviorSystem, deltaTime, elapsedTime) {
    if (!behaviorSystem) return;
    behaviorSystem.update(
      this.particleEngine.pool,
      this.particleEngine.activeCount,
      deltaTime,
      elapsedTime
    );
  }

  /** Destroy the universe engine and all subsystems. */
  destroy() {
    this.layerManager.destroy();
    this.starTwinkleSystem.destroy();
    this.gradientRenderer.destroy();
    this.vignetteRenderer.destroy();
    this.fogRenderer.destroy();
    this.cameraController.destroy();
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
