/**
 * Scene006_Recognition
 * The moment when the audience begins recognizing something familiar
 * without being told what it is. Delayed realization, never explanation.
 *
 * Timeline: Wonder(0-8s), Suspicion(8-16s), Recognition(16-24s),
 * Reflection(24-30s), Mystery(30-35s). ~35 seconds total.
 *
 * Camera follows composition. Motion slightly reduced. Warmth +2% only.
 * RecognitionConfidence: 0 -> ~0.35 by end.
 * Constellation hints: max 4, <8% opacity, more meaningful placement.
 */

import {
  SCENE_STATES, BEHAVIOR_IDS, UNIVERSE_LAYERS, INFLUENCE_TYPES
} from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
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
import {
  buildScene006Phases, SCENE006_DURATION
} from './scene006/Scene006Phases.js';

const SCENE_ID = 'scene006_recognition';
const SCENE006 = settings.scene006;

export class Scene006_Recognition {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;

    // Subsystems (all null until enter)
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

    // Connection data from Engine
    this.connectionMidX = 0;
    this.connectionMidY = 0;
    this.connectionIndexA = -1;
    this.connectionIndexB = -1;

    // State trackers
    this.elapsedTime = 0;
    this.completed = false;
    this.recognitionActive = false;
    this.patternActive = false;
    this.negativeSpaceActive = false;
    this.compositionCameraActive = false;
    this.constellationsEvolved = false;
    this.calmActive = false;
    this.reducedMotion = false;

    // Pre-allocated metrics (zero allocation in update)
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
    this.recognitionActive = false;
    this.patternActive = false;
    this.negativeSpaceActive = false;
    this.compositionCameraActive = false;
    this.constellationsEvolved = false;
    this.calmActive = false;
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
    const width = this.universe.canvasManager.width;
    const height = this.universe.canvasManager.height;
    const maxParticles = this.universe.particleEngine.maxCount;

    this.recognitionEngine = new RecognitionEngine();
    this.recognitionEngine.init(width, height);

    this.patternSuggestion = new PatternSuggestion();
    this.patternSuggestion.init(width, height, SCENE006.patternSuggestion.seed);

    this.negativeSpaceDirector = new NegativeSpaceDirector();
    this.negativeSpaceDirector.init(width, height, 719);

    this.influenceEngine = new InfluenceEngine();
    this.influenceEngine.init(width, height);

    this.networkEngine = new NetworkEngine();
    this.networkEngine.init(width, height, maxParticles);
    this.networkEngine.setReducedMotion(this.reducedMotion);

    this.curiosityBehavior = new CuriosityBehavior();
    this.curiosityBehavior.setReducedMotion(this.reducedMotion);

    this.synchronizationSystem = new SynchronizationSystem();
    this.synchronizationSystem.init(maxParticles);
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

