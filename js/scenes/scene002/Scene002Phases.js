/**
 * Scene002Phases
 * Builds the emotional phase definitions for Scene002_Awakening.
 * Phases define timing and callbacks for the SceneDirector.
 * Separated from the scene class to keep both under 400 lines.
 */

import { SCENE_DIRECTOR_PHASES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { lerp } from '../../utils/helpers.js';

/** Total duration of Scene002 emotional timeline in seconds */
export const SCENE002_DURATION = 15;

// Phase timing constants
const PHASE1_START = 0;
const PHASE1_DURATION = 3;
const PHASE2_START = 3;
const PHASE2_DURATION = 3;
const PHASE3_START = 6;
const PHASE3_DURATION = 2;
const PHASE4_START = 8;
const PHASE4_DURATION = 2;
const PHASE5_START = 10;
const PHASE5_DURATION = 2;
const PHASE6_START = 12;
const PHASE6_DURATION = 2;
const PHASE7_START = 14;
const PHASE7_DURATION = 1;

// Field strength constants
const FIELD_RAMP_START = 0.0;
const FIELD_RAMP_END = 1.0;
const FIELD_STRONG = 2.0;
const FIELD_WEAK = 0.3;

/**
 * Build the emotional phase array for Scene002.
 * Each phase references the scene instance for mutation.
 * @param {Object} scene - Scene002_Awakening instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene002Phases(scene) {
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
 * Phase 1: Universe exists (0-3s). Scene001 atmosphere continues.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase1(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.DORMANT,
    startTime: PHASE1_START,
    duration: PHASE1_DURATION,
    onEnter: null,
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 2: Subtle energy increase (3-6s). Field strength ramps.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase2(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.AWAKENING,
    startTime: PHASE2_START,
    duration: PHASE2_DURATION,
    onEnter: null,
    onUpdate(progress) {
      scene.fieldStrengthMultiplier = lerp(FIELD_RAMP_START, FIELD_RAMP_END, progress);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Organize behavior activates gently (6-8s).
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase3(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.AWAKENING,
    startTime: PHASE3_START,
    duration: PHASE3_DURATION,
    onEnter() {
      scene.enableOrganize();
    },
    onUpdate(progress) {
      scene.fieldStrengthMultiplier = FIELD_RAMP_END;
    },
    onLeave: null
  };
}

/**
 * Phase 4: Forces pull particles (8-10s). Field strength increases.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase4(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASE4_START,
    duration: PHASE4_DURATION,
    onEnter: null,
    onUpdate(progress) {
      scene.fieldStrengthMultiplier = lerp(FIELD_RAMP_END, FIELD_STRONG, progress);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Clusters form (10-12s). 3-5-8 particle groups.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase5(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASE5_START,
    duration: PHASE5_DURATION,
    onEnter() {
      scene.enableClusters();
    },
    onUpdate(progress) {
      scene.fieldStrengthMultiplier = FIELD_STRONG;
    },
    onLeave: null
  };
}

/**
 * Phase 6: Clusters dissolve (12-14s). Field weakens, organize reduces.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase6(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASE6_START,
    duration: PHASE6_DURATION,
    onEnter() {
      scene.disableClusters();
      scene.disableOrganize();
    },
    onUpdate(progress) {
      scene.fieldStrengthMultiplier = lerp(FIELD_STRONG, FIELD_WEAK, progress);
    },
    onLeave: null
  };
}

/**
 * Phase 7: One brighter particle (14-15s). Elevated targetOpacity.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhase7(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.FLOURISHING,
    startTime: PHASE7_START,
    duration: PHASE7_DURATION,
    onEnter() {
      scene.elevateBrighterParticle();
      scene.fieldStrengthMultiplier = FIELD_WEAK;
    },
    onUpdate: null,
    onLeave() {
      scene.markCompleted();
    }
  };
}
