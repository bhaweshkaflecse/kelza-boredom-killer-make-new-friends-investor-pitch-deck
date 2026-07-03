/**
 * Scene011Phases
 * Emotional phase definitions for Scene011_FirstConversation.
 * Total duration: 50 seconds across 5 phases.
 *
 * Phase 1 Silence (0-10s): World holds its breath. Minimal change.
 * Phase 2 Presence (10-20s): Rhythm emerges. Witness particles gain awareness.
 * Phase 3 Recognition (20-30s): Heartbeat rhythm deepens. Warmth increases.
 * Phase 4 Humanity (30-40s): Full emotional presence. Maximum intimacy.
 * Phase 5 Expectation (40-50s): Scene reaches completion. Prepares handoff.
 *
 * Invisible to the audience. Phases communicate through composition,
 * lighting, rhythm, and opacity - never through explicit transitions.
 */

import { settings } from '../../config/settings.js';

const PHASES = settings.scene011.phases;

/** Total duration of Scene011 emotional timeline in seconds. */
export const SCENE011_DURATION = 50;

/**
 * Build the emotional phase array for Scene011.
 * @param {Object} scene - Scene011_FirstConversation instance
 * @returns {Object[]} Array of phase definitions
 */
export function buildScene011Phases(scene) {
  return [
    buildPhaseSilence(scene),
    buildPhasePresence(scene),
    buildPhaseRecognition(scene),
    buildPhaseHumanity(scene),
    buildPhaseExpectation(scene)
  ];
}

/**
 * Phase 1: Silence (0-10s).
 * The world holds its breath. Almost nothing changes.
 * The connection filament breathes gently but with no rhythm yet.
 * Camera nearly locked. Quiet.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseSilence(scene) {
  return {
    id: 'silence',
    startTime: PHASES.silence.start,
    duration: PHASES.silence.duration,
    onEnter() {
      scene.activateSilence();
    },
    onUpdate(progress) {
      scene.updateRhythm(progress * 0.1);
      scene.updateWitnessAwareness(0);
      scene.updateWarmth(progress * 0.1);
      scene.updateIntimacy(progress * 0.05);
      scene.updateCameraStillness(progress * 0.3 + 0.5);
    },
    onLeave: null
  };
}

/**
 * Phase 2: Presence (10-20s).
 * Rhythm begins to emerge in the filament.
 * Witness particles gain subtle awareness - not attraction.
 * Warmth gently increases.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhasePresence(scene) {
  return {
    id: 'presence',
    startTime: PHASES.presence.start,
    duration: PHASES.presence.duration,
    onEnter() {
      scene.activatePresence();
    },
    onUpdate(progress) {
      scene.updateRhythm(0.1 + progress * 0.3);
      scene.updateWitnessAwareness(progress * 0.3);
      scene.updateWarmth(0.1 + progress * 0.15);
      scene.updateIntimacy(0.05 + progress * 0.15);
      scene.updateCameraStillness(0.8 + progress * 0.1);
    },
    onLeave: null
  };
}

/**
 * Phase 3: Recognition (20-30s).
 * Heartbeat rhythm deepens. The filament feels alive.
 * Warmth increases noticeably. Witness particles more aware.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseRecognition(scene) {
  return {
    id: 'recognition',
    startTime: PHASES.recognition.start,
    duration: PHASES.recognition.duration,
    onEnter() {
      scene.activateRecognition();
    },
    onUpdate(progress) {
      scene.updateRhythm(0.4 + progress * 0.3);
      scene.updateWitnessAwareness(0.3 + progress * 0.3);
      scene.updateWarmth(0.25 + progress * 0.25);
      scene.updateIntimacy(0.2 + progress * 0.3);
      scene.updateCameraStillness(0.9 + progress * 0.05);
    },
    onLeave: null
  };
}

/**
 * Phase 4: Humanity (30-40s).
 * Full emotional presence. Maximum intimacy. The connection
 * is undeniably human. Rhythm is fully developed.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseHumanity(scene) {
  return {
    id: 'humanity',
    startTime: PHASES.humanity.start,
    duration: PHASES.humanity.duration,
    onEnter() {
      scene.activateHumanity();
    },
    onUpdate(progress) {
      scene.updateRhythm(0.7 + progress * 0.2);
      scene.updateWitnessAwareness(0.6 + progress * 0.25);
      scene.updateWarmth(0.5 + progress * 0.3);
      scene.updateIntimacy(0.5 + progress * 0.35);
      scene.updateCameraStillness(0.95 + progress * 0.03);
    },
    onLeave: null
  };
}

/**
 * Phase 5: Expectation (40-50s).
 * Scene reaches completion. Everything is settled.
 * Prepares handoff to the next scene. Marks completion.
 * @param {Object} scene - Scene reference
 * @returns {Object} Phase definition
 */
function buildPhaseExpectation(scene) {
  return {
    id: 'expectation',
    startTime: PHASES.expectation.start,
    duration: PHASES.expectation.duration,
    onEnter() {
      scene.activateExpectation();
    },
    onUpdate(progress) {
      scene.updateRhythm(0.9 + progress * 0.1);
      scene.updateWitnessAwareness(0.85 + progress * 0.15);
      scene.updateWarmth(0.8 + progress * 0.2);
      scene.updateIntimacy(0.85 + progress * 0.15);
      scene.updateCameraStillness(0.98 + progress * 0.02);
    },
    onLeave() {
      scene.markCompleted();
    }
  };
}
