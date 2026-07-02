/**
 * Scene009Phases
 * Emotional phase definitions for Scene009_Descent.
 * Total duration: 45 seconds across 5 phases.
 *
 * Phase 1 Stillness (0-8s): Universe calm. Gravity active. Camera barely moves.
 * Phase 2 Decision (8-15s): Drift reduces further. Connection subtly brightens.
 * Phase 3 Commitment (15-23s): Journey begins. JourneyController activated.
 * Phase 4 Journey (23-35s): Camera progresses. Environment responds to movement.
 * Phase 5 Approach (35-45s): Camera slows near destination. Scene completes.
 *
 * The audience should feel inevitability, not direction.
 * Movement emerges from intention, not from mechanics.
 */

import { JOURNEY_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const PHASES = settings.scene009.phases;

/** Total duration of Scene009 emotional timeline in seconds. */
export const SCENE009_DURATION = 45;

/**
 * Build the emotional phase array for Scene009.
 * @param {Object} scene - Scene009_Descent instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene009Phases(scene) {
  return [
    buildPhaseStillness(scene),
    buildPhaseDecision(scene),
    buildPhaseCommitment(scene),
    buildPhaseJourney(scene),
    buildPhaseApproach(scene)
  ];
}

/**
 * Phase 1: Stillness (0-8s).
 * Universe is calm. Gravity holds. Camera barely moves.
 * Connection glows quietly. The audience absorbs.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseStillness(scene) {
  return {
    id: JOURNEY_STATES.STILLNESS,
    startTime: PHASES.stillness.start,
    duration: PHASES.stillness.duration,
    onEnter() {
      scene.activateStillness();
    },
    onUpdate(progress) {
      scene.updateConnectionGlow(progress * 0.2);
      scene.updateWarmthProgress(progress * 0.15);
    },
    onLeave: null
  };
}

/**
 * Phase 2: Decision (8-15s).
 * Camera drift reduces. Connection brightens subtly.
 * The audience begins to sense direction without seeing it.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseDecision(scene) {
  return {
    id: JOURNEY_STATES.DECISION,
    startTime: PHASES.decision.start,
    duration: PHASES.decision.duration,
    onEnter() {
      scene.activateDecision();
    },
    onUpdate(progress) {
      scene.updateConnectionGlow(0.2 + progress * 0.15);
      scene.updateDriftReduction(progress);
      scene.updateWarmthProgress(0.15 + progress * 0.15);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Commitment (15-23s).
 * Journey begins. JourneyController starts. Audio hook fires.
 * The camera develops purpose.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseCommitment(scene) {
  return {
    id: JOURNEY_STATES.COMMITMENT,
    startTime: PHASES.commitment.start,
    duration: PHASES.commitment.duration,
    onEnter() {
      scene.activateCommitment();
    },
    onUpdate(progress) {
      scene.updateConnectionGlow(0.35 + progress * 0.15);
      scene.updateWarmthProgress(0.3 + progress * 0.15);
      scene.updateDepthEnhancement(progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Journey (23-35s).
 * Camera progresses toward connection. Nearby particles enrich.
 * Far particles fade. Depth increases. Parallax communicates scale.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseJourney(scene) {
  return {
    id: JOURNEY_STATES.JOURNEY,
    startTime: PHASES.journey.start,
    duration: PHASES.journey.duration,
    onEnter() {
      scene.activateJourneyPhase();
    },
    onUpdate(progress) {
      scene.updateConnectionGlow(0.5 + progress * 0.25);
      scene.updateWarmthProgress(0.45 + progress * 0.25);
      scene.updateDepthEnhancement(0.3 + progress * 0.4);
      scene.updateEnvironmentalResponse(progress);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Approach (35-45s).
 * Camera slows near destination. Everything holds.
 * The journey is nearly complete. Scene marks completion at end.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseApproach(scene) {
  return {
    id: JOURNEY_STATES.APPROACH,
    startTime: PHASES.approach.start,
    duration: PHASES.approach.duration,
    onEnter() {
      scene.activateApproach();
    },
    onUpdate(progress) {
      scene.updateConnectionGlow(0.75 + progress * 0.25);
      scene.updateWarmthProgress(0.7 + progress * 0.3);
      scene.updateDepthEnhancement(0.7 + progress * 0.3);
      scene.updateApproachSlowdown(progress);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
