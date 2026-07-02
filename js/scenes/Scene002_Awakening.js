/**
 * Scene002_Awakening
 * The awakening scene - particles gain subtle intelligence and begin to form
 * temporary clusters. No product, logo, text, or UI content.
 * Emotional timeline: 0-15s of gradual intelligence emergence.
 *
 * Phases:
 * 1. (0-3s)  Universe exists - Scene001 atmosphere continues
 * 2. (3-6s)  Subtle energy increase - field ramps, particles respond
 * 3. (6-8s)  Organize behavior activates gently
 * 4. (8-10s) Forces pull particles, field strength increases
 * 5. (10-12s) Clusters form (3-5-8 particle groups)
 * 6. (12-14s) Clusters dissolve, field weakens
 * 7. (14-15s) One brighter particle - elevated opacity, simply more alive
 */

import { SCENE_STATES, BEHAVIOR_IDS } from '../config/constants.js';
import { BehaviorSystem } from '../engine/universe/BehaviorSystem.js';
import { IntelligenceField } from '../engine/universe/IntelligenceField.js';
import { ConnectionPrediction } from '../engine/universe/ConnectionPrediction.js';
import { ClusterDetection } from '../engine/universe/ClusterDetection.js';
import { EnergyPulseSystem } from '../engine/universe/EnergyPulseSystem.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import {
  buildScene002Phases,
  SCENE002_DURATION
} from './scene002/Scene002Phases.js';

const SCENE_ID = 'scene002_awakening';
const BRIGHTER_PARTICLE_RATIO = 0.37;
const BRIGHTER_OPACITY_MULTIPLIER = 1.8;
const BRIGHTER_OPACITY_MAX = 1.0;

export class Scene002_Awakening {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;

    // Subsystems
    this.behaviorSystem = null;
    this.intelligenceField = null;
    this.connectionPrediction = null;
    this.clusterDetection = null;
    this.energyPulseSystem = null;
    this.director = null;

    // State trackers
    this.elapsedTime = 0;
    this.brighterParticleIndex = -1;
    this.originalTargetOpacity = 0;
    this.fieldStrengthMultiplier = 0;
    this.organizeActive = false;
    this.clustersActive = false;
    this.completed = false;

    /** @type {{clusters: Object[], count: number}} Pre-allocated context for BehaviorSystem */
    this._behaviorContext = { clusters: null, count: 0 };
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
   * Load scene assets (none for this scene).
   * @returns {Promise<void>}
   */
  async load() {
    this.state = SCENE_STATES.LOADING;
  }

  /**
   * Enter the scene - initialize all Scene002 subsystems.
   * @returns {Promise<void>}
   */
  async enter() {
    this.state = SCENE_STATES.ENTERING;
    this.elapsedTime = 0;
    this.completed = false;

    if (this.universe) {
      this.initSubsystems();
      this.initDirector();
      this.activateEnvironment();
    }

    this.state = SCENE_STATES.ACTIVE;
  }

  /**
   * Initialize all behavioral intelligence subsystems.
   */
  initSubsystems() {
    const width = this.universe.canvasManager.width;
    const height = this.universe.canvasManager.height;
    const maxParticles = this.universe.particleEngine.maxCount;

    this.behaviorSystem = new BehaviorSystem();
    this.behaviorSystem.init();
    this.behaviorSystem.disable(BEHAVIOR_IDS.ORGANIZE);

    this.intelligenceField = new IntelligenceField();
    this.intelligenceField.init(width, height);

    this.connectionPrediction = new ConnectionPrediction();
    this.connectionPrediction.init(maxParticles);

    this.clusterDetection = new ClusterDetection();
    this.clusterDetection.init(maxParticles);

    this.energyPulseSystem = new EnergyPulseSystem();
    this.energyPulseSystem.init(width, height);
  }

