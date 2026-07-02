/**
 * Scene003_FirstConnection
 * The first emotional milestone - two particles discover each other and form
 * a single, fragile connection. Nothing flashy. The moment should almost be
 * missed, but anyone paying attention should feel something meaningful.
 *
 * Emotional timeline: 0-18s
 * 1. (0-3s)   Settle - environment continues from Scene002
 * 2. (3-7s)   Discovery - ConnectionManager searches for candidate pair
 * 3. (7-11s)  Approach - two particles drift closer
 * 4. (11-12.5s) The Pause - emotional stillness
 * 5. (12.5-14.5s) Filament - living line fades in
 * 6. (14.5-17s) Pulse and Ripple - hope travels, environment responds
 * 7. (17-18s)  Settle - scene marks completed
 */

import {
  SCENE_STATES, BEHAVIOR_IDS, UNIVERSE_LAYERS, CONNECTION_STATES
} from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { BehaviorSystem } from '../engine/universe/BehaviorSystem.js';
import { ConnectionPrediction } from '../engine/universe/ConnectionPrediction.js';
import { ConnectionManager } from '../engine/universe/ConnectionManager.js';
import { CONNECTION_EVENTS } from '../engine/universe/ConnectionEvents.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import {
  buildScene003Phases,
  SCENE003_DURATION
} from './scene003/Scene003Phases.js';

const SCENE_ID = 'scene003_firstConnection';
const SCENE003 = settings.scene003;
const REDUCED_MOTION_CAMERA_SCALE = 0.2;
const CAMERA_ATTENTION_SCALE = 0.15;

export class Scene003_FirstConnection {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;

    // Subsystems
    this.behaviorSystem = null;
    this.connectionPrediction = null;
    this.connectionManager = null;
    this.audioArchitecture = null;
    this.director = null;

