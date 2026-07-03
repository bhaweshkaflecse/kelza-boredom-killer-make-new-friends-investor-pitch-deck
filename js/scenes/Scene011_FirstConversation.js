/**
 * Scene011_FirstConversation
 * The emotional heart of the experience. The first moment where
 * connection becomes human. NOT an interface. NOT a messaging screen.
 *
 * The single luminous filament remains. Its movement begins
 * resembling a heartbeat - emotionally, not literally. Nearby
 * particles become witnesses, not participants.
 *
 * Reuses: ConnectionRenderer, LightingEngine, AudioArchitecture,
 * SceneDirector, CameraController.
 * Creates: ONE ConversationDirector (scene-specific only).
 *
 * Duration: 50 seconds across 5 phases.
 * Continues from Scene010 state: camera drift ~0.01,
 * warmth ~12%, recognition ~0.55, memory ~0.25.
 */

import { SCENE_STATES, UNIVERSE_LAYERS } from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';
import { ConversationDirector } from '../engine/universe/ConversationDirector.js';
import { ConnectionRenderer } from '../engine/universe/ConnectionRenderer.js';
import { AudioArchitecture } from '../engine/universe/AudioArchitecture.js';
import { SceneDirector } from '../engine/SceneDirector.js';
import { buildScene011Phases } from './scene011/Scene011Phases.js';

const SCENE_ID = 'scene011_firstConversation';
const SCENE011 = settings.scene011;

export class Scene011_FirstConversation {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;
    this.conversationDirector = null;
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
    this.rhythmLevel = 0;
    this.witnessLevel = 0;
    this.intimacyLevel = 0;
    this.warmthProgress = 0;
    this.stillnessLevel = 0;
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
    this.rhythmLevel = 0;
    this.witnessLevel = 0;
    this.intimacyLevel = 0;
    this.warmthProgress = 0;
    this.stillnessLevel = 0;
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
    this.initConversationDirector(w, h);
    this.initAudio();
  }

  initConversationDirector(w, h) {
    this.refreshConnectionMidpoint();
    this.conversationDirector = new ConversationDirector();
    this.conversationDirector.setReducedMotion(this.reducedMotion);
    this.conversationDirector.init(
      w, h, this.connectionMidX, this.connectionMidY, SCENE011.conversation
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
    this.audioArchitecture.registerEvent('conversation_begins');
    this.audioArchitecture.registerEvent('mutual_presence');
    this.audioArchitecture.registerEvent('shared_moment');
  }

  initDirector() {
    this.director = new SceneDirector();
    this.director.init(this.universe);
    this.director.setPhases(buildScene011Phases(this));
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
        // Base breathing plus heartbeat-like rhythm from director
        const rhythmMod = this.conversationDirector
          ? this.conversationDirector.getRhythmLevel()
          : 0;
        const breath = 1.0 + rhythmMod;
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
    this.conversationDirector.update(deltaTime, pool, activeCount, cam);
  }

  // --- Phase callbacks ---

  activateSilence() {
    this.audioArchitecture.emit('conversation_begins');
  }

  activatePresence() {
    this.audioArchitecture.emit('mutual_presence');
  }

  activateRecognition() {
    // Rhythm deepening handled by phase updates
  }

  activateHumanity() {
    this.audioArchitecture.emit('shared_moment');
  }

  activateExpectation() {
    // Prepares handoff - state already converging
  }

  updateRhythm(level) {
    this.rhythmLevel = level;
    if (this.conversationDirector) {
      this.conversationDirector.setRhythmLevel(level);
    }
  }

  updateWitnessAwareness(level) {
    this.witnessLevel = level;
    if (this.conversationDirector) {
      this.conversationDirector.setWitnessLevel(level);
    }
  }

  updateWarmth(progress) {
    this.warmthProgress = progress;
    if (!this.universe) return;
    const lighting = this.universe.lightingEngine;
    if (!lighting || !lighting.setWarmthOffset) return;
    const baseWarmth = 0.12;
    const targetWarmth = SCENE011.lighting.warmthTarget;
    const warmth = baseWarmth + progress * (targetWarmth - baseWarmth);
    lighting.setWarmthOffset(warmth);
  }

  updateIntimacy(level) {
    this.intimacyLevel = level;
    // Intimacy expressed through composition: reduce ambient particle motion
    if (!this.universe) return;
    const pool = this.universe.particleEngine.pool;
    const activeCount = this.universe.particleEngine.activeCount;
    const damping = 1 - level * 0.02;
    const limit = Math.min(activeCount, pool.length);
    for (let i = 0; i < limit; i++) {
      const p = pool[i];
      if (!p || p.opacity <= 0) continue;
      p.vx *= damping;
      p.vy *= damping;
    }
  }

  updateCameraStillness(level) {
    this.stillnessLevel = level;
    if (this.conversationDirector) {
      this.conversationDirector.setStillnessLevel(level);
    }
  }

  markCompleted() {
    this.completed = true;
  }

  isCompleted() { return this.completed; }

  resize(width, height) {
    // ConversationDirector uses stored canvas dimensions
    if (this.conversationDirector) {
      this.conversationDirector.canvasW = width;
      this.conversationDirector.canvasH = height;
    }
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
      'director', 'conversationDirector',
      'connectionRenderer', 'audioArchitecture'
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
