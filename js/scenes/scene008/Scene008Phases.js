/**
 * Scene008Phases
 * Emotional phase definitions for Scene008_Revelation.
 * Total duration: 38 seconds across 5 phases.
 *
 * Phase 1 Calm (0-8s): Memory has stabilized. Universe becomes quieter.
 * Phase 2 Memory (8-15s): Echoes return. Memories reinforce composition.
 * Phase 3 Alignment (15-23s): Constellations align with gravitational center.
 * Phase 4 Realization (23-30s): Rotational coherence becomes perceptible.
 * Phase 5 Stillness (30-38s): Camera stops. Confidence settles. Scene completes.
 *
 * The audience should never consciously notice these phases.
 * The realization emerges from within, not from the transitions.
 */

import { REVELATION_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const PHASES = settings.scene008.phases;

/** Total duration of Scene008 emotional timeline in seconds. */
export const SCENE008_DURATION = 38;

/**
 * Build the emotional phase array for Scene008.
 * @param {Object} scene - Scene008_Revelation instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene008Phases(scene) {
  return [
    buildPhaseCalm(scene),
    buildPhaseMemory(scene),
    buildPhaseAlignment(scene),
    buildPhaseRealization(scene),
    buildPhaseStillness(scene)
  ];
}

/**
 * Phase 1: Calm (0-8s).
 * Everything becomes quieter. Motion reduces. Negative space settles.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseCalm(scene) {
  return {
    id: REVELATION_STATES.CALM,
    startTime: PHASES.calm.start,
    duration: PHASES.calm.duration,
    onEnter() {
      scene.activateGravity();
      scene.activateNegativeSpaceCalm();
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(progress * 0.2);
      scene.updateMotionReduction(progress * 0.5);
    },
    onLeave: null
  };
}

/**
 * Phase 2: Memory (8-15s).
 * Echoes return. Memory systems reinforce. Composition stabilizes.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseMemory(scene) {
  return {
    id: REVELATION_STATES.MEMORY,
    startTime: PHASES.memory.start,
    duration: PHASES.memory.duration,
    onEnter() {
      scene.activateMemoryReinforcement();
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.2 + progress * 0.2);
      scene.updateMotionReduction(0.5 + progress * 0.2);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Alignment (15-23s).
 * Constellations begin aligning with gravitational composition.
 * Coherence becomes more structured. Camera observes.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseAlignment(scene) {
  return {
    id: REVELATION_STATES.ALIGNMENT,
    startTime: PHASES.alignment.start,
    duration: PHASES.alignment.duration,
    onEnter() {
      scene.activateConstellationAlignment();
      scene.activateCameraObservation();
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.4 + progress * 0.2);
      scene.updateCoherenceGrowth(progress);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Realization (23-30s).
 * Rotational coherence becomes perceptible. The moment of understanding.
 * Recognition confidence advances. The audience feels it.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseRealization(scene) {
  return {
    id: REVELATION_STATES.REALIZATION,
    startTime: PHASES.realization.start,
    duration: PHASES.realization.duration,
    onEnter() {
      scene.activateRealizationMode();
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.6 + progress * 0.2);
      scene.updateCoherenceGrowth(0.5 + progress * 0.5);
      scene.updateConfidenceAdvancement(progress);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Stillness (30-38s).
 * Camera is almost still. Confidence settles at 0.55 max.
 * Everything holds. The understanding is complete.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseStillness(scene) {
  return {
    id: REVELATION_STATES.STILLNESS,
    startTime: PHASES.stillness.start,
    duration: PHASES.stillness.duration,
    onEnter() {
      scene.activateFullStillness();
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(0.8 + progress * 0.2);
      scene.updateConfidenceAdvancement(0.5 + progress * 0.5);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
