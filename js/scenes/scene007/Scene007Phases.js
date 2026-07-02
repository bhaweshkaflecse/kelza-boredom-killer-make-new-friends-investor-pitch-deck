/**
 * Scene007Phases
 * Emotional phase definitions for Scene007_Memory.
 * Total duration: 38 seconds across 5 phases.
 *
 * Phase 1 Wonder (0-8s): The universe remembers nothing yet. Silent observation.
 * Phase 2 Familiarity (8-16s): Pattern recording begins. Echo system activates.
 * Phase 3 Echo (16-24s): Constellation memory + echo lighting engage.
 * Phase 4 Memory (24-31s): Environmental confidence rises. Camera develops preference.
 * Phase 5 Expectation (31-38s): Anticipation builds. Scene completes.
 *
 * The audience should never consciously notice these phases.
 * Separated from the scene class to keep both under size limits.
 */

import { SCENE_DIRECTOR_PHASES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const PHASES = settings.scene007.phases;

/** Total duration of Scene007 emotional timeline in seconds. */
export const SCENE007_DURATION = 38;

/**
 * Build the emotional phase array for Scene007.
 * Each phase references the scene instance for mutation.
 * @param {Object} scene - Scene007_Memory instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene007Phases(scene) {
  return [
    buildPhaseWonder(scene),
    buildPhaseFamiliarity(scene),
    buildPhaseEcho(scene),
    buildPhaseMemory(scene),
    buildPhaseExpectation(scene)
  ];
}

/**
 * Phase 1: Wonder (0-8s).
 * The universe holds stillness. Memory formation begins silently.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseWonder(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.DORMANT,
    startTime: PHASES.wonder.start,
    duration: PHASES.wonder.duration,
    onEnter() {
      scene.activateMemoryFormation();
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 2: Familiarity (8-16s).
 * Pattern recording begins. Echo system becomes active.
 * The audience begins sensing repetition without understanding it.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseFamiliarity(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.AWAKENING,
    startTime: PHASES.familiarity.start,
    duration: PHASES.familiarity.duration,
    onEnter() {
      scene.activatePatternRecording();
      scene.activateEchoSystem();
      scene.emitAudioEvent('memory_created');
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.3 + progress * 0.2);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Echo (16-24s).
 * Constellation memory engages. Echo lighting provides subtle consistency.
 * Patterns begin to repeat approximately.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseEcho(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASES.echo.start,
    duration: PHASES.echo.duration,
    onEnter() {
      scene.activateConstellationMemory();
      scene.activateEchoLighting();
      scene.emitAudioEvent('pattern_recalled');
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.5 + progress * 0.2);
      scene.updateMemoryStrengthGrowth(progress);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Memory (24-31s).
 * Environmental confidence increases. Camera develops preference for
 * remembered composition regions. Coherence gently rises.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseMemory(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASES.memory.start,
    duration: PHASES.memory.duration,
    onEnter() {
      scene.activateEnvironmentalConfidence();
      scene.activateCameraPreference();
      scene.emitAudioEvent('memory_strengthened');
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.7 + progress * 0.2);
      scene.updateMemoryStrengthGrowth(0.5 + progress * 0.5);
      scene.updateCameraPreference(progress);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Expectation (31-38s).
 * Anticipation builds. The audience trusts the universe will continue.
 * Scene completes on leave.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseExpectation(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.FLOURISHING,
    startTime: PHASES.expectation.start,
    duration: PHASES.expectation.duration,
    onEnter() {
      scene.emitAudioEvent('anticipation_increased');
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.9 + progress * 0.1);
      scene.updateCameraPreference(0.5 + progress * 0.5);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
