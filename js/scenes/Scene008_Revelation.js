/**
 * Scene008_Revelation
 * The defining cinematic moment. The audience realizes what they have been
 * watching, without being explicitly told. Everything becomes calmer.
 * Gravity emerges. Rotational coherence builds. Camera becomes still.
 * RecognitionConfidence: 0.35 -> 0.55 (never higher).
 * ConstellationHints: max 4, <8% opacity, temporary, gravitationally aligned.
 * Duration: 38 seconds across 5 phases.
 */

import {
  SCENE_STATES, BEHAVIOR_IDS, UNIVERSE_LAYERS, INFLUENCE_TYPES
} from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { GravityCenter } from '../engine/universe/GravityCenter.js';
import { MemoryEngine } from '../engine/universe/MemoryEngine.js';
import { EchoSystem } from '../engine/universe/EchoSystem.js';
import { RecognitionEngine } from '../engine/universe/RecognitionEngine.js';
import { PatternSuggestion } from '../engine/universe/PatternSuggestion.js';
import { NegativeSpaceDirector } from '../engine/universe/NegativeSpaceDirector.js';
import { BehaviorSystem } from '../engine/universe/BehaviorSystem.js';
import { InfluenceEngine } from '../engine/universe/InfluenceEngine.js';
import { CuriosityBehavior } from '../engine/universe/CuriosityBehavior.js';
import { NetworkEngine } from '../engine/universe/NetworkEngine.js';
import { ConstellationHints } from '../engine/universe/ConstellationHints.js';
import { ConnectionRenderer } from '../engine/universe/ConnectionRenderer.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import { buildScene008Phases } from './scene008/Scene008Phases.js';
import {
  resetGravityState, updateGravityInfluence, advanceConfidence,
  alignConstellations, applyMotionReduction, updateCameraComposition,
  activateAlignment, activateRealization, getCurrentConfidence
} from './scene008/Scene008GravityUpdater.js';

const SCENE_ID = 'scene008_revelation';
const SCENE008 = settings.scene008;

export class Scene008_Revelation {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;
    this.gravityCenter = null;
    this.memoryEngine = null;
    this.echoSystem = null;
    this.recognitionEngine = null;
    this.patternSuggestion = null;
    this.negativeSpaceDirector = null;
    this.networkEngine = null;
    this.influenceEngine = null;
    this.constellationHints = null;
    this.behaviorSystem = null;
    this.curiosityBehavior = null;
    this.connectionRenderer = null;
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
    this.gravityActive = false;
    this.negativeSpaceCalmActive = false;
    this.memoryReinforcementActive = false;
    this.constellationAlignmentActive = false;
    this.cameraObservationActive = false;
    this.realizationModeActive = false;
    this.fullStillnessActive = false;
    this.motionReductionLevel = 0;
    this.confidenceProgress = 0;
    this._graphMetrics = { nodes: 0, edges: 0, neighborhoods: 0, trend: 0 };
    this._lastDeltaTime = 0.016;
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
    this.gravityActive = false;
    this.negativeSpaceCalmActive = false;
    this.memoryReinforcementActive = false;
    this.constellationAlignmentActive = false;
    this.cameraObservationActive = false;
    this.realizationModeActive = false;
    this.fullStillnessActive = false;
    this.motionReductionLevel = 0;
    this.confidenceProgress = 0;
    this.reducedMotion = isReducedMotion();
    resetGravityState();

