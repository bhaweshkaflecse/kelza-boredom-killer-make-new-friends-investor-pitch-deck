/**
 * Scene005_LivingNetwork
 * The birth of a living network. Influence quietly spreads.
 * Particles begin making decisions. Connection creates meaning.
 * Emotional timeline: Isolation(0-5s), Influence(5-12s), Alignment(12-18s),
 * Neighborhood(18-25s), Possibility(25-30s).
 *
 * ONE dominant visible connection persists from Scene003.
 * Constellation hints: max 4 temporary filaments, below 8% opacity.
 * The universe must still feel spacious. Negative space is essential.
 */

import {
  SCENE_STATES, BEHAVIOR_IDS, UNIVERSE_LAYERS, INFLUENCE_TYPES
} from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { BehaviorSystem } from '../engine/universe/BehaviorSystem.js';
import { InfluenceEngine } from '../engine/universe/InfluenceEngine.js';
import { CuriosityBehavior } from '../engine/universe/CuriosityBehavior.js';
import { SynchronizationSystem } from '../engine/universe/SynchronizationSystem.js';
import { ConnectionRenderer } from '../engine/universe/ConnectionRenderer.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { NetworkEngine } from '../engine/universe/NetworkEngine.js';
import { ConstellationHints } from '../engine/universe/ConstellationHints.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import {
  buildScene005Phases, SCENE005_DURATION
} from './scene005/Scene005Phases.js';

const SCENE_ID = 'scene005_livingNetwork';
const SCENE005 = settings.scene005;

export class Scene005_LivingNetwork {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;

