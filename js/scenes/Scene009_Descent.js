/**
 * Scene009_Descent
 * The first intentional journey. The camera develops purpose and
 * follows the strongest connection. Very slowly. No rush.
 * Everything else becomes secondary.
 *
 * Reuses: GravityCenter, ConnectionRenderer, RecognitionEngine,
 * MemoryEngine, LightingEngine, ConstellationHints, AudioArchitecture,
 * SceneDirector.
 * Creates: ONE JourneyController.
 *
 * Duration: 45 seconds across 5 phases.
 * RecognitionConfidence maintained at ~0.55 (from Scene008).
 */

import { SCENE_STATES, UNIVERSE_LAYERS } from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { JourneyController } from '../engine/universe/JourneyController.js';
import { GravityCenter } from '../engine/universe/GravityCenter.js';
import { ConnectionRenderer } from '../engine/universe/ConnectionRenderer.js';
import { RecognitionEngine } from '../engine/universe/RecognitionEngine.js';
import { MemoryEngine } from '../engine/universe/MemoryEngine.js';
import { ConstellationHints } from '../engine/universe/ConstellationHints.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import { buildScene009Phases } from './scene009/Scene009Phases.js';

const SCENE_ID = 'scene009_descent';
const SCENE009 = settings.scene009;
const GRAVITY_SEED = 1301;

