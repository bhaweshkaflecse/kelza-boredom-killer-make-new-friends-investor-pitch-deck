/**
 * Scene003Phases
 * Builds the emotional phase definitions for Scene003_FirstConnection.
 * Phases define timing and callbacks for the SceneDirector.
 * Separated from the scene class to keep both under 400 lines.
 *
 * Key: Phase callbacks coordinate environmental responses (camera, lighting,
 * ripple) but do NOT duplicate ConnectionManager's internal lifecycle.
 * ConnectionManager handles connection mechanics independently.
 */

import { SCENE_DIRECTOR_PHASES } from '../../config/constants.js';

/** Total duration of Scene003 emotional timeline in seconds */
export const SCENE003_DURATION = 18;

// Phase timing constants
const PHASE1_START = 0;
const PHASE1_DURATION = 3;
const PHASE2_START = 3;
const PHASE2_DURATION = 4;
const PHASE3_START = 7;
const PHASE3_DURATION = 4;
const PHASE4_START = 11;
const PHASE4_DURATION = 1.5;
const PHASE5_START = 12.5;
const PHASE5_DURATION = 2;
const PHASE6_START = 14.5;
const PHASE6_DURATION = 2.5;
const PHASE7_START = 17;
const PHASE7_DURATION = 1;

// Field strength constants
const FIELD_LOW = 0.2;
const FIELD_DISCOVERY = 0.4;
const FIELD_APPROACH = 0.6;

/**
 * Build the emotional phase array for Scene003.
 * Each phase references the scene instance for mutation.
 * @param {Object} scene - Scene003_FirstConnection instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene003Phases(scene) {
  return [
    buildPhase1(scene),
    buildPhase2(scene),
    buildPhase3(scene),
    buildPhase4(scene),
    buildPhase5(scene),
    buildPhase6(scene),
    buildPhase7(scene)
  ];
}

/**
 * Phase 1: Settle (0-3s). Environment continues from Scene002, nothing happens yet.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase1(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.DORMANT,
    startTime: PHASE1_START,
    duration: PHASE1_DURATION,
    onEnter() {
      scene.fieldStrengthMultiplier = FIELD_LOW;
    },
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 2: Discovery (3-7s). ConnectionManager searches for candidate pair.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase2(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASE2_START,
    duration: PHASE2_DURATION,
    onEnter() {
      scene.fieldStrengthMultiplier = FIELD_DISCOVERY;
    },
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 3: Approach (7-11s). Two particles drift closer, ConnectionManager handles forces.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase3(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASE3_START,
    duration: PHASE3_DURATION,
    onEnter() {
      scene.fieldStrengthMultiplier = FIELD_APPROACH;
    },
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 4: The Pause (11-12.5s). The emotional moment. ConnectionManager handles pause.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase4(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASE4_START,
    duration: PHASE4_DURATION,
    onEnter: null,
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 5: Filament (12.5-14.5s). Connection line fades in.
 * Camera attention is now event-driven via ConnectionManager, not phase-driven.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase5(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASE5_START,
    duration: PHASE5_DURATION,
    onEnter: null,
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 6: Pulse and Ripple (14.5-17s). Pulse travels, ripple affects environment.
 * Ripple is now event-driven via ConnectionManager, not phase-driven.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase6(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.FLOURISHING,
    startTime: PHASE6_START,
    duration: PHASE6_DURATION,
    onEnter: null,
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 7: Settle (17-18s). Everything has happened. Scene marks completed.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase7(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.FLOURISHING,
    startTime: PHASE7_START,
    duration: PHASE7_DURATION,
    onEnter: null,
    onUpdate: null,
    onLeave() {
      scene.markCompleted();
    }
  };
}
