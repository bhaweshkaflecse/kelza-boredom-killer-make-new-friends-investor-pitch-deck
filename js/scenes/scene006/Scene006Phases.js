/**
 * Scene006Phases
 * Emotional phase definitions for Scene006_Recognition.
 * Total duration: 35 seconds across 5 phases.
 *
 * Phase 1 Wonder (0-8s): The universe holds mystery. Nothing demands attention.
 * Phase 2 Suspicion (8-16s): Pattern suggestion activates. Negative space preserved.
 * Phase 3 Recognition (16-24s): Composition camera engages. Confidence grows.
 * Phase 4 Reflection (24-30s): Environmental calm settles. Warmth increases subtly.
 * Phase 5 Mystery (30-35s): Scene completes. Audience suspects but never knows.
 *
 * The audience should never consciously notice these phases.
 * Separated from the scene class to keep both under size limits.
 */

import { SCENE_DIRECTOR_PHASES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const PHASES = settings.scene006.phases;

/** Total duration of Scene006 emotional timeline in seconds. */
export const SCENE006_DURATION = 35;

/**
 * Build the emotional phase array for Scene006.
 * Each phase references the scene instance for mutation.
 * @param {Object} scene - Scene006_Recognition instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene006Phases(scene) {
  return [
    buildPhaseWonder(scene),
    buildPhaseSuspicion(scene),
    buildPhaseRecognition(scene),
    buildPhaseReflection(scene),
    buildPhaseMystery(scene)
  ];
}

/**
 * Phase 1: Wonder (0-8s).
 * The universe holds mystery. Nothing demands attention.
 * Recognition tracking begins silently.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseWonder(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.DORMANT,
    startTime: PHASES.wonder.start,
    duration: PHASES.wonder.duration,
    onEnter() {
      scene.activateRecognitionTracking();
    },
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 2: Suspicion (8-16s).
 * Pattern suggestion activates. Negative space becomes intentional.
 * Something begins to feel familiar.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseSuspicion(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.AWAKENING,
    startTime: PHASES.suspicion.start,
    duration: PHASES.suspicion.duration,
    onEnter() {
      scene.activatePatternSuggestion();
      scene.activateNegativeSpacePreservation();
      scene.emitAudioEvent('suspicion_forming');
    },
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 3: Recognition (16-24s).
 * Camera follows composition. Confidence grows. Constellation hints evolve.
 * The audience begins doing the work.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseRecognition(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASES.recognition.start,
    duration: PHASES.recognition.duration,
    onEnter() {
      scene.activateCompositionCamera();
      scene.activateConstellationEvolution();
      scene.emitAudioEvent('recognition_emerging');
    },
    onUpdate(progress) {
      scene.updateCompositionCamera(progress);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Reflection (24-30s).
 * Environmental calm settles. Warmth increases subtly.
 * Motion reduces. Confidence replaces chaos.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseReflection(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASES.reflection.start,
    duration: PHASES.reflection.duration,
    onEnter() {
      scene.activateEnvironmentalCalm();
      scene.emitAudioEvent('reflection_settling');
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(progress);
      scene.updateCompositionCamera(0.5 + progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Mystery (30-35s).
 * Scene completes. The audience suspects but never knows.
 * Everything remains unresolved. Wait for the next scene.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseMystery(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.FLOURISHING,
    startTime: PHASES.mystery.start,
    duration: PHASES.mystery.duration,
    onEnter() {
      scene.emitAudioEvent('mystery_deepening');
    },
    onUpdate(progress) {
      scene.updateCompositionCamera(0.8 + progress * 0.2);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
