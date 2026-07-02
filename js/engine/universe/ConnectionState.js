/**
 * ConnectionState
 * State machine for a single particle connection lifecycle.
 *
 * Active states (implemented):
 *   CANDIDATE - Two particles identified as potential connection
 *   PENDING - Particles approaching each other
 *   CONNECTED - Filament drawn, connection alive
 *   DORMANT - Connection inactive but preserved
 *   BROKEN - Connection severed
 *
 * Future states (documented, NOT implemented):
 *   TRUSTED - Repeated positive interactions
 *   VERIFIED - Mutual acknowledgement
 *   CONVERSATION - Active data exchange
 *   COMMUNITY - Part of a larger group structure
 */

import { CONNECTION_STATES } from '../../config/constants.js';

/** @type {Set<string>} Valid active states */
const ACTIVE_STATES = Object.freeze(new Set([
  CONNECTION_STATES.CANDIDATE,
  CONNECTION_STATES.PENDING,
  CONNECTION_STATES.CONNECTED,
  CONNECTION_STATES.DORMANT,
  CONNECTION_STATES.BROKEN
]));

/** @type {Map<string, Set<string>>} Allowed transitions from each state */
const TRANSITIONS = Object.freeze(new Map([
  [CONNECTION_STATES.CANDIDATE, Object.freeze(new Set([
    CONNECTION_STATES.PENDING,
    CONNECTION_STATES.BROKEN
  ]))],
  [CONNECTION_STATES.PENDING, Object.freeze(new Set([
    CONNECTION_STATES.CONNECTED,
    CONNECTION_STATES.BROKEN
  ]))],
  [CONNECTION_STATES.CONNECTED, Object.freeze(new Set([
    CONNECTION_STATES.DORMANT,
    CONNECTION_STATES.BROKEN
  ]))],
  [CONNECTION_STATES.DORMANT, Object.freeze(new Set([
    CONNECTION_STATES.CONNECTED,
    CONNECTION_STATES.BROKEN
  ]))],
  [CONNECTION_STATES.BROKEN, Object.freeze(new Set([]))]
]));

export class ConnectionState {
  constructor() {
    /** @type {string} Current state */
    this.currentState = CONNECTION_STATES.CANDIDATE;

    /** @type {Function[]} Transition callbacks */
    this.listeners = [];

    /**
     * Pre-allocated connection data object.
     * Mutated in-place to avoid allocations during hot paths.
     * @type {{indexA: number, indexB: number, state: string, progress: number, age: number, lineOpacity: number, lineWidth: number, pulseProgress: number, pauseElapsed: number}}
     */
    this.data = {
      indexA: -1,
      indexB: -1,
      state: CONNECTION_STATES.CANDIDATE,
      progress: 0,
      age: 0,
      lineOpacity: 0,
      lineWidth: 0,
      pulseProgress: 0,
      pauseElapsed: 0
    };
  }

  /**
   * Transition to a new state if the transition is valid.
   * @param {string} newState - Target state
   * @returns {boolean} True if transition succeeded
   */
  transition(newState) {
    if (!ACTIVE_STATES.has(newState)) return false;

    const allowed = TRANSITIONS.get(this.currentState);
    if (!allowed || !allowed.has(newState)) return false;

    const previousState = this.currentState;
    this.currentState = newState;
    this.data.state = newState;

    this.notifyListeners(previousState, newState);
    return true;
  }

  /**
   * Get the current state.
   * @returns {string} Current connection state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Register a callback for state transitions.
   * @param {Function} callback - Called with (previousState, newState)
   */
  onTransition(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all registered listeners of a state transition.
   * @param {string} previousState - State transitioned from
   * @param {string} newState - State transitioned to
   */
  notifyListeners(previousState, newState) {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](previousState, newState);
    }
  }

  /**
   * Reset the state machine to initial state and clear data.
   */
  reset() {
    this.currentState = CONNECTION_STATES.CANDIDATE;
    this.data.indexA = -1;
    this.data.indexB = -1;
    this.data.state = CONNECTION_STATES.CANDIDATE;
    this.data.progress = 0;
    this.data.age = 0;
    this.data.lineOpacity = 0;
    this.data.lineWidth = 0;
    this.data.pulseProgress = 0;
    this.data.pauseElapsed = 0;
  }

  /**
   * Destroy the state machine and release listeners.
   */
  destroy() {
    this.listeners = [];
    this.reset();
  }
}
