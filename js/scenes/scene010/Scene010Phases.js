/**
 * Scene010Phases
 * Emotional phase definitions for Scene010_Arrival.
 * Total duration: 45 seconds across 5 phases.
 *
 * Phase 1 Approach (0-9s): Spatial compression begins. Camera drift reduces.
 * Phase 2 Presence (9-18s): Connection breathing deepens. Warmth increases.
 * Phase 3 Stillness (18-27s): Environment quiets fully. Motion nearly stops.
 * Phase 4 Anticipation (27-36s): Focus sharpens. Subtle tension builds.
 * Phase 5 Arrival (36-45s): Everything settles. Scene completes.
 *
 * Invisible to the audience. Phases communicate through composition,
 * lighting, focus, and opacity - never through explicit transitions.
 */

import { ARRIVAL_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const PHASES = settings.scene010.phases;

/** Total duration of Scene010 emotional timeline in seconds. */
export const SCENE010_DURATION = 45;

/**
 * Build the emotional phase array for Scene010.
 * @param {Object} scene - Scene010_Arrival instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene010Phases(scene) {
  return [
    buildPhaseApproach(scene),
    buildPhasePresence(scene),
    buildPhaseStillness(scene),
    buildPhaseAnticipation(scene),
    buildPhaseArrival(scene)
  ];
}

/**
 * Phase 1: Approach (0-9s).
 * Spatial compression begins. The perceived distance shrinks.
 * Camera drift starts reducing. Connection starts subtle breathing.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseApproach(scene) {
  return {
    id: ARRIVAL_STATES.APPROACH,
    startTime: PHASES.approach.start,
    duration: PHASES.approach.duration,
    onEnter() {
      scene.activateApproach();
    },
    onUpdate(progress) {
      scene.updateCompression(progress * 0.3);
      scene.updateQuieting(progress * 0.2);
      scene.updateWarmth(progress * 0.2);
      scene.updateConnectionBreathing(progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 2: Presence (9-18s).
 * Connection breathing becomes deeper and slower.
 * Warmth increases. The filament becomes emotionally meaningful.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhasePresence(scene) {
  return {
    id: ARRIVAL_STATES.PRESENCE,
    startTime: PHASES.presence.start,
    duration: PHASES.presence.duration,
    onEnter() {
      scene.activatePresence();
    },
    onUpdate(progress) {
      scene.updateCompression(0.3 + progress * 0.2);
      scene.updateQuieting(0.2 + progress * 0.25);
      scene.updateWarmth(0.2 + progress * 0.2);
      scene.updateConnectionBreathing(0.3 + progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Stillness (18-27s).
 * Environment quiets fully. Motion nearly stops.
 * The audience should feel the world holding its breath.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseStillness(scene) {
  return {
    id: ARRIVAL_STATES.STILLNESS,
    startTime: PHASES.stillness.start,
    duration: PHASES.stillness.duration,
    onEnter() {
      scene.activateStillness();
    },
    onUpdate(progress) {
      scene.updateCompression(0.5 + progress * 0.15);
      scene.updateQuieting(0.45 + progress * 0.25);
      scene.updateWarmth(0.4 + progress * 0.2);
      scene.updateConnectionBreathing(0.6 + progress * 0.15);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Anticipation (27-36s).
 * Focus sharpens. Subtle tension builds through composition.
 * Something meaningful is about to happen.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseAnticipation(scene) {
  return {
    id: ARRIVAL_STATES.ANTICIPATION,
    startTime: PHASES.anticipation.start,
    duration: PHASES.anticipation.duration,
    onEnter() {
      scene.activateAnticipation();
    },
    onUpdate(progress) {
      scene.updateCompression(0.65 + progress * 0.15);
      scene.updateQuieting(0.7 + progress * 0.15);
      scene.updateWarmth(0.6 + progress * 0.2);
      scene.updateConnectionBreathing(0.75 + progress * 0.15);
      scene.updateFocus(progress);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Arrival (36-45s).
 * Everything settles into place. The journey has reached
 * a meaningful destination. Scene marks completion.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseArrival(scene) {
  return {
    id: ARRIVAL_STATES.ARRIVAL,
    startTime: PHASES.arrival.start,
    duration: PHASES.arrival.duration,
    onEnter() {
      scene.activateArrival();
    },
    onUpdate(progress) {
      scene.updateCompression(0.8 + progress * 0.2);
      scene.updateQuieting(0.85 + progress * 0.15);
      scene.updateWarmth(0.8 + progress * 0.2);
      scene.updateConnectionBreathing(0.9 + progress * 0.1);
      scene.updateFocus(1.0);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