    // Subsystems
    this.networkEngine = null;
    this.influenceEngine = null;
    this.behaviorSystem = null;
    this.curiosityBehavior = null;
    this.synchronizationSystem = null;
    this.connectionRenderer = null;
    this.constellationHints = null;
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
    this.networkActive = false;
    this.neighborhoodsActive = false;
    this.constellationsActive = false;
    this.warmthActive = false;
    this.cameraBroadenProgress = 0;
    this.reducedMotion = false;
  }

  /** @returns {string} Scene identifier */
  getId() { return this.id; }

  /** @param {Object} universe - UniverseEngine instance */
  setUniverse(universe) { this.universe = universe; }

  /**
   * Receive connection data from Engine (midpoint + indices).
   * @param {number} midX - Connection midpoint X
   * @param {number} midY - Connection midpoint Y
   * @param {number} indexA - First particle index
   * @param {number} indexB - Second particle index
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
   * Enter the scene - initialize all Scene005 subsystems.
   */
  async enter() {
    this.state = SCENE_STATES.ENTERING;
    this.elapsedTime = 0;
    this.completed = false;
    this.networkActive = false;
    this.neighborhoodsActive = false;
    this.constellationsActive = false;
    this.warmthActive = false;
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
   * Initialize all subsystems for Scene005.
   */
  initSubsystems() {
    const width = this.universe.canvasManager.width;
    const height = this.universe.canvasManager.height;
    const maxParticles = this.universe.particleEngine.maxCount;

    // Influence engine - reused from Scene004 pattern
    this.influenceEngine = new InfluenceEngine();
    this.influenceEngine.init(width, height);

    // Network engine - owns InfluenceGraph + NeighborhoodManager
    this.networkEngine = new NetworkEngine();
    this.networkEngine.init(width, height, maxParticles);
    this.networkEngine.setReducedMotion(this.reducedMotion);

    // Curiosity behavior - searching motion persists from Scene004
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
      influenceEngine: this.influenceEngine
    });
    this.curiosityBehavior.activate();
    this.behaviorSystem.enable(BEHAVIOR_IDS.CURIOSITY);

    // Constellation hints - faint temporary filaments
    this.constellationHints = new ConstellationHints();
    this.constellationHints.init(
      this.reducedMotion,
      this.connectionIndexA,
      this.connectionIndexB
    );
  }

  /** Initialize audio architecture with scene-specific event hooks. */
  initAudioHooks() {
    this.audioArchitecture = new AudioArchitecture();
    this.audioArchitecture.init();

    this.audioArchitecture.registerEvent('network_seeded');
    this.audioArchitecture.registerEvent('alignment_started');
    this.audioArchitecture.registerEvent('neighborhood_forming');
    this.audioArchitecture.registerEvent('warmth_increasing');
  }

  /** Initialize the SceneDirector with emotional phases. */
  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);

    const phases = buildScene005Phases(this);
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
   * Re-register the CONSTELLATIONS layer renderer.
   * Renders BOTH the ONE persistent filament AND the constellation hints.
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
        // Render the ONE persistent connection
        if (indexA >= 0 && indexB >= 0) {
          const pA = particles[indexA];
          const pB = particles[indexB];
          if (pA && pB) {
            this.connectionRenderer.render(
              ctx, pA, pB, 1.0, this.reducedMotion, deltaTime
            );
          }
        }

        // Render constellation hints (faint temporary filaments)
        if (this.constellationsActive && this.constellationHints) {
          this.constellationHints.render(
            ctx, particles, deltaTime, this.reducedMotion
          );
        }
      }
    );
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

  /** Update all active subsystems. */
  updateSubsystems(deltaTime) {
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;

    // Always update influence engine
    if (this.networkActive) {
      this.influenceEngine.update(deltaTime);
      this.networkEngine.update(
        pool, activeCount, deltaTime, this.influenceEngine
      );
    }

    // Update behavior system (curiosity remains active)
    this.behaviorSystem.update(pool, activeCount, deltaTime, this.elapsedTime);

    // Update synchronization if neighborhoods active
    if (this.neighborhoodsActive) {
      this.synchronizationSystem.update(
        pool, activeCount, deltaTime, this.influenceEngine
      );
    }

    // Update constellation hints
    if (this.constellationsActive && this.constellationHints) {
      this.constellationHints.update(
        deltaTime,
        this.elapsedTime,
        this.networkEngine.graph,
        pool,
        activeCount
      );
    }
  }

  // --- Phase callbacks (called by Scene005Phases) ---

  /** Seed the network from the original connection. */
  activateNetworkSeed() {
    this.networkActive = true;
    this.influenceEngine.addSource(
      this.connectionMidX,
      this.connectionMidY,
      INFLUENCE_TYPES.CONNECTION,
      1.0
    );
    this.networkEngine.seedFromConnection(
      this.connectionMidX,
      this.connectionMidY,
      this.connectionIndexA,
      this.connectionIndexB
    );
  }

  /** Activate neighborhood detection and synchronization. */
  activateNeighborhoods() {
    this.neighborhoodsActive = true;
  }

  /** Activate constellation hint rendering. */
  activateConstellationHints() {
    this.constellationsActive = true;
  }

  /** Begin environmental warmth increase. */
  activateEnvironmentalWarmth() {
    this.warmthActive = true;
    this.emitAudioEvent('warmth_increasing');
  }

  /**
   * Update environmental warmth based on phase progress.
   * @param {number} progress - Phase progress (0-1)
   */
  updateWarmthProgress(progress) {
    if (!this.warmthActive || !this.universe) return;

    const warmth = progress * SCENE005.environment.warmthIncrease;
    const lighting = this.universe.lightingEngine;
    if (lighting && lighting.setWarmthOffset) {
      lighting.setWarmthOffset(warmth);
    }
  }

  /**
   * Update camera broadening - attention slowly widens to notice patterns.
   * @param {number} progress - Broaden progress (0-1)
   */
  updateCameraBroaden(progress) {
    if (!this.universe) return;
    this.cameraBroadenProgress = progress;

    const cam = this.universe.cameraController;
    const factor = this.reducedMotion
      ? SCENE005.camera.reducedMotionFactor
      : 1;

    // Gradually release focus, letting drift take over
    const targetX = this.connectionMidX * (1 - progress) * 0.001;
    const targetY = this.connectionMidY * (1 - progress) * 0.001;
    cam.setTarget(targetX * factor, targetY * factor);
  }

  /**
   * Emit an audio event (muted but registered for future playback).
   * @param {string} eventName - Event name to emit
   */
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
    if (this.networkEngine) { this.networkEngine.destroy(); this.networkEngine = null; }
    if (this.curiosityBehavior) { this.curiosityBehavior.destroy(); this.curiosityBehavior = null; }
    if (this.synchronizationSystem) { this.synchronizationSystem.destroy(); this.synchronizationSystem = null; }
    if (this.connectionRenderer) { this.connectionRenderer.destroy(); this.connectionRenderer = null; }
    if (this.constellationHints) { this.constellationHints.destroy(); this.constellationHints = null; }
    if (this.audioArchitecture) { this.audioArchitecture.destroy(); this.audioArchitecture = null; }
  }

  /** Destroy the scene and release all references. */
  destroy() {
    this.destroySubsystems();
    this.universe = null;
    this.state = SCENE_STATES.DESTROYED;
  }
}