    this.audioArchitecture = new AudioArchitecture();
    this.audioArchitecture.init();
    this.audioArchitecture.registerEvent('suspicion_forming');
    this.audioArchitecture.registerEvent('recognition_emerging');
    this.audioArchitecture.registerEvent('reflection_settling');
    this.audioArchitecture.registerEvent('mystery_deepening');
  }

  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);
    const phases = buildScene006Phases(this);
    this.director.setPhases(phases);
    this.director.start();
  }

  activateEnvironment() {
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
  }

  /**
   * Register the CONSTELLATIONS layer renderer.
   * Renders persistent filament AND evolved constellation hints.
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
        if (indexA >= 0 && indexB >= 0) {
          const pA = particles[indexA];
          const pB = particles[indexB];
          if (pA && pB) {
            this.connectionRenderer.render(
              ctx, pA, pB, 1.0, this.reducedMotion, deltaTime
            );
          }
        }
        if (this.constellationsEvolved && this.constellationHints) {
          this.constellationHints.render(
            ctx, particles, deltaTime, this.reducedMotion
          );
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

    if (this.recognitionActive) {
      this.populateGraphMetrics();
      this.recognitionEngine.update(
        deltaTime, this._graphMetrics, this._graphMetrics.neighborhoods
      );
    }

    if (this.patternActive) {
      this.patternSuggestion.update(
        deltaTime, this.recognitionEngine.getConfidence()
      );
    }

    if (this.negativeSpaceActive) {
      this.negativeSpaceDirector.update(
        deltaTime, pool, activeCount, this.recognitionEngine.getConfidence()
      );
    }

    this.applySubsystemForces(pool, activeCount, deltaTime);

    this.behaviorSystem.update(pool, activeCount, deltaTime, this.elapsedTime);
    this.synchronizationSystem.update(
      pool, activeCount, deltaTime, this.influenceEngine
    );

    if (this.constellationsEvolved && this.constellationHints) {
      this.constellationHints.update(
        deltaTime, this.elapsedTime, this.networkEngine.graph, pool, activeCount
      );
    }
  }

  /** Apply pattern suggestion and negative space forces to particles. */
  applySubsystemForces(pool, activeCount, deltaTime) {
    const hasPattern = this.patternActive && this.patternSuggestion;
    const hasVoids = this.negativeSpaceActive && this.negativeSpaceDirector;
    if (!hasPattern && !hasVoids) return;

    const bias = SCENE006.patternSuggestion.velocityBias;
    const repulse = SCENE006.negativeSpace.repulsionScale;

    for (let i = 0; i < activeCount; i++) {
      const p = pool[i];
      if (!p || !p.active) continue;

      if (hasPattern) {
        const inf = this.patternSuggestion.getInfluenceAt(p.x, p.y);
        // Subtle velocity bias toward denser regions
        p.vx += inf.density * bias * deltaTime;
        p.vy += inf.alignment * bias * deltaTime;
      }

      if (hasVoids) {
        const rep = this.negativeSpaceDirector.getRepulsionAt(p.x, p.y);
        if (rep.strength > 0.001) {
          // Gentle displacement away from void centers
          p.x += rep.directionX * rep.strength * repulse * deltaTime;
          p.y += rep.directionY * rep.strength * repulse * deltaTime;
        }
      }
    }
  }

  populateGraphMetrics() {
    if (!this.networkEngine) return;
    const m = this.networkEngine.getGraphMetrics();
    this._graphMetrics.nodes = m.nodes;
    this._graphMetrics.edges = m.edges;
    this._graphMetrics.neighborhoods = m.neighborhoods;
    this._graphMetrics.trend = m.trend;
  }

  // --- Phase callbacks (called by Scene006Phases) ---

  activateRecognitionTracking() {
    this.recognitionActive = true;
    this.influenceEngine.addSource(
      this.connectionMidX, this.connectionMidY,
      INFLUENCE_TYPES.CONNECTION, 1.0
    );
    this.networkEngine.seedFromConnection(
      this.connectionMidX, this.connectionMidY,
      this.connectionIndexA, this.connectionIndexB
    );
  }

  activatePatternSuggestion() { this.patternActive = true; }
  activateNegativeSpacePreservation() { this.negativeSpaceActive = true; }
  activateCompositionCamera() { this.compositionCameraActive = true; }
  activateConstellationEvolution() { this.constellationsEvolved = true; }

  activateEnvironmentalCalm() {
    this.calmActive = true;
    const cam = this.universe.cameraController;
    if (cam && cam.setDriftMultiplier) {
      cam.setDriftMultiplier(1 - SCENE006.environment.motionReduction);
    }
  }

  /** Camera seeks composition: balance, symmetry, negative space. */
  updateCompositionCamera(progress) {
    if (!this.compositionCameraActive || !this.universe) return;
    const cam = this.universe.cameraController;
    const cfg = SCENE006.camera;
    const factor = this.reducedMotion ? cfg.reducedMotionFactor : 1;
    const weight = progress * cfg.compositionWeight * factor;
    const targetX = this.connectionMidX * (1 - progress) * 0.001;
    const targetY = this.connectionMidY * (1 - progress) * 0.001;
    cam.setTarget(targetX * weight, targetY * weight);
  }

  /** Update environmental warmth (+2% max). */
  updateWarmthProgress(progress) {
    if (!this.universe) return;
    const warmth = progress * SCENE006.environment.warmthIncrease;
    const lighting = this.universe.lightingEngine;
    if (lighting && lighting.setWarmthOffset) {
      lighting.setWarmthOffset(warmth);
    }
  }

  emitAudioEvent(eventName) {
    if (this.audioArchitecture) {
      this.audioArchitecture.emit(eventName);
    }
  }

  markCompleted() { this.completed = true; }
  isCompleted() { return this.completed; }

  /** Propagate canvas resize to subsystems. */
  resize(width, height) {
    if (this.recognitionEngine) this.recognitionEngine.resize(width, height);
    if (this.patternSuggestion) this.patternSuggestion.resize(width, height);
    if (this.negativeSpaceDirector) this.negativeSpaceDirector.resize(width, height);
  }

  async leave() {
    this.state = SCENE_STATES.LEAVING;
    this.destroySubsystems();
    if (this.universe) {
      this.universe.cameraController.clearClusterBias();
      this.universe.cameraController.setTarget(0, 0);
    }
    this.state = SCENE_STATES.CLEANUP;
  }

  destroySubsystems() {
    const systems = [
      'director', 'recognitionEngine', 'patternSuggestion',
      'negativeSpaceDirector', 'behaviorSystem', 'influenceEngine',
      'networkEngine', 'curiosityBehavior', 'synchronizationSystem',
      'connectionRenderer', 'constellationHints', 'audioArchitecture'
    ];
    for (let i = 0; i < systems.length; i++) {
      const key = systems[i];
      if (this[key]) { this[key].destroy(); this[key] = null; }
    }
  }

  destroy() {
    this.destroySubsystems();
    this.universe = null;
    this.state = SCENE_STATES.DESTROYED;
  }
}