export class Scene009_Descent {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;
    this.journeyController = null;
    this.gravityCenter = null;
    this.connectionRenderer = null;
    this.recognitionEngine = null;
    this.memoryEngine = null;
    this.constellationHints = null;
    this.audioArchitecture = null;
    this.director = null;
    this.connectionMidX = 0;
    this.connectionMidY = 0;
    this.connectionIndexA = -1;
    this.connectionIndexB = -1;
    this.elapsedTime = 0;
    this.completed = false;
    this.reducedMotion = false;
    this.skipEnvironmentTeardown = false;
    this.journeyActive = false;
    this.environmentalResponseActive = false;
    this.connectionGlowMultiplier = 0;
    this.depthFactor = 0;
    this.driftReduction = 0;
    this._nearDistance = 150;
    this._farDistance = 400;
  }

  getId() { return this.id; }
  setUniverse(universe) { this.universe = universe; }

  setConnectionData(midX, midY, indexA, indexB) {
    this.connectionMidX = midX;
    this.connectionMidY = midY;
    this.connectionIndexA = indexA;
    this.connectionIndexB = indexB;
  }

  async load() { this.state = SCENE_STATES.LOADING; }

  async enter() {
    this.state = SCENE_STATES.ENTERING;
    this.elapsedTime = 0;
    this.completed = false;
    this.journeyActive = false;
    this.environmentalResponseActive = false;
    this.connectionGlowMultiplier = 0;
    this.depthFactor = 0;
    this.driftReduction = 0;
    this.reducedMotion = isReducedMotion();

    if (this.universe) {
      this.initSubsystems();
      this.initDirector();
      this.activateEnvironment();
      this.setupCamera();
      this.keepConstellationsLayer();
    }
    this.state = SCENE_STATES.ACTIVE;
  }

  initSubsystems() {
    const w = this.universe.canvasManager.width;
    const h = this.universe.canvasManager.height;
    this.initGravitySystem(w, h);
    this.initContinuedSystems(w, h);
    this.initJourneyController();
    this.initAudio();
  }

  initGravitySystem(w, h) {
    this.gravityCenter = new GravityCenter();
    this.gravityCenter.init(w, h, GRAVITY_SEED);
    this.memoryEngine = new MemoryEngine();
    this.memoryEngine.init(w, h, GRAVITY_SEED + 100);
  }

  initContinuedSystems(w, h) {
    this.recognitionEngine = new RecognitionEngine();
    this.recognitionEngine.init(w, h);
    this.recognitionEngine.confidence = 0.55;
    this.constellationHints = new ConstellationHints();
    this.constellationHints.init(
      this.reducedMotion, this.connectionIndexA, this.connectionIndexB
    );
  }

  initJourneyController() {
    const cam = this.universe.cameraController;
    const startX = cam ? cam.position.x : 0;
    const startY = cam ? cam.position.y : 0;
    this.refreshConnectionMidpoint();
    this.journeyController = new JourneyController();
    this.journeyController.setReducedMotion(this.reducedMotion);
    this.journeyController.init(
      startX, startY, this.connectionMidX, this.connectionMidY,
      SCENE009.journey
    );
  }

  refreshConnectionMidpoint() {
    const pool = this.universe.particleEngine.pool;
    const idxA = this.connectionIndexA;
    const idxB = this.connectionIndexB;
    if (idxA < 0 || idxB < 0) return;
    const pA = pool[idxA];
    const pB = pool[idxB];
    if (pA && pB && pA.opacity > 0 && pB.opacity > 0) {
      this.connectionMidX = (pA.x + pB.x) * 0.5;
      this.connectionMidY = (pA.y + pB.y) * 0.5;
    }
  }

  initAudio() {
    this.audioArchitecture = new AudioArchitecture();
    this.audioArchitecture.init();
    this.audioArchitecture.registerEvent('journey_started');
    this.audioArchitecture.registerEvent('destination_locked');
    this.audioArchitecture.registerEvent('approach_begun');
  }

  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);
    this.director.setPhases(buildScene009Phases(this));
    this.director.start();
  }

  activateEnvironment() {
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
  }

  setupCamera() {
    const cam = this.universe.cameraController;
    if (cam && cam.setDriftMultiplier) {
      cam.setDriftMultiplier(0.075);
    }
  }

  keepConstellationsLayer() {
    const bgRenderer = this.universe.backgroundRenderer;
    const particles = this.universe.particleEngine.pool;
    const idxA = this.connectionIndexA;
    const idxB = this.connectionIndexB;
    this.connectionRenderer = new ConnectionRenderer();
    this.connectionRenderer.init(this.reducedMotion);
    bgRenderer.setLayerActive(UNIVERSE_LAYERS.CONSTELLATIONS, true);
    bgRenderer.setLayerRenderer(
      UNIVERSE_LAYERS.CONSTELLATIONS,
      (ctx, time, dt) => {
        this.renderConnectionLayer(ctx, particles, idxA, idxB, dt);
      }
    );
  }

  renderConnectionLayer(ctx, particles, idxA, idxB, dt) {
    if (idxA >= 0 && idxB >= 0) {
      const pA = particles[idxA];
      const pB = particles[idxB];
      if (pA && pB) {
        const glow = 1.0 + this.connectionGlowMultiplier;
        this.connectionRenderer.render(
          ctx, pA, pB, glow, this.reducedMotion, dt
        );
      }
    }
    if (this.constellationHints) {
      this.constellationHints.render(ctx, particles, dt, this.reducedMotion);
    }
  }

  update(deltaTime) {
    if (this.state !== SCENE_STATES.ACTIVE) return;
    this.elapsedTime += deltaTime;
    this.director.update(deltaTime);
    this.updateSubsystems(deltaTime);
  }

  updateSubsystems(deltaTime) {
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;

    this.gravityCenter.update(deltaTime);
    this.gravityCenter.applyToParticles(pool, activeCount, deltaTime, 1.0);
    if (this.memoryEngine) {
      this.memoryEngine.update(deltaTime, pool, activeCount);
    }

    if (this.journeyActive) {
      this.journeyController.update(deltaTime);
      this.applyCameraTarget();
    }

    if (this.environmentalResponseActive) {
      this.applyEnvironmentalResponse(pool, activeCount);
    }

    this.updateConstellations(deltaTime, pool, activeCount);
  }

  applyCameraTarget() {
    const cam = this.universe.cameraController;
    if (!cam || !cam.setTarget) return;
    const pos = this.journeyController.getTargetPosition();
    cam.setTarget(pos.x, pos.y);
  }

  applyEnvironmentalResponse(pool, activeCount) {
    const pos = this.journeyController.getTargetPosition();
    const nearDist = this._nearDistance;
    const farDist = this._farDistance;
    const enrichment = SCENE009.environment.nearParticleEnrichment;
    const fade = SCENE009.environment.farParticleFade;
    const limit = Math.min(activeCount, pool.length);

    for (let i = 0; i < limit; i++) {
      const p = pool[i];
      if (!p || p.opacity <= 0) continue;
      if (p.baseTargetOpacity === undefined) {
        p.baseTargetOpacity = p.targetOpacity;
      }
      const dx = p.x - pos.x;
      const dy = p.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.adjustParticleOpacity(p, dist, nearDist, farDist, enrichment, fade);
    }
  }

  adjustParticleOpacity(p, dist, nearDist, farDist, enrichment, fade) {
    const base = p.baseTargetOpacity;
    if (dist < nearDist) {
      const factor = 1 - dist / nearDist;
      const boost = factor * enrichment * this.depthFactor;
      p.targetOpacity = Math.min(base + boost, 0.8);
    } else if (dist > farDist) {
      const factor = Math.min((dist - farDist) / farDist, 1);
      const reduction = factor * fade * this.depthFactor;
      p.targetOpacity = Math.max(base - reduction, 0.02);
    } else {
      p.targetOpacity = base;
    }
  }

  updateConstellations(deltaTime, pool, activeCount) {
    if (!this.constellationHints) return;
    this.constellationHints.update(
      deltaTime, this.elapsedTime, null, pool, activeCount
    );
  }

  // --- Phase callbacks ---
  activateStillness() {
    // Calm absorption - no targeting yet
  }

  activateDecision() {
    // Camera drift begins reducing - handled by updateDriftReduction
  }

  activateCommitment() {
    this.journeyActive = true;
    this.audioArchitecture.emit('destination_locked');
    this.audioArchitecture.emit('journey_started');
  }

  activateJourneyPhase() {
    this.environmentalResponseActive = true;
  }

  activateApproach() {
    this.audioArchitecture.emit('approach_begun');
  }

  updateConnectionGlow(level) {
    this.connectionGlowMultiplier = level;
  }

  updateDriftReduction(progress) {
    this.driftReduction = progress;
    const cam = this.universe.cameraController;
    if (cam && cam.setDriftMultiplier) {
      const base = 0.075;
      const reduced = base * (1 - progress * 0.6);
      cam.setDriftMultiplier(reduced);
    }
  }

  updateWarmthProgress(progress) {
    if (!this.universe) return;
    const lighting = this.universe.lightingEngine;
    if (!lighting || !lighting.setWarmthOffset) return;
    const warmth = progress * SCENE009.lighting.warmthTarget;
    lighting.setWarmthOffset(warmth);
  }

  updateDepthEnhancement(level) {
    this.depthFactor = level;
  }

  updateEnvironmentalResponse(progress) {
    // Scale distances based on journey progress
    this._nearDistance = 150 + progress * 50;
    this._farDistance = 400 - progress * 100;
  }

  updateApproachSlowdown(progress) {
    // Gradually reduce journey speed as we approach
    if (!this.journeyActive) return;
    const cam = this.universe.cameraController;
    if (cam && cam.setDriftMultiplier) {
      const base = 0.075 * 0.4;
      const slowed = base * (1 - progress * 0.5);
      cam.setDriftMultiplier(slowed);
    }
  }

  markCompleted() { this.completed = true; }
  isCompleted() { return this.completed; }

  resize(width, height) {
    if (this.gravityCenter) this.gravityCenter.resize(width, height);
    if (this.recognitionEngine) this.recognitionEngine.resize(width, height);
  }

  async leave() {
    this.state = SCENE_STATES.LEAVING;
    if (!this.skipEnvironmentTeardown) {
      this.destroySubsystems();
      if (this.universe) {
        this.universe.cameraController.clearClusterBias();
        this.universe.cameraController.setTarget(0, 0);
      }
    }
    this.state = SCENE_STATES.CLEANUP;
  }

  destroySubsystems() {
    const systems = [
      'director', 'journeyController', 'gravityCenter',
      'memoryEngine', 'recognitionEngine', 'connectionRenderer',
      'constellationHints', 'audioArchitecture'
    ];
    for (let i = 0; i < systems.length; i++) {
      if (this[systems[i]]) {
        this[systems[i]].destroy();
        this[systems[i]] = null;
      }
    }
  }

  destroy() {
    this.destroySubsystems();
    this.universe = null;
    this.state = SCENE_STATES.DESTROYED;
  }
}
