/**
 * SceneDirector
 * Orchestration layer for emotional pacing, timing, camera cues,
 * lighting cues, and future sound cues.
 * SceneManager manages lifecycle; SceneDirector manages emotion.
 * Has a phase system where phases advance based on elapsed time.
 * Does NOT own subsystems - issues commands via a reference to UniverseEngine.
 */

import { MANAGER_STATES, SCENE_DIRECTOR_PHASES } from '../config/constants.js';

/**
 * @typedef {Object} Phase
 * @property {string} id - Phase identifier
 * @property {number} startTime - Start time in seconds relative to director start
 * @property {number} duration - Duration in seconds
 * @property {Function} [onEnter] - Callback when phase begins
 * @property {Function} [onUpdate] - Callback each frame (receives progress 0-1)
 * @property {Function} [onLeave] - Callback when phase ends
 */

const MAX_PHASES = 16;
const MAX_CALLBACKS = 8;

export class SceneDirector {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    /** @type {Phase[]} */
    this.phases = [];
    this.phaseCount = 0;
    this.currentPhaseIndex = -1;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.universe = null;

    /** @type {Function[]} Phase change callbacks */
    this.changeCallbacks = [];
    this.changeCallbackCount = 0;
  }

  /**
   * Initialize the scene director.
   * @param {Object} universe - UniverseEngine reference for issuing commands
   */
  init(universe) {
    this.universe = universe;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Set the phase array for this director session.
   * Each phase must have: id, startTime, duration. Optional: onEnter, onUpdate, onLeave.
   * @param {Phase[]} phaseArray - Array of phase definitions
   */
  setPhases(phaseArray) {
    this.phases = phaseArray;
    this.phaseCount = phaseArray.length;
    this.currentPhaseIndex = -1;
    this.elapsedTime = 0;
  }

  /**
   * Start the director's internal timer.
   */
  start() {
    this.isRunning = true;
    this.elapsedTime = 0;
    this.currentPhaseIndex = -1;
  }

  /**
   * Update the director each frame. Advances phases based on elapsed time.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;
    if (!this.isRunning) return;
    if (this.phaseCount === 0) return;

    this.elapsedTime += deltaTime;
    this.evaluatePhase();
  }

  /**
   * Evaluate which phase should be active and call lifecycle hooks.
   */
  evaluatePhase() {
    const targetIndex = this.findActivePhaseIndex();

    if (targetIndex !== this.currentPhaseIndex) {
      this.transitionToPhase(targetIndex);
    } else if (targetIndex >= 0) {
      this.updateCurrentPhase();
    }
  }

  /**
   * Find the phase index for the current elapsed time.
   * @returns {number} Phase index or -1 if no phase active
   */
  findActivePhaseIndex() {
    for (let i = 0; i < this.phaseCount; i++) {
      const phase = this.phases[i];
      const end = phase.startTime + phase.duration;
      if (this.elapsedTime >= phase.startTime && this.elapsedTime < end) {
        return i;
      }
    }
    return this.currentPhaseIndex;
  }

  /**
   * Transition from current phase to a new phase.
   * @param {number} newIndex - Target phase index
   */
  transitionToPhase(newIndex) {
    if (this.currentPhaseIndex >= 0 && this.currentPhaseIndex < this.phaseCount) {
      const leaving = this.phases[this.currentPhaseIndex];
      if (leaving.onLeave) leaving.onLeave();
    }

    this.currentPhaseIndex = newIndex;

    if (newIndex >= 0 && newIndex < this.phaseCount) {
      const entering = this.phases[newIndex];
      if (entering.onEnter) entering.onEnter();
      this.notifyPhaseChange(entering);
    }
  }

  /**
   * Call onUpdate on the current active phase with progress.
   */
  updateCurrentPhase() {
    const phase = this.phases[this.currentPhaseIndex];
    if (!phase || !phase.onUpdate) return;

    const localTime = this.elapsedTime - phase.startTime;
    const progress = Math.min(1, localTime / phase.duration);
    phase.onUpdate(progress);
  }

  /**
   * Notify all registered phase change callbacks.
   * @param {Phase} phase - The new phase
   */
  notifyPhaseChange(phase) {
    for (let i = 0; i < this.changeCallbackCount; i++) {
      this.changeCallbacks[i](phase);
    }
  }

  /**
   * Register a callback for phase transitions.
   * @param {Function} callback - Called with the new phase object
   */
  onPhaseChange(callback) {
    if (this.changeCallbackCount >= MAX_CALLBACKS) return;
    this.changeCallbacks.push(callback);
    this.changeCallbackCount++;
  }

  /**
   * Get the currently active phase object.
   * @returns {Phase|null} Current phase or null
   */
  getCurrentPhase() {
    if (this.currentPhaseIndex < 0 || this.currentPhaseIndex >= this.phaseCount) {
      return null;
    }
    return this.phases[this.currentPhaseIndex];
  }

  /**
   * Get the current elapsed time of the director.
   * @returns {number} Elapsed time in seconds
   */
  getElapsedTime() {
    return this.elapsedTime;
  }

  /**
   * Stop the director.
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Destroy the scene director and release all references.
   */
  destroy() {
    this.stop();
    this.phases = [];
    this.phaseCount = 0;
    this.currentPhaseIndex = -1;
    this.changeCallbacks = [];
    this.changeCallbackCount = 0;
    this.universe = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
