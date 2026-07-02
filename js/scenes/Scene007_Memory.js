/**
 * Scene007_Memory
 * The moment where the universe begins remembering itself.
 * Recognition becomes familiarity. Familiarity becomes memory.
 * Memory becomes anticipation. 38 seconds total.
 *
 * MemoryStrength: 0 -> ~0.25 (independent of RecognitionConfidence).
 * ConstellationHints: max 4, <7% opacity, temporary.
 */

import {
  SCENE_STATES, BEHAVIOR_IDS, UNIVERSE_LAYERS, INFLUENCE_TYPES
} from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { MemoryEngine } from '../engine/universe/MemoryEngine.js';
import { PatternMemory } from '../engine/universe/PatternMemory.js';
import { EchoSystem } from '../engine/universe/EchoSystem.js';
import { RecognitionEngine } from '../engine/universe/RecognitionEngine.js';
import { PatternSuggestion } from '../engine/universe/PatternSuggestion.js';
import { NegativeSpaceDirector } from '../engine/universe/NegativeSpaceDirector.js';
import { BehaviorSystem } from '../engine/universe/BehaviorSystem.js';
import { InfluenceEngine } from '../engine/universe/InfluenceEngine.js';
import { CuriosityBehavior } from '../engine/universe/CuriosityBehavior.js';
import { SynchronizationSystem } from '../engine/universe/SynchronizationSystem.js';
import { ConnectionRenderer } from '../engine/universe/ConnectionRenderer.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { NetworkEngine } from '../engine/universe/NetworkEngine.js';
import { ConstellationHints } from '../engine/universe/ConstellationHints.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import { buildScene007Phases } from './scene007/Scene007Phases.js';
import {
  updateMemorySystems, updateEchoInfluence,
  applySubsystemForces, findMemoryIndex
} from './scene007/Scene007MemoryUpdater.js';

const SCENE_ID = 'scene007_memory';
const SCENE007 = settings.scene007;

export class Scene007_Memory {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;
    this.memoryEngine = null;
    this.patternMemory = null;
    this.echoSystem = null;
    this.recognitionEngine = null;
    this.patternSuggestion = null;
    this.negativeSpaceDirector = null;
    this.networkEngine = null;
    this.influenceEngine = null;
    this.constellationHints = null;
    this.behaviorSystem = null;
    this.curiosityBehavior = null;
    this.synchronizationSystem = null;
    this.connectionRenderer = null;
    this.audioArchitecture = null;
    this.director = null;
    this.connectionMidX = 0;
    this.connectionMidY = 0;
    this.connectionIndexA = -1;
    this.connectionIndexB = -1;
    this.elapsedTime = 0;
    this.completed = false;
    this.memoryFormationActive = false;
    this.patternRecordingActive = false;
    this.echoSystemActive = false;
    this.constellationMemoryActive = false;
    this.echoLightingActive = false;
    this.environmentalConfidenceActive = false;
    this.cameraPreferenceActive = false;
    this.reducedMotion = false;
    this.skipEnvironmentTeardown = false;
    this._graphMetrics = { nodes: 0, edges: 0, neighborhoods: 0, trend: 0 };
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
    this.memoryFormationActive = false;
    this.patternRecordingActive = false;
    this.echoSystemActive = false;
    this.constellationMemoryActive = false;
    this.echoLightingActive = false;
    this.environmentalConfidenceActive = false;
    this.cameraPreferenceActive = false;
    this.reducedMotion = isReducedMotion();

