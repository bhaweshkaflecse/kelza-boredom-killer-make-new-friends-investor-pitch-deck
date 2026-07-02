/**
 * Scene004_Ripple
 * The first connection quietly changes the universe through influence.
 * Emotional timeline: Silence(0-4s), Influence(4-10s), Ripple(10-16s),
 * Discovery(16-21s), Hope(21-25s). ONE connection line persists.
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
import { ConnectionRenderer } from '../engine/universe/ConnectionRenderer.js';
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
    this.connectionRenderer = null;
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

  /** @param {Object} universe - UniverseEngine instance */
  setUniverse(universe) { this.universe = universe; }

  /**
   * Receive connection data from Engine (midpoint + indices).
   */
  setConnectionData(midX, midY, indexA, indexB) {
    this.connectionMidX = midX;
    this.connectionMidY = midY;
    this.connectionIndexA = indexA;
    this.connectionIndexB = indexB;
  }

  /** @returns {Promise<void>} */
  async load() { this.state = SCENE_STATES.LOADING; }

  /**
   * Enter the scene - initialize all Scene004 subsystems.
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
    this.curiosityBehavior.setReducedMotion(this.reducedMotion);

    // Synchronization - micro-sync for small groups
    this.synchronizationSystem = new SynchronizationSystem();
    this.synchronizationSystem.init(maxParticles);
    this.synchronizationSystem.setReducedMotion(this.reducedMotion);

    // Local behavior system with curiosity registered
    this.behaviorSystem = new BehaviorSystem();
    this.behaviorSystem.init();
    this.behaviorSystem.register(BEHAVIOR_IDS.CURIOSITY, this.curiosityBehavior);
    this.behaviorSystem.setContext({
      influenceEngine: this.influenceEngine,
      ripplePropagation: this.ripplePropagation
    });
  }

  /** Initialize audio architecture with scene-specific event hooks. */
  initAudioHooks() {
    this.audioArchitecture = new AudioArchitecture();
    this.audioArchitecture.init();

    this.audioArchitecture.registerEvent('influence_started');
    this.audioArchitecture.registerEvent('ripple_expanding');
    this.audioArchitecture.registerEvent('curiosity_detected');
    this.audioArchitecture.registerEvent('synchronization_started');
  }

  /** Initialize the SceneDirector with emotional phases. */
  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);

    const phases = buildScene004Phases(this);
    this.director.setPhases(phases);
    this.director.start();
  }

  /** Activate the base environment for this scene. */
  activateEnvironment() {
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
  }

  /**
   * Re-register the CONSTELLATIONS layer with a new ConnectionRenderer.
   * Scene003.leave() nulls the renderer, so we must re-create it here
   * using the captured particle indices to keep the ONE connection line visible.
   */
  keepConstellationsLayer() {
    const bgRenderer = this.universe.backgroundRenderer;
    const particles = this.universe.particleEngine.pool;
    const indexA = this.connectionIndexA;
    const indexB = this.connectionIndexB;

    this.connectionRenderer = new ConnectionRenderer();
    this.connectionRenderer.init(this.reducedMotion);

    bgRenderer.setLayerActive(UNIVERSE_LAYERS.CONSTELLATIONS, true);
    bgRenderer.setLayerRenderer(
      UNIVERSE_LAYERS.CONSTELLATIONS,
      (ctx, time, deltaTime) => {
        if (indexA < 0 || indexB < 0) return;
        const pA = particles[indexA];
        const pB = particles[indexB];
        if (!pA || !pB) return;
        this.connectionRenderer.render(
          ctx, pA, pB, 1.0, this.reducedMotion, deltaTime
        );
      }
    );
  }

  /**
   * Update the scene each frame.
   */
  update(deltaTime) {
    if (this.state !== SCENE_STATES.ACTIVE) return;

    this.elapsedTime += deltaTime;
    this.director.update(deltaTime);
    this.updateSubsystems(deltaTime);
  }

  /** Update all active subsystems. */
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

  /** Activate the influence engine. Places source at connection midpoint. */
  activateInfluence() {
    this.influenceActive = true;
    this.influenceEngine.addSource(
      this.connectionMidX,
      this.connectionMidY,
      INFLUENCE_TYPES.CONNECTION,
      SCENE004.influence.connectionWeight
    );
  }

  /** Activate ripple propagation from connection midpoint. */
  activateRipple() {
    this.rippleActive = true;
    this.ripplePropagation.spawn(this.connectionMidX, this.connectionMidY);
  }

  /** Activate curiosity behavior inside influence regions. */
  activateCuriosity() {
    this.curiosityActive = true;
    this.curiosityBehavior.activate();
    this.behaviorSystem.enable(BEHAVIOR_IDS.CURIOSITY);
  }

  /** Activate synchronization system. */
  activateSynchronization() {
    this.syncActive = true;
  }

  /** Begin environmental response (warmth, fog, density). */
  activateEnvironmentalResponse() {
    this.environmentActive = true;
  }

  /** Update environmental warmth based on phase progress (0-1). */
  updateEnvironmentalWarmth(progress) {
    if (!this.environmentActive || !this.universe) return;

    // Subtle lighting warmth shift toward gold
    const warmth = progress * SCENE004.environment.warmthTransitionSpeed;
    const lighting = this.universe.lightingEngine;
    if (lighting && lighting.setWarmthOffset) {
      lighting.setWarmthOffset(warmth);
    }
  }

  /** Update camera broadening - attention slowly widens away from connection. */
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

  /** Emit an audio event (muted but registered for future playback). */
  emitAudioEvent(eventName) {
    if (this.audioArchitecture) {
      this.audioArchitecture.emit(eventName);
    }
  }

  /** Mark the scene as completed. */
  markCompleted() { this.completed = true; }

  /** @returns {boolean} Whether the scene timeline has completed. */
  isCompleted() { return this.completed; }

  /** Leave the scene - deactivate systems. */
  async leave() {
    this.state = SCENE_STATES.LEAVING;
    this.destroySubsystems();

    if (this.universe) {
      this.universe.cameraController.clearClusterBias();
      this.universe.cameraController.setTarget(0, 0);
    }

    this.state = SCENE_STATES.CLEANUP;
  }

  /** Destroy all subsystems. */
  destroySubsystems() {
    if (this.director) { this.director.destroy(); this.director = null; }
    if (this.behaviorSystem) { this.behaviorSystem.destroy(); this.behaviorSystem = null; }
    if (this.influenceEngine) { this.influenceEngine.destroy(); this.influenceEngine = null; }
    if (this.ripplePropagation) { this.ripplePropagation.destroy(); this.ripplePropagation = null; }
    if (this.curiosityBehavior) { this.curiosityBehavior.destroy(); this.curiosityBehavior = null; }
    if (this.synchronizationSystem) { this.synchronizationSystem.destroy(); this.synchronizationSystem = null; }
    if (this.connectionRenderer) { this.connectionRenderer.destroy(); this.connectionRenderer = null; }
    if (this.audioArchitecture) { this.audioArchitecture.destroy(); this.audioArchitecture = null; }
  }

  /** Destroy the scene and release all references. */
  destroy() {
    this.destroySubsystems();
    this.universe = null;
    this.state = SCENE_STATES.DESTROYED;
  }
}
