/**
 * Scene004_Ripple
 * The first connection quietly changes the universe through influence.
 * One relationship inspires another -- not through magic, through influence.
 *
 * Emotional timeline: 0-25s
 * 1. (0-4s)   Silence - pause after the connection pulse. Anticipation.
 * 2. (4-10s)  Influence - InfluenceEngine activates, first particle changes.
 * 3. (10-16s) Ripple - RipplePropagation expands, more particles affected.
 * 4. (16-21s) Discovery - CuriosityBehavior + micro-sync begin.
 * 5. (21-25s) Hope - environment warms, scene marks completed.
 *
 * The ONE visible connection line persists (CONSTELLATIONS layer stays active).
 * No additional visible connections are created. Everything else is influence.
 */

import {
  SCENE_STATES, BEHAVIOR_IDS, UNIVERSE_LAYERS, INFLUENCE_TYPES
} from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { BehaviorSystem } from '../engine/universe/BehaviorSystem.js';
import { InfluenceEngine } from '../engine/universe/InfluenceEngine.js';
import { RipplePropagation } from '../engine/universe/RipplePropagation.js';
import { CuriosityBehavior } from '../engine/universe/CuriosityBehavior.js';
import { SynchronizationSystem } from '../engine/universe/SynchronizationSystem.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import {
  buildScene004Phases, SCENE004_DURATION
} from './scene004/Scene004Phases.js';

const SCENE_ID = 'scene004_ripple';
const SCENE004 = settings.scene004;

export class Scene004_Ripple {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;

    // Subsystems
    this.influenceEngine = null;
    this.ripplePropagation = null;
    this.curiosityBehavior = null;
    this.synchronizationSystem = null;
    this.behaviorSystem = null;
    this.audioArchitecture = null;
    this.director = null;

    // Connection data passed from Engine
    this.connectionMidX = 0;
    this.connectionMidY = 0;
    this.connectionIndexA = -1;
    this.connectionIndexB = -1;