    if (this.universe) {
      this.initSubsystems();
      this.initDirector();
      this.activateEnvironment();
      this.keepConstellationsLayer();
    }
    this.state = SCENE_STATES.ACTIVE;
  }

  initSubsystems() {
    const w = this.universe.canvasManager.width;
    const h = this.universe.canvasManager.height;
    const max = this.universe.particleEngine.maxCount;
    this.initMemorySystems(w, h);
    this.initContinuedSystems(w, h, max);
    this.initAudio();
  }

  initMemorySystems(w, h) {
    this.memoryEngine = new MemoryEngine();
    this.memoryEngine.init(w, h, SCENE007.memory.seed);
    this.patternMemory = new PatternMemory();
    this.patternMemory.init(SCENE007.patternMemory.seed);
    this.echoSystem = new EchoSystem();
    this.echoSystem.init(SCENE007.echo.seed, this.memoryEngine, this.patternMemory);
  }

  initContinuedSystems(w, h, maxP) {
    this.recognitionEngine = new RecognitionEngine();
    this.recognitionEngine.init(w, h);
    this.patternSuggestion = new PatternSuggestion();
    this.patternSuggestion.init(w, h, settings.scene006.patternSuggestion.seed);
    this.negativeSpaceDirector = new NegativeSpaceDirector();
    this.negativeSpaceDirector.init(w, h, 719);
    this.influenceEngine = new InfluenceEngine();
    this.influenceEngine.init(w, h);
    this.networkEngine = new NetworkEngine();
    this.networkEngine.init(w, h, maxP);
    this.networkEngine.setReducedMotion(this.reducedMotion);
    this.curiosityBehavior = new CuriosityBehavior();
    this.curiosityBehavior.setReducedMotion(this.reducedMotion);
    this.synchronizationSystem = new SynchronizationSystem();
    this.synchronizationSystem.init(maxP);
    this.synchronizationSystem.setReducedMotion(this.reducedMotion);
    this.behaviorSystem = new BehaviorSystem();
    this.behaviorSystem.init();
    this.behaviorSystem.register(BEHAVIOR_IDS.CURIOSITY, this.curiosityBehavior);
    this.behaviorSystem.setContext({ influenceEngine: this.influenceEngine });
    this.curiosityBehavior.activate();
    this.behaviorSystem.enable(BEHAVIOR_IDS.CURIOSITY);
    this.constellationHints = new ConstellationHints();
    this.constellationHints.init(
      this.reducedMotion, this.connectionIndexA, this.connectionIndexB
    );
    this.influenceEngine.addSource(
      this.connectionMidX, this.connectionMidY, INFLUENCE_TYPES.CONNECTION, 1.0
    );
    this.networkEngine.seedFromConnection(
      this.connectionMidX, this.connectionMidY,
      this.connectionIndexA, this.connectionIndexB
    );
  }

  initAudio() {
    this.audioArchitecture = new AudioArchitecture();
    this.audioArchitecture.init();
    this.audioArchitecture.registerEvent('memory_created');
    this.audioArchitecture.registerEvent('memory_strengthened');
    this.audioArchitecture.registerEvent('pattern_recalled');
    this.audioArchitecture.registerEvent('anticipation_increased');
  }

  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);
    this.director.setPhases(buildScene007Phases(this));
    this.director.start();
  }

  activateEnvironment() {
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
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
        if (idxA >= 0 && idxB >= 0) {
          const pA = particles[idxA];
          const pB = particles[idxB];
          if (pA && pB) {
            this.connectionRenderer.render(ctx, pA, pB, 1.0, this.reducedMotion, dt);
          }
        }
        if (this.constellationMemoryActive && this.constellationHints) {
          this.constellationHints.render(ctx, particles, dt, this.reducedMotion);
        }
      }
    );
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
    this.influenceEngine.update(deltaTime);
    this.networkEngine.update(pool, activeCount, deltaTime, this.influenceEngine);
    this.updateRecognition(deltaTime);
    updateMemorySystems(this, deltaTime, pool, activeCount);
    updateEchoInfluence(this);
    applySubsystemForces(this, pool, activeCount, deltaTime);
    this.behaviorSystem.update(pool, activeCount, deltaTime, this.elapsedTime);
    this.synchronizationSystem.update(pool, activeCount, deltaTime, this.influenceEngine);
    if (this.constellationMemoryActive && this.constellationHints) {
      this.constellationHints.update(
        deltaTime, this.elapsedTime, this.networkEngine.graph, pool, activeCount
      );
    }
  }

  updateRecognition(deltaTime) {
    this.populateGraphMetrics();
    this.recognitionEngine.update(
      deltaTime, this._graphMetrics, this._graphMetrics.neighborhoods
    );
    this.patternSuggestion.update(deltaTime, this.recognitionEngine.getConfidence());
    this.negativeSpaceDirector.update(
      deltaTime, this.universe.particleEngine.pool,
      this.universe.particleEngine.activeCount,
      this.recognitionEngine.getConfidence()
    );
  }

  populateGraphMetrics() {
    if (!this.networkEngine) return;
    const m = this.networkEngine.getGraphMetrics();
    this._graphMetrics.nodes = m.nodes;
    this._graphMetrics.edges = m.edges;
    this._graphMetrics.neighborhoods = m.neighborhoods;
    this._graphMetrics.trend = m.trend;
  }

  // --- Phase callbacks ---

  activateMemoryFormation() { this.memoryFormationActive = true; }
  activatePatternRecording() { this.patternRecordingActive = true; }
  activateEchoSystem() { this.echoSystemActive = true; }
  activateConstellationMemory() { this.constellationMemoryActive = true; }
  activateEchoLighting() { this.echoLightingActive = true; }

  activateEnvironmentalConfidence() {
    this.environmentalConfidenceActive = true;
    const cam = this.universe.cameraController;
    if (cam && cam.setDriftMultiplier) {
      const current = 1 - settings.scene006.environment.motionReduction;
      cam.setDriftMultiplier(current - SCENE007.environment.motionReduction);
    }
  }

  activateCameraPreference() { this.cameraPreferenceActive = true; }

  updateWarmthProgress(progress) {
    if (!this.universe) return;
    const lighting = this.universe.lightingEngine;
    if (!lighting || !lighting.setWarmthOffset) return;
    let warmth = progress * SCENE007.environment.warmthIncrease;
    if (this.echoLightingActive) {
      warmth += SCENE007.lighting.echoStrength * progress;
    }
    lighting.setWarmthOffset(warmth);
  }

  updateMemoryStrengthGrowth(progress) {
    if (!this.memoryEngine) return;
    const target = SCENE007.memory.strengthTarget;
    if (this.memoryEngine.getMemoryStrength() < target * progress) {
      const memories = this.memoryEngine.getStrongestMemories(4);
      for (let i = 0; i < 4; i++) {
        if (memories[i] && memories[i].active) {
          const idx = findMemoryIndex(this, memories[i]);
          if (idx >= 0) this.memoryEngine.reinforceMemory(idx);
        }
      }
    }
  }

  updateCameraPreference(progress) {
    if (!this.cameraPreferenceActive || !this.universe) return;
    const cam = this.universe.cameraController;
    const cfg = SCENE007.camera;
    const factor = this.reducedMotion ? cfg.reducedMotionFactor : 1;
    const memories = this.memoryEngine.getStrongestMemories(4);
    let total = 0;
    let wx = 0;
    let wy = 0;
    for (let i = 0; i < 4; i++) {
      if (memories[i] && memories[i].active) {
        wx += memories[i].x * memories[i].strength;
        wy += memories[i].y * memories[i].strength;
        total += memories[i].strength;
      }
    }
    if (total > 0) {
      const w = this.universe.canvasManager.width;
      const h = this.universe.canvasManager.height;
      const nx = ((wx / total) - w * 0.5) / w;
      const ny = ((wy / total) - h * 0.5) / h;
      cam.setTarget(nx * progress * cfg.memoryWeight * factor * 5,
        ny * progress * cfg.memoryWeight * factor * 5);
    }
  }

  emitAudioEvent(name) {
    if (this.audioArchitecture) this.audioArchitecture.emit(name);
  }

  markCompleted() { this.completed = true; }
  isCompleted() { return this.completed; }

  resize(width, height) {
    if (this.memoryEngine) this.memoryEngine.resize(width, height);
    if (this.recognitionEngine) this.recognitionEngine.resize(width, height);
    if (this.patternSuggestion) this.patternSuggestion.resize(width, height);
    if (this.negativeSpaceDirector) this.negativeSpaceDirector.resize(width, height);
  }

  async leave() {
    this.state = SCENE_STATES.LEAVING;
    if (!this.skipEnvironmentTeardown) this.destroySubsystems();
    if (this.universe) {
      this.universe.cameraController.clearClusterBias();
      this.universe.cameraController.setTarget(0, 0);
    }
    this.state = SCENE_STATES.CLEANUP;
  }

  destroySubsystems() {
    const systems = [
      'director', 'memoryEngine', 'patternMemory', 'echoSystem',
      'recognitionEngine', 'patternSuggestion', 'negativeSpaceDirector',
      'behaviorSystem', 'influenceEngine', 'networkEngine',
      'curiosityBehavior', 'synchronizationSystem',
      'connectionRenderer', 'constellationHints', 'audioArchitecture'
    ];
    for (let i = 0; i < systems.length; i++) {
      if (this[systems[i]]) { this[systems[i]].destroy(); this[systems[i]] = null; }
    }
  }

  destroy() {
    this.destroySubsystems();
    this.universe = null;
    this.state = SCENE_STATES.DESTROYED;
  }
}