    // State trackers
    this.elapsedTime = 0;
    this.fieldStrengthMultiplier = 0;
    this.completed = false;
    this.rippleApplied = false;
    this.cameraAttentionActive = false;
    this.reducedMotion = false;
    this.skipEnvironmentTeardown = false;
  }

  /**
   * Get the scene identifier.
   * @returns {string} Scene id
   */
  getId() {
    return this.id;
  }

  /**
   * Set reference to the universe engine.
   * @param {Object} universe - UniverseEngine instance
   */
  setUniverse(universe) {
    this.universe = universe;
  }

  /**
   * Load scene assets (none required for this scene).
   * @returns {Promise<void>}
   */
  async load() {
    this.state = SCENE_STATES.LOADING;
  }

  /**
   * Enter the scene - initialize all Scene003 subsystems.
   * @returns {Promise<void>}
   */
  async enter() {
    this.state = SCENE_STATES.ENTERING;
    this.elapsedTime = 0;
    this.completed = false;
    this.rippleApplied = false;
    this.cameraAttentionActive = false;
    this.reducedMotion = isReducedMotion();

    if (this.universe) {
      this.initSubsystems();
      this.initAudioHooks();
      this.initDirector();
      this.activateEnvironment();
      this.registerConstellationsLayer();
    }

    this.state = SCENE_STATES.ACTIVE;
  }

  /**
   * Initialize behavioral and connection subsystems.
   */
  initSubsystems() {
    const maxParticles = this.universe.particleEngine.maxCount;

    this.behaviorSystem = new BehaviorSystem();
    this.behaviorSystem.init();
    this.behaviorSystem.enable(BEHAVIOR_IDS.WANDER);
    this.behaviorSystem.enable(BEHAVIOR_IDS.DRIFT);

    this.connectionPrediction = new ConnectionPrediction();
    this.connectionPrediction.init(maxParticles);

    // Pass prediction explicitly - no monkey-patching onto universe
    this.connectionManager = new ConnectionManager();
    this.connectionManager.init(this.universe, this.connectionPrediction);

    // Event-driven camera and ripple: synchronized with actual connection state
    this.connectionManager.on(
      CONNECTION_EVENTS.CONNECTION_CREATED,
      () => { this.beginCameraAttention(); }
    );
    this.connectionManager.on(
      CONNECTION_EVENTS.PULSE_STARTED,
      () => { this.triggerEnvironmentalRipple(); }
    );
  }

  /**
   * Initialize audio architecture with connection event hooks.
   */
  initAudioHooks() {
    this.audioArchitecture = new AudioArchitecture();
    this.audioArchitecture.init();

    this.audioArchitecture.registerEvent('connection_discovered');
    this.audioArchitecture.registerEvent('connection_created');
    this.audioArchitecture.registerEvent('pulse_started');
    this.audioArchitecture.registerEvent('pulse_finished');
    this.audioArchitecture.registerEvent('connection_broken');
  }

  /**
   * Initialize the SceneDirector with emotional phases.
   */
  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);

    const phases = buildScene003Phases(this);
    this.director.setPhases(phases);
    this.director.start();
  }

  /**
   * Activate the base environment for this scene.
   */
  activateEnvironment() {
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
  }

  /**
   * Register the CONSTELLATIONS layer for connection rendering.
   */
  registerConstellationsLayer() {
    const bgRenderer = this.universe.backgroundRenderer;
    const connMgr = this.connectionManager;

    bgRenderer.setLayerActive(UNIVERSE_LAYERS.CONSTELLATIONS, true);
    bgRenderer.setLayerRenderer(
      UNIVERSE_LAYERS.CONSTELLATIONS,
      (ctx, time, deltaTime) => {
        connMgr.render(ctx, deltaTime);
      }
    );
  }

  /**
   * Update the scene each frame. Advances emotional timeline.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== SCENE_STATES.ACTIVE) return;

    this.elapsedTime += deltaTime;
    this.director.update(deltaTime);
    this.updateSubsystems(deltaTime);
    this.updateCameraAttention();
  }

  /**
   * Update all active subsystems with current frame data.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateSubsystems(deltaTime) {
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;

    this.connectionPrediction.update(pool, activeCount);
    this.behaviorSystem.update(pool, activeCount, deltaTime, this.elapsedTime);
    this.connectionManager.update(deltaTime, this.elapsedTime);
    this.applyFieldForces(pool, activeCount);
  }

  /**
   * Apply gentle field forces to particles based on current multiplier.
   * @param {Object[]} pool - Particle pool
   * @param {number} activeCount - Active particle count
   */
  applyFieldForces(pool, activeCount) {
    if (this.fieldStrengthMultiplier <= 0) return;
    const strength = this.fieldStrengthMultiplier * SCENE003.approachForce;

    for (let i = 0; i < activeCount; i++) {
      const p = pool[i];
      if (!p.active) continue;
      p.ax += (p.vx > 0 ? -1 : 1) * strength * 0.1;
      p.ay += (p.vy > 0 ? -1 : 1) * strength * 0.1;
    }
  }

  /**
   * Update camera attention toward the connected pair.
   */
  updateCameraAttention() {
    if (!this.cameraAttentionActive) return;

    const connState = this.connectionManager.getConnectionState();
    if (connState !== CONNECTION_STATES.CONNECTED) return;

    const particles = this.connectionManager.getConnectedParticles();
    if (!particles.particleA || !particles.particleB) return;

    const midX = (particles.particleA.x + particles.particleB.x) * 0.5;
    const midY = (particles.particleA.y + particles.particleB.y) * 0.5;

    const width = this.universe.canvasManager.width;
    const height = this.universe.canvasManager.height;

    // Normalize to camera bias range (centered around 0)
    const offsetX = (midX - width * 0.5) / (width * 0.5);
    const offsetY = (midY - height * 0.5) / (height * 0.5);

    const scale = this.reducedMotion
      ? CAMERA_ATTENTION_SCALE * REDUCED_MOTION_CAMERA_SCALE
      : CAMERA_ATTENTION_SCALE;

    const targetX = offsetX * scale * SCENE003.cameraEaseSpeed;
    const targetY = offsetY * scale * SCENE003.cameraEaseSpeed;

    this.universe.cameraController.setTarget(targetX, targetY);
  }

  /**
   * Begin camera attention toward the connection midpoint.
   * Called by Phase 5 onEnter.
   */
  beginCameraAttention() {
    this.cameraAttentionActive = true;
  }

  /**
   * Trigger a one-time environmental ripple outward from connection midpoint.
   * Called by Phase 6 onEnter.
   */
  triggerEnvironmentalRipple() {
    if (this.rippleApplied) return;
    this.rippleApplied = true;

    const particles = this.connectionManager.getConnectedParticles();
    if (!particles.particleA || !particles.particleB) return;

    const midX = (particles.particleA.x + particles.particleB.x) * 0.5;
    const midY = (particles.particleA.y + particles.particleB.y) * 0.5;

    this.applyRippleForce(midX, midY);
    this.audioArchitecture.emit('connection_created');
  }

  /**
   * Apply a subtle radial force to particles within ripple radius.
   * @param {number} cx - Center X of ripple
   * @param {number} cy - Center Y of ripple
   */
  applyRippleForce(cx, cy) {
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;
    const radiusSq = SCENE003.rippleRadius * SCENE003.rippleRadius;
    const strength = SCENE003.rippleStrength;

    for (let i = 0; i < activeCount; i++) {
      const p = pool[i];
      if (!p.active) continue;

      const dx = p.x - cx;
      const dy = p.y - cy;
      const distSq = dx * dx + dy * dy;

      if (distSq >= radiusSq || distSq < 1) continue;

      const dist = Math.sqrt(distSq);
      const invDist = 1 / dist;
      const falloff = 1 - (dist / SCENE003.rippleRadius);

      p.ax += dx * invDist * strength * falloff;
      p.ay += dy * invDist * strength * falloff;
    }
  }

  /**
   * Mark the scene as completed.
   */
  markCompleted() {
    this.completed = true;
  }

  /**
   * Check if the scene has completed its timeline.
   * @returns {boolean}
   */
  isCompleted() {
    return this.completed;
  }

  /**
   * Leave the scene - deactivate all Scene003 systems.
   * @returns {Promise<void>}
   */
  async leave() {
    this.state = SCENE_STATES.LEAVING;

    this.deactivateConstellationsLayer();
    this.destroySubsystems();

    if (this.universe && !this.skipEnvironmentTeardown) {
      this.universe.cameraController.clearClusterBias();
      this.universe.cameraController.setTarget(0, 0);
      this.universe.setFogActive(false);
      this.universe.setVignetteActive(false);
      this.universe.setGradientsActive(false);
      this.universe.setCameraDriftActive(false);
    }

    this.state = SCENE_STATES.CLEANUP;
  }

  /**
   * Deactivate the CONSTELLATIONS rendering layer.
   */
  deactivateConstellationsLayer() {
    if (!this.universe) return;
    const bgRenderer = this.universe.backgroundRenderer;
    bgRenderer.setLayerActive(UNIVERSE_LAYERS.CONSTELLATIONS, false);
    bgRenderer.setLayerRenderer(UNIVERSE_LAYERS.CONSTELLATIONS, null);
  }

  /**
   * Destroy all subsystems created by this scene.
   */
  destroySubsystems() {
    if (this.director) { this.director.destroy(); this.director = null; }
    if (this.behaviorSystem) { this.behaviorSystem.destroy(); this.behaviorSystem = null; }
    if (this.connectionPrediction) { this.connectionPrediction.destroy(); this.connectionPrediction = null; }
    if (this.connectionManager) { this.connectionManager.destroy(); this.connectionManager = null; }
    if (this.audioArchitecture) { this.audioArchitecture.destroy(); this.audioArchitecture = null; }
  }

  /**
   * Destroy the scene and release all references.
   */
  destroy() {
    this.destroySubsystems();
    this.universe = null;
    this.state = SCENE_STATES.DESTROYED;
  }
}