    // State trackers
    this.elapsedTime = 0;
    this.completed = false;
    this.influenceActive = false;
    this.rippleActive = false;
    this.curiosityActive = false;
    this.syncActive = false;
    this.environmentActive = false;
    this.cameraBroadenProgress = 0;
    this.reducedMotion = false;
  }

  /** @returns {string} Scene identifier */
  getId() { return this.id; }

  /**
   * Set reference to the universe engine.
   * @param {Object} universe - UniverseEngine instance
   */
  setUniverse(universe) { this.universe = universe; }

  /**
   * Receive connection data from Engine (midpoint + indices).
   * @param {number} midX - Connection midpoint X
   * @param {number} midY - Connection midpoint Y
   * @param {number} indexA - Connected particle A index
   * @param {number} indexB - Connected particle B index
   */
  setConnectionData(midX, midY, indexA, indexB) {
    this.connectionMidX = midX;
    this.connectionMidY = midY;
    this.connectionIndexA = indexA;
    this.connectionIndexB = indexB;
  }

  /**
   * Load scene assets (none required).
   * @returns {Promise<void>}
   */
  async load() { this.state = SCENE_STATES.LOADING; }

  /**
   * Enter the scene - initialize all Scene004 subsystems.
   * @returns {Promise<void>}
   */
  async enter() {
    this.state = SCENE_STATES.ENTERING;
    this.elapsedTime = 0;
    this.completed = false;
    this.influenceActive = false;
    this.rippleActive = false;
    this.curiosityActive = false;
    this.syncActive = false;
    this.environmentActive = false;
    this.cameraBroadenProgress = 0;
    this.reducedMotion = isReducedMotion();

    if (this.universe) {
      this.initSubsystems();
      this.initAudioHooks();
      this.initDirector();
      this.activateEnvironment();
      this.keepConstellationsLayer();
    }

    this.state = SCENE_STATES.ACTIVE;
  }

  /**
   * Initialize all subsystems for Scene004.
   */
  initSubsystems() {
    const width = this.universe.canvasManager.width;
    const height = this.universe.canvasManager.height;
    const maxParticles = this.universe.particleEngine.maxCount;

    // Influence engine - places source at connection midpoint
    this.influenceEngine = new InfluenceEngine();
    this.influenceEngine.init(width, height);

    // Ripple propagation - invisible expanding wave
    this.ripplePropagation = new RipplePropagation();
    this.ripplePropagation.init();

    // Curiosity behavior - searching motion inside influence
    this.curiosityBehavior = new CuriosityBehavior();

    // Synchronization - micro-sync for small groups
    this.synchronizationSystem = new SynchronizationSystem();
    this.synchronizationSystem.init(maxParticles);
    this.synchronizationSystem.setReducedMotion(this.reducedMotion);

    // Local behavior system with curiosity registered
    this.behaviorSystem = new BehaviorSystem();
    this.behaviorSystem.init();
    this.behaviorSystem.register(BEHAVIOR_IDS.CURIOSITY, this.curiosityBehavior);
    this.behaviorSystem.setContext({ influenceEngine: this.influenceEngine });
  }

  /**
   * Initialize audio architecture with scene-specific event hooks.
   */
  initAudioHooks() {
    this.audioArchitecture = new AudioArchitecture();
    this.audioArchitecture.init();

    this.audioArchitecture.registerEvent('influence_started');
    this.audioArchitecture.registerEvent('ripple_expanding');
    this.audioArchitecture.registerEvent('curiosity_detected');
    this.audioArchitecture.registerEvent('synchronization_started');
  }

  /**
   * Initialize the SceneDirector with emotional phases.
   */
  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);

    const phases = buildScene004Phases(this);
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
   * Keep the CONSTELLATIONS layer active so the one connection line persists.
   * Scene003 registered the layer renderer; we ensure it stays active.
   */
  keepConstellationsLayer() {
    const bgRenderer = this.universe.backgroundRenderer;
    bgRenderer.setLayerActive(UNIVERSE_LAYERS.CONSTELLATIONS, true);
  }

  /**
   * Update the scene each frame.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== SCENE_STATES.ACTIVE) return;

    this.elapsedTime += deltaTime;
    this.director.update(deltaTime);
    this.updateSubsystems(deltaTime);
  }

  /**
   * Update all active subsystems.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateSubsystems(deltaTime) {
    if (this.influenceActive) {
      this.influenceEngine.update(deltaTime);
    }

    if (this.rippleActive) {
      this.ripplePropagation.update(deltaTime);
    }

    // Update behavior system with curiosity (only if enabled)
    if (this.curiosityActive) {
      const pool = this.universe.particleEngine.pool;
      const activeCount = this.universe.particleEngine.activeCount;
      this.behaviorSystem.update(pool, activeCount, deltaTime, this.elapsedTime);
    }

    // Update synchronization
    if (this.syncActive) {
      const pool = this.universe.particleEngine.pool;
      const activeCount = this.universe.particleEngine.activeCount;
      this.synchronizationSystem.update(
        pool, activeCount, deltaTime, this.influenceEngine
      );
    }
  }

  // --- Phase callbacks (called by Scene004Phases) ---

  /**
   * Activate the influence engine. Places source at connection midpoint.
   * Called by Phase 2 onEnter.
   */
  activateInfluence() {
    this.influenceActive = true;
    this.influenceEngine.addSource(
      this.connectionMidX,
      this.connectionMidY,
      INFLUENCE_TYPES.CONNECTION,
      SCENE004.influence.connectionWeight
    );
  }

  /**
   * Activate ripple propagation from connection midpoint.
   * Called by Phase 3 onEnter.
   */
  activateRipple() {
    this.rippleActive = true;
    this.ripplePropagation.spawn(this.connectionMidX, this.connectionMidY);
  }

  /**
   * Activate curiosity behavior inside influence regions.
   * Called by Phase 4 onEnter.
   */
  activateCuriosity() {
    this.curiosityActive = true;
    this.curiosityBehavior.activate();
    this.behaviorSystem.enable(BEHAVIOR_IDS.CURIOSITY);
  }

  /**
   * Activate synchronization system.
   * Called by Phase 4 onEnter.
   */
  activateSynchronization() {
    this.syncActive = true;
  }

  /**
   * Begin environmental response (warmth, fog, density).
   * Called by Phase 5 onEnter.
   */
  activateEnvironmentalResponse() {
    this.environmentActive = true;
  }

  /**
   * Update environmental warmth based on progress.
   * @param {number} progress - Phase progress 0-1
   */
  updateEnvironmentalWarmth(progress) {
    if (!this.environmentActive || !this.universe) return;

    // Subtle lighting warmth shift toward gold
    const warmth = progress * SCENE004.environment.warmthTransitionSpeed;
    const lighting = this.universe.lightingEngine;
    if (lighting && lighting.setWarmthOffset) {
      lighting.setWarmthOffset(warmth);
    }
  }

  /**
   * Update camera broadening - attention slowly widens away from connection.
   * @param {number} progress - Overall broadening progress 0-1
   */
  updateCameraBroaden(progress) {
    if (!this.universe) return;
    this.cameraBroadenProgress = progress;

    const cam = this.universe.cameraController;
    const maxRadius = SCENE004.camera.maxBroadenRadius;
    const factor = this.reducedMotion
      ? SCENE004.camera.reducedMotionFactor
      : 1;

    // Gradually release the target, letting drift take over
    const targetX = this.connectionMidX * (1 - progress) * 0.001;
    const targetY = this.connectionMidY * (1 - progress) * 0.001;
    cam.setTarget(targetX * factor, targetY * factor);
  }

  /**
   * Emit an audio event (muted but registered for future playback).
   * @param {string} eventName - Event identifier
   */
  emitAudioEvent(eventName) {
    if (this.audioArchitecture) {
      this.audioArchitecture.emit(eventName);
    }
  }

  /** Mark the scene as completed. */
  markCompleted() { this.completed = true; }

  /**
   * Check if the scene has completed its timeline.
   * @returns {boolean}
   */
  isCompleted() { return this.completed; }

  /**
   * Leave the scene - deactivate systems.
   * @returns {Promise<void>}
   */
  async leave() {
    this.state = SCENE_STATES.LEAVING;
    this.destroySubsystems();

    if (this.universe) {
      this.universe.cameraController.clearClusterBias();
      this.universe.cameraController.setTarget(0, 0);
    }

    this.state = SCENE_STATES.CLEANUP;
  }

  /**
   * Destroy all subsystems.
   */
  destroySubsystems() {
    if (this.director) { this.director.destroy(); this.director = null; }
    if (this.behaviorSystem) { this.behaviorSystem.destroy(); this.behaviorSystem = null; }
    if (this.influenceEngine) { this.influenceEngine.destroy(); this.influenceEngine = null; }
    if (this.ripplePropagation) { this.ripplePropagation.destroy(); this.ripplePropagation = null; }
    if (this.curiosityBehavior) { this.curiosityBehavior.destroy(); this.curiosityBehavior = null; }
    if (this.synchronizationSystem) { this.synchronizationSystem.destroy(); this.synchronizationSystem = null; }
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
