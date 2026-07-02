/**
 * Scene004Phases
 * Emotional phase definitions for Scene004_Ripple.
 * Total duration: 25 seconds across 5 phases.
 *
 * Phase 1 Silence (0-4s): Nothing happens. The pause after the pulse. Anticipation.
 * Phase 2 Influence (4-10s): InfluenceEngine activates. First particle changes direction.
 * Phase 3 Ripple (10-16s): RipplePropagation expands. More particles affected gradually.
 * Phase 4 Discovery (16-21s): CuriosityBehavior activates. Micro-sync begins.
 * Phase 5 Hope (21-25s): Environment warms slightly. Scene completes.
 *
 * Separated from the scene class to keep both under 400 lines.
 */

import { SCENE_DIRECTOR_PHASES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const PHASES = settings.scene004.phases;

/** Total duration of Scene004 emotional timeline in seconds. */
export const SCENE004_DURATION = 25;

/**
 * Build the emotional phase array for Scene004.
 * Each phase references the scene instance for mutation.
 * @param {Object} scene - Scene004_Ripple instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene004Phases(scene) {
  return [
    buildPhaseSilence(scene),
    buildPhaseInfluence(scene),
    buildPhaseRipple(scene),
    buildPhaseDiscovery(scene),
    buildPhaseHope(scene)
  ];
}

/**
 * Phase 1: Silence (0-4s).
 * Nothing visible happens. The pause after connection pulse. Pure anticipation.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseSilence(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.DORMANT,
    startTime: PHASES.silence.start,
    duration: PHASES.silence.duration,
    onEnter() {
      // Absolute stillness. The universe holds its breath.
    },
    onUpdate: null,
    onLeave: null
  };
}

/**
 * Phase 2: Influence (4-10s).
 * InfluenceEngine activates from connection midpoint. First particle changes.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseInfluence(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASES.influence.start,
    duration: PHASES.influence.duration,
    onEnter() {
      scene.activateInfluence();
      scene.emitAudioEvent('influence_started');
    },
    onUpdate(progress) {
      // Camera begins to broaden attention slowly
      scene.updateCameraBroaden(progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Ripple (10-16s).
 * RipplePropagation expands. More particles affected gradually.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseRipple(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.EXPLORING,
    startTime: PHASES.ripple.start,
    duration: PHASES.ripple.duration,
    onEnter() {
      scene.activateRipple();
      scene.emitAudioEvent('ripple_expanding');
    },
    onUpdate(progress) {
      scene.updateCameraBroaden(0.3 + progress * 0.3);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Discovery (16-21s).
 * CuriosityBehavior activates. Micro-synchronization begins.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseDiscovery(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.CONNECTING,
    startTime: PHASES.discovery.start,
    duration: PHASES.discovery.duration,
    onEnter() {
      scene.activateCuriosity();
      scene.activateSynchronization();
      scene.emitAudioEvent('curiosity_detected');
      scene.emitAudioEvent('synchronization_started');
    },
    onUpdate(progress) {
      scene.updateCameraBroaden(0.6 + progress * 0.2);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Hope (21-25s).
 * Environment responds with warmth. Fog breathes differently. Scene completes.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseHope(scene) {
  return {
    id: SCENE_DIRECTOR_PHASES.FLOURISHING,
    startTime: PHASES.hope.start,
    duration: PHASES.hope.duration,
    onEnter() {
      scene.activateEnvironmentalResponse();
    },
    onUpdate(progress) {
      scene.updateEnvironmentalWarmth(progress);
      scene.updateCameraBroaden(0.8 + progress * 0.2);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
