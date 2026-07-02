/**
 * Scene005Phases
 * Emotional phase definitions for Scene005_LivingNetwork.
 * Total duration: 30 seconds across 5 phases.
 *
 * Phase 1 Isolation (0-5s): Silence. The scene holds its breath after Scene004 warmth.
 * Phase 2 Influence (5-12s): NetworkEngine seeds from connection. Graph grows invisibly.
 * Phase 3 Alignment (12-18s): Neighborhoods begin coordinating. First constellation hints.
 * Phase 4 Neighborhood (18-25s): Neighborhoods solidify then disperse. More hints appear.
 * Phase 5 Possibility (25-30s): Environmental warmth increases ~3%. Scene completes.
 *
 * The audience should never consciously notice these phases.
 * Separated from the scene class to keep both under 400 lines.
 */

import { SCENE_DIRECTOR_PHASES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const PHASES = settings.scene005.phases;

/** Total duration of Scene005 emotional timeline in seconds. */
export const SCENE005_DURATION = 30;

/**
 * Build the emotional phase array for Scene005.
 * Each phase references the scene instance for mutation.
 * @param {Object} scene - Scene005_LivingNetwork instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene005Phases(scene) {
  return [
    buildPhaseIsolation(scene),
    buildPhaseInfluence(scene),
    buildPhaseAlignment(scene),
    buildPhaseNeighborhood(scene),
    buildPhasePossibility(scene)
  ];
}

/**
 * Phase 1: Isolation (0-5s).
 * Silence. The scene holds its breath after Scene004 warmth.
 * Pure stillness. The universe pauses.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseIsolation(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.DORMANT,
    startTime: PHASES.isolation.start,
    duration: PHASES.isolation.duration,
    onEnter() {
      // Absolute stillness. The universe rests after ripple.
    },
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 2: Influence (5-12s).
 * NetworkEngine seeds from connection midpoint. Influence graph begins
 * growing invisibly. First neighborhood detection starts.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseInfluence(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASES.influence.start,
    duration: PHASES.influence.duration,
    onEnter() {
      scene.activateNetworkSeed();
      scene.emitAudioEvent('network_seeded');
    },
    onUpdate(progress) {
      scene.updateCameraBroaden(progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Alignment (12-18s).
 * Particles in neighborhoods begin coordinating velocity subtly.
 * First constellation hints may appear.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseAlignment(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASES.alignment.start,
    duration: PHASES.alignment.duration,
    onEnter() {
      scene.activateNeighborhoods();
      scene.activateConstellationHints();
      scene.emitAudioEvent('alignment_started');
    },
    onUpdate(progress) {
      scene.updateCameraBroaden(0.3 + progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Neighborhood (18-25s).
 * Neighborhoods solidify briefly then disperse. More constellation hints
 * fade in and out. Camera notices patterns.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseNeighborhood(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASES.neighborhood.start,
    duration: PHASES.neighborhood.duration,
    onEnter() {
      scene.emitAudioEvent('neighborhood_forming');
    },
    onUpdate(progress) {
      scene.updateCameraBroaden(0.6 + progress * 0.2);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Possibility (25-30s).
 * Environmental warmth increases approximately 3%. Hope.
 * Scene completes. Everything continuous.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhasePossibility(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.FLOURISHING,
    startTime: PHASES.possibility.start,
    duration: PHASES.possibility.duration,
    onEnter() {
      scene.activateEnvironmentalWarmth();
    },
    onUpdate(progress) {
      scene.updateWarmthProgress(progress);
      scene.updateCameraBroaden(0.8 + progress * 0.2);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