  /**
   * Initialize the SceneDirector with emotional phases.
   */
  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);

    const phases = buildScene002Phases(this);
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
   * Update the scene each frame. Advances emotional timeline.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== SCENE_STATES.ACTIVE) return;

    this.elapsedTime += deltaTime;
    this.director.update(deltaTime);
    this.updateSubsystems(deltaTime);
    this.updateCameraIntelligence();
  }

  /**
   * Update all active subsystems with current frame data.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateSubsystems(deltaTime) {
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;

    this.intelligenceField.update(deltaTime, this.elapsedTime);
    this.applyFieldForces(pool, activeCount);

    this.energyPulseSystem.update(deltaTime, this.elapsedTime);
    this.applyPulseForces(pool, activeCount);

    if (this.clustersActive) {
      this.clusterDetection.update(pool, activeCount, this.elapsedTime);
      const view = this.clusterDetection.getClusterView();
      this._behaviorContext.clusters = view.clusters;
      this._behaviorContext.count = view.count;
      this.behaviorSystem.setContext(this._behaviorContext);
    }

    this.connectionPrediction.update(pool, activeCount);
    this.behaviorSystem.update(pool, activeCount, deltaTime, this.elapsedTime);
  }

  /**
   * Apply intelligence field forces to particles with multiplier.
   * @param {Object[]} pool - Particle pool
   * @param {number} activeCount - Active count
   */
  applyFieldForces(pool, activeCount) {
    if (this.fieldStrengthMultiplier <= 0) return;
    const mult = this.fieldStrengthMultiplier;

    for (let i = 0; i < activeCount; i++) {
      const p = pool[i];
      if (!p.active) continue;

      const force = this.intelligenceField.getForce(p.x, p.y);
      p.ax += force.fx * mult;
      p.ay += force.fy * mult;
    }
  }

  /**
   * Apply energy pulse forces to active particles.
   * @param {Object[]} pool - Particle pool
   * @param {number} activeCount - Active count
   */
  applyPulseForces(pool, activeCount) {
    for (let i = 0; i < activeCount; i++) {
      const p = pool[i];
      if (!p.active) continue;
      this.energyPulseSystem.applyToParticle(p);
    }
  }

  /**
   * Connect camera intelligence to cluster data when available.
   */
  updateCameraIntelligence() {
    const camera = this.universe.cameraController;
    if (!this.clustersActive || this.clusterDetection.clusterCount === 0) {
      camera.clearClusterBias();
      return;
    }
    const view = this.clusterDetection.getClusterView();
    const width = this.universe.canvasManager.width;
    const height = this.universe.canvasManager.height;
    camera.setClusterBias(view.clusters, view.count, width, height);
  }

  /**
   * Enable the organize behavior.
   */
  enableOrganize() {
    if (this.organizeActive) return;
    this.organizeActive = true;
    this.behaviorSystem.enable(BEHAVIOR_IDS.ORGANIZE);
  }

  /**
   * Disable the organize behavior.
   */
  disableOrganize() {
    if (!this.organizeActive) return;
    this.organizeActive = false;
    this.behaviorSystem.disable(BEHAVIOR_IDS.ORGANIZE);
  }

  /**
   * Enable cluster detection.
   */
  enableClusters() {
    this.clustersActive = true;
  }

  /**
   * Disable cluster detection.
   */
  disableClusters() {
    this.clustersActive = false;
  }

  /**
   * Elevate a single particle to be slightly brighter.
   */
  elevateBrighterParticle() {
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;
    if (activeCount === 0) return;

    const idx = Math.floor(activeCount * BRIGHTER_PARTICLE_RATIO);
    this.brighterParticleIndex = idx;
    this.originalTargetOpacity = pool[idx].targetOpacity;
    pool[idx].targetOpacity = Math.min(
      BRIGHTER_OPACITY_MAX,
      pool[idx].targetOpacity * BRIGHTER_OPACITY_MULTIPLIER
    );
  }

  /**
   * Restore the brighter particle to normal.
   */
  restoreBrighterParticle() {
    if (this.brighterParticleIndex < 0) return;
    const pool = this.universe.particleEngine.pool;
    if (this.brighterParticleIndex < pool.length) {
      pool[this.brighterParticleIndex].targetOpacity = this.originalTargetOpacity;
    }
    this.brighterParticleIndex = -1;
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
   * Leave the scene - deactivate all Scene002 systems.
   * @returns {Promise<void>}
   */
  async leave() {
    this.state = SCENE_STATES.LEAVING;

    this.restoreBrighterParticle();
    this.destroySubsystems();

    if (this.universe) {
      this.universe.cameraController.clearClusterBias();
      this.universe.setFogActive(false);
      this.universe.setVignetteActive(false);
      this.universe.setGradientsActive(false);
      this.universe.setCameraDriftActive(false);
    }

    this.state = SCENE_STATES.CLEANUP;
  }

  /**
   * Destroy all subsystems created by this scene.
   */
  destroySubsystems() {
    if (this.director) { this.director.destroy(); this.director = null; }
    if (this.behaviorSystem) { this.behaviorSystem.destroy(); this.behaviorSystem = null; }
    if (this.intelligenceField) { this.intelligenceField.destroy(); this.intelligenceField = null; }
    if (this.connectionPrediction) { this.connectionPrediction.destroy(); this.connectionPrediction = null; }
    if (this.clusterDetection) { this.clusterDetection.destroy(); this.clusterDetection = null; }
    if (this.energyPulseSystem) { this.energyPulseSystem.destroy(); this.energyPulseSystem = null; }
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
