/**
 * Scene010_Arrival
 * The first human-scale scene. The journey reaches a meaningful destination.
 * Camera settles. Spatial compression creates closeness. Environment quiets.
 * Connection filament becomes emotionally meaningful through deeper breathing.
 *
 * Reuses: GravityCenter, ConnectionRenderer, RecognitionEngine,
 * MemoryEngine, LightingEngine, AudioArchitecture, SceneDirector.
 * Creates: ONE ArrivalDirector.
 *
 * Duration: 45 seconds across 5 phases.
 * Continues from Scene009 state: camera near connectionMid,
 * warmth ~7%, recognition ~0.55, memory ~0.25.
 */

import { SCENE_STATES, UNIVERSE_LAYERS } from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { ArrivalDirector } from '../engine/universe/ArrivalDirector.js';
import { GravityCenter } from '../engine/universe/GravityCenter.js';
import { ConnectionRenderer } from '../engine/universe/ConnectionRenderer.js';
import { RecognitionEngine } from '../engine/universe/RecognitionEngine.js';
import { MemoryEngine } from '../engine/universe/MemoryEngine.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import { buildScene010Phases } from './scene010/Scene010Phases.js';

const SCENE_ID = 'scene010_arrival';
const SCENE010 = settings.scene010;
const GRAVITY_SEED = 1401;

export class Scene010_Arrival {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;
    this.arrivalDirector = null;
    this.gravityCenter = null;
    this.connectionRenderer = null;
    this.recognitionEngine = null;
    this.memoryEngine = null;
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
    this.connectionBreathMultiplier = 0;
    this.focusLevel = 0;
    this.compressionLevel = 0;
    this.quietingLevel = 0;
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
    this.connectionBreathMultiplier = 0;
    this.focusLevel = 0;
    this.compressionLevel = 0;
    this.quietingLevel = 0;
    this.reducedMotion = isReducedMotion();

    if (this.universe) {
      this.initSubsystems();
      this.initDirector();
      this.activateEnvironment();
      this.keepConnectionLayer();
    }
    this.state = SCENE_STATES.ACTIVE;
  }

  initSubsystems() {
    const w = this.universe.canvasManager.width;
    const h = this.universe.canvasManager.height;
    this.initGravitySystem(w, h);
    this.initContinuedSystems(w, h);
    this.initArrivalDirector(w, h);
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
  }

  initArrivalDirector(w, h) {
    this.refreshConnectionMidpoint();
    this.arrivalDirector = new ArrivalDirector();
    this.arrivalDirector.setReducedMotion(this.reducedMotion);
    this.arrivalDirector.init(
      w, h, this.connectionMidX, this.connectionMidY, SCENE010.arrival
    );
    this.arrivalDirector.setEnvironmentConfig(SCENE010.environment);
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
    this.audioArchitecture.registerEvent('arrival_complete');
    this.audioArchitecture.registerEvent('presence_established');
    this.audioArchitecture.registerEvent('first_human_moment');
  }

  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);
    this.director.setPhases(buildScene010Phases(this));
    this.director.start();
  }

  activateEnvironment() {
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
  }

  keepConnectionLayer() {
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
        const breath = 1.0 + this.connectionBreathMultiplier;
        this.connectionRenderer.render(
          ctx, pA, pB, breath, this.reducedMotion, dt
        );
      }
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
    const cam = this.universe.cameraController;

    this.gravityCenter.update(deltaTime);
    this.gravityCenter.applyToParticles(pool, activeCount, deltaTime, 0.6);

    if (this.memoryEngine) {
      this.memoryEngine.update(deltaTime, pool, activeCount);
    }

    this.arrivalDirector.update(deltaTime, pool, activeCount, cam);
    this.applyFocusEnhancement(pool, activeCount);
  }

  applyFocusEnhancement(pool, activeCount) {
    if (this.focusLevel < 0.01) return;
    const enhancement = SCENE010.environment.focusEnhancement;
    const midX = this.connectionMidX;
    const midY = this.connectionMidY;
    const focusRadius = 200;
    const strength = this.focusLevel * enhancement;
    const limit = Math.min(activeCount, pool.length);

    for (let i = 0; i < limit; i++) {
      const p = pool[i];
      if (!p || p.opacity <= 0) continue;
      const dx = p.x - midX;
      const dy = p.y - midY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < focusRadius) {
        const factor = 1 - dist / focusRadius;
        const boost = factor * strength * 0.1;
        p.targetOpacity = Math.min((p.targetOpacity || p.opacity) + boost, 0.7);
      }
    }
  }

  // --- Phase callbacks ---
  activateApproach() {
    // Compression begins, environment starts quieting
  }

  activatePresence() {
    this.audioArchitecture.emit('presence_established');
  }

  activateStillness() {
    // Environment fully quiet, motion nearly stops
  }

  activateAnticipation() {
    // Subtle tension through focus and composition
  }

  activateArrival() {
    this.audioArchitecture.emit('first_human_moment');
  }

  updateCompression(level) {
    this.compressionLevel = level;
  }

  updateQuieting(level) {
    this.quietingLevel = level;
  }

  updateWarmth(progress) {
    if (!this.universe) return;
    const lighting = this.universe.lightingEngine;
    if (!lighting || !lighting.setWarmthOffset) return;
    const baseWarmth = 0.07;
    const targetWarmth = SCENE010.lighting.warmthTarget;
    const warmth = baseWarmth + progress * (targetWarmth - baseWarmth);
    lighting.setWarmthOffset(warmth);
  }

  updateConnectionBreathing(level) {
    const breathDepth = SCENE010.connection.breathDepth;
    this.connectionBreathMultiplier = level * breathDepth;
  }

  updateFocus(level) {
    this.focusLevel = level;
  }

  markCompleted() {
    this.completed = true;
    this.audioArchitecture.emit('arrival_complete');
  }

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
      'director', 'arrivalDirector', 'gravityCenter',
      'memoryEngine', 'recognitionEngine', 'connectionRenderer',
      'audioArchitecture'
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