    if (this.universe) {
      this.initSubsystems();
      this.initDirector();
      this.activateEnvironment();
      this.setupCameraStillness();
      this.keepConstellationsLayer();
    }
    this.state = SCENE_STATES.ACTIVE;
  }

  initSubsystems() {
    const w = this.universe.canvasManager.width;
    const h = this.universe.canvasManager.height;
    const maxP = this.universe.particleEngine.maxCount;
    this.initGravitySystem(w, h);
    this.initContinuedSystems(w, h, maxP);
    this.initAudio();
  }

  initGravitySystem(w, h) {
    this.gravityCenter = new GravityCenter();
    this.gravityCenter.init(w, h, SCENE008.gravity.seed);
    this.memoryEngine = new MemoryEngine();
    this.memoryEngine.init(w, h, SCENE008.gravity.seed + 100);
    this.echoSystem = new EchoSystem();
    this.echoSystem.init(SCENE008.gravity.seed + 200, this.memoryEngine, null);
  }

  initContinuedSystems(w, h, maxP) {
    this.recognitionEngine = new RecognitionEngine();
    this.recognitionEngine.init(w, h);
    // Override confidence to start at 0.35
    this.recognitionEngine.confidence = SCENE008.recognition.confidenceStart;
    this.patternSuggestion = new PatternSuggestion();
    this.patternSuggestion.init(w, h, settings.scene006.patternSuggestion.seed);
    this.negativeSpaceDirector = new NegativeSpaceDirector();
    this.negativeSpaceDirector.init(w, h, 821);
    this.influenceEngine = new InfluenceEngine();
    this.influenceEngine.init(w, h);
    this.networkEngine = new NetworkEngine();
    this.networkEngine.init(w, h, maxP);
    this.networkEngine.setReducedMotion(this.reducedMotion);
    this.curiosityBehavior = new CuriosityBehavior();
    this.curiosityBehavior.setReducedMotion(this.reducedMotion);
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
    this.audioArchitecture.registerEvent('gravity_engaged');
    this.audioArchitecture.registerEvent('coherence_rising');
    this.audioArchitecture.registerEvent('realization_moment');
  }

  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);
    this.director.setPhases(buildScene008Phases(this));
    this.director.start();
  }

  activateEnvironment() {
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
  }

  setupCameraStillness() {
    const cam = this.universe.cameraController;
    if (cam && cam.setDriftMultiplier) {
      cam.setDriftMultiplier(SCENE008.camera.driftMultiplier);
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
        if (idxA >= 0 && idxB >= 0) {
          const pA = particles[idxA];
          const pB = particles[idxB];
          if (pA && pB) {
            this.connectionRenderer.render(ctx, pA, pB, 1.0, this.reducedMotion, dt);
          }
        }
        if (this.constellationAlignmentActive && this.constellationHints) {
          this.constellationHints.render(ctx, particles, dt, this.reducedMotion);
        }
      }
    );
  }

  update(deltaTime) {
    if (this.state !== SCENE_STATES.ACTIVE) return;
    this.elapsedTime += deltaTime;
    this._lastDeltaTime = deltaTime;
    this.director.update(deltaTime);
    this.updateSubsystems(deltaTime);
  }

  updateSubsystems(deltaTime) {
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;

    this.influenceEngine.update(deltaTime);
    this.networkEngine.update(pool, activeCount, deltaTime, this.influenceEngine);

    if (this.memoryEngine) {
      this.memoryEngine.update(deltaTime, pool, activeCount);
    }
    if (this.echoSystem) {
      this.echoSystem.update(deltaTime, pool, activeCount);
    }

    if (this.gravityActive) {
      updateGravityInfluence(this.gravityCenter, pool, activeCount, deltaTime);
    }

    this.updateRecognition(deltaTime);
    applyMotionReduction(pool, activeCount, deltaTime, this.motionReductionLevel);

    if (this.constellationAlignmentActive) {
      alignConstellations(this.constellationHints, this.gravityCenter);
      this.constellationHints.update(
        deltaTime, this.elapsedTime, this.networkEngine.graph, pool, activeCount
      );
    }

    if (this.cameraObservationActive) {
      const w = this.universe.canvasManager.width;
      const h = this.universe.canvasManager.height;
      updateCameraComposition(
        this.universe.cameraController, this.gravityCenter, w, h, this.reducedMotion
      );
    }

    this.behaviorSystem.update(pool, activeCount, deltaTime, this.elapsedTime);
  }

  updateRecognition(deltaTime) {
    this.populateGraphMetrics();
    this.recognitionEngine.update(
      deltaTime, this._graphMetrics, this._graphMetrics.neighborhoods
    );
    // Clamp recognition confidence to never exceed 0.55
    if (this.recognitionEngine.confidence > SCENE008.recognition.confidenceTarget) {
      this.recognitionEngine.confidence = SCENE008.recognition.confidenceTarget;
    }
    const conf = getCurrentConfidence();
    this.patternSuggestion.update(deltaTime, conf);
    this.negativeSpaceDirector.update(
      deltaTime, this.universe.particleEngine.pool,
      this.universe.particleEngine.activeCount, conf
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
  activateGravity() {
    this.gravityActive = true;
    this.audioArchitecture.emit('gravity_engaged');
  }

  activateNegativeSpaceCalm() { this.negativeSpaceCalmActive = true; }
  activateMemoryReinforcement() { this.memoryReinforcementActive = true; }

  activateConstellationAlignment() {
    this.constellationAlignmentActive = true;
    activateAlignment();
    this.audioArchitecture.emit('coherence_rising');
  }

  activateCameraObservation() {
    this.cameraObservationActive = true;
  }

  activateRealizationMode() {
    this.realizationModeActive = true;
    activateRealization();
    this.audioArchitecture.emit('realization_moment');
  }

  activateFullStillness() {
    this.fullStillnessActive = true;
    const cam = this.universe.cameraController;
    if (cam && cam.setDriftMultiplier) {
      cam.setDriftMultiplier(SCENE008.camera.driftMultiplier * 0.5);
    }
  }

  updateWarmthProgress(progress) {
    if (!this.universe) return;
    const lighting = this.universe.lightingEngine;
    if (!lighting || !lighting.setWarmthOffset) return;
    const warmth = progress * SCENE008.lighting.warmthTarget;
    lighting.setWarmthOffset(warmth);
  }

  updateMotionReduction(level) {
    this.motionReductionLevel = SCENE008.environment.motionReduction * level;
  }

  updateCoherenceGrowth(progress) {
    if (!this.gravityCenter) return;
    // Coherence growth is handled by GravityCenter internally,
    // but we can nudge it based on phase progress
    const target = SCENE008.environment.coherenceTarget * progress;
    if (this.gravityCenter.rotationalCoherence < target) {
      this.gravityCenter.rotationalCoherence +=
        SCENE008.gravity.coherenceRate * progress * 0.5;
    }
  }

  updateConfidenceAdvancement(progress) {
    this.confidenceProgress = progress;
    if (this.gravityCenter) {
      advanceConfidence(this.gravityCenter, this._lastDeltaTime, progress);
    }
  }

  markCompleted() { this.completed = true; }
  isCompleted() { return this.completed; }

  resize(width, height) {
    if (this.gravityCenter) this.gravityCenter.resize(width, height);
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
      'director', 'gravityCenter', 'memoryEngine', 'echoSystem',
      'recognitionEngine', 'patternSuggestion', 'negativeSpaceDirector',
      'behaviorSystem', 'influenceEngine', 'networkEngine',
      'curiosityBehavior', 'connectionRenderer',
      'constellationHints', 'audioArchitecture'
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
