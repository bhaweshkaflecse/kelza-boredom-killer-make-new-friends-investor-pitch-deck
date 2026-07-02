/**
 * ConnectionManager
 * Orchestrates exactly ONE connection for Scene003.
 * Manages the full lifecycle: discovery, approach, pause, connection, pulse, completion.
 * Guarantees exactly one connection - never two.
 *
 * Uses ConnectionState, ConnectionRenderer, PulseRenderer internally.
 * Exposes state for camera/audio hooks.
 */

import { MANAGER_STATES, CONNECTION_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { lerp, clamp } from '../../utils/helpers.js';
import { ConnectionState } from './ConnectionState.js';
import { ConnectionRenderer } from './ConnectionRenderer.js';
import { PulseRenderer } from './PulseRenderer.js';
import { CONNECTION_EVENTS } from './ConnectionEvents.js';

const SCENE003 = settings.scene003;

/** @type {string} Lifecycle phases for the connection director */
const PHASE_IDLE = 'idle';
const PHASE_DISCOVERY = 'discovery';
const PHASE_APPROACH = 'approach';
const PHASE_PAUSE = 'pause';
const PHASE_FILAMENT = 'filament';
const PHASE_PULSE = 'pulse';
const PHASE_COMPLETE = 'complete';

export class ConnectionManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;

    /** @type {ConnectionState} */
    this.connectionState = new ConnectionState();
    /** @type {ConnectionRenderer} */
    this.renderer = new ConnectionRenderer();
    /** @type {PulseRenderer} */
    this.pulseRenderer = new PulseRenderer();

    /** @type {string} Current lifecycle phase */
    this.phase = PHASE_IDLE;

    /** @type {boolean} Ensures only one connection ever forms */
    this.connectionFormed = false;

    /** @type {Object|null} Reference to universe engine */
    this.universe = null;

    // Timing accumulators
    this.phaseElapsed = 0;
    this.totalElapsed = 0;

    // Particle indices for the connection pair
    this.indexA = -1;
    this.indexB = -1;

    // Pre-allocated particle references (set during discovery)
    this.particleA = null;
    this.particleB = null;

    // Approach state
    this.approachStartDistSq = 0;

    // Filament progress (0-1)
    this.filamentProgress = 0;

    // Pulse progress (-1 = inactive, 0-1 = traveling)
    this.pulseProgress = -1;

    // Event listeners for external hooks
    this.eventListeners = new Map();
  }

  /**
   * Initialize the connection manager.
   * @param {Object} universe - UniverseEngine reference with particleEngine, connectionPrediction
   */
  init(universe) {
    this.universe = universe;
    const reducedMotion = this.getReducedMotion();

    this.renderer.init(reducedMotion);
    this.pulseRenderer.init(reducedMotion);
    this.phase = PHASE_DISCOVERY;
    this.phaseElapsed = 0;
    this.totalElapsed = 0;
    this.connectionFormed = false;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Update the connection lifecycle each frame.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.totalElapsed = elapsedTime;
    this.phaseElapsed += deltaTime;

    switch (this.phase) {
      case PHASE_DISCOVERY:
        this.updateDiscovery();
        break;
      case PHASE_APPROACH:
        this.updateApproach(deltaTime);
        break;
      case PHASE_PAUSE:
        this.updatePause(deltaTime);
        break;
      case PHASE_FILAMENT:
        this.updateFilament(deltaTime);
        break;
      case PHASE_PULSE:
        this.updatePulse(deltaTime);
        break;
      default:
        break;
    }
  }

  /**
   * Discovery phase: wait for minimum time then select a candidate pair.
   */
  updateDiscovery() {
    if (this.connectionFormed) return;
    if (this.phaseElapsed < SCENE003.discoveryMinTime) return;

    const prediction = this.universe.connectionPrediction;
    if (!prediction) return;

    const candidates = prediction.getCandidateConnections();
    if (!candidates || candidates.length === 0) return;

    // Select the closest candidate pair
    const best = this.selectBestCandidate(candidates);
    if (!best) return;

    this.indexA = best.indexA;
    this.indexB = best.indexB;
    this.particleA = this.universe.particleEngine.pool[this.indexA];
    this.particleB = this.universe.particleEngine.pool[this.indexB];

    // Store initial distance for approach interpolation
    const dx = this.particleB.x - this.particleA.x;
    const dy = this.particleB.y - this.particleA.y;
    this.approachStartDistSq = dx * dx + dy * dy;

    // Transition state machine
    this.connectionState.data.indexA = this.indexA;
    this.connectionState.data.indexB = this.indexB;
    this.connectionState.transition(CONNECTION_STATES.PENDING);

    this.emitEvent(CONNECTION_EVENTS.CONNECTION_DISCOVERED);
    this.emitEvent(CONNECTION_EVENTS.CONNECTION_PENDING);
    this.transitionPhase(PHASE_APPROACH);
  }

  /**
   * Select the best candidate connection (closest pair within discovery radius).
   * @param {{indexA: number, indexB: number, distSq: number}[]} candidates
   * @returns {{indexA: number, indexB: number, distSq: number}|null}
   */
  selectBestCandidate(candidates) {
    const maxDistSq = SCENE003.discoveryRadius * SCENE003.discoveryRadius;
    let best = null;
    let bestDistSq = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c.distSq < bestDistSq && c.distSq < maxDistSq) {
        const pA = this.universe.particleEngine.pool[c.indexA];
        const pB = this.universe.particleEngine.pool[c.indexB];
        if (pA && pA.active && pB && pB.active) {
          best = c;
          bestDistSq = c.distSq;
        }
      }
    }
    return best;
  }

  /**
   * Approach phase: gently pull particles toward each other.
   * @param {number} deltaTime - Frame delta
   */
  updateApproach(deltaTime) {
    if (!this.particleA || !this.particleB) return;

    const progress = clamp(this.phaseElapsed / SCENE003.approachDuration, 0, 1);
    const force = SCENE003.approachForce * progress;

    this.applyApproachForce(force);

    // Check if close enough to pause
    const dx = this.particleB.x - this.particleA.x;
    const dy = this.particleB.y - this.particleA.y;
    const distSq = dx * dx + dy * dy;
    const pauseRadiusSq = SCENE003.pauseRadius * SCENE003.pauseRadius;

    if (distSq <= pauseRadiusSq || progress >= 1) {
      this.transitionPhase(PHASE_PAUSE);
    }
  }

  /**
   * Apply a gentle attraction force between the two connected particles.
   * @param {number} force - Force magnitude
   */
  applyApproachForce(force) {
    const dx = this.particleB.x - this.particleA.x;
    const dy = this.particleB.y - this.particleA.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 1) return;

    const dist = Math.sqrt(distSq);
    const invDist = 1 / dist;
    const fx = dx * invDist * force;
    const fy = dy * invDist * force;

    this.particleA.ax += fx;
    this.particleA.ay += fy;
    this.particleB.ax -= fx;
    this.particleB.ay -= fy;
  }

  /**
   * Pause phase: particles hold still for emotional moment.
   * @param {number} deltaTime - Frame delta
   */
  updatePause(deltaTime) {
    this.connectionState.data.pauseElapsed = this.phaseElapsed;

    // Dampen velocities to create stillness
    if (this.particleA) {
      this.particleA.vx *= 0.9;
      this.particleA.vy *= 0.9;
    }
    if (this.particleB) {
      this.particleB.vx *= 0.9;
      this.particleB.vy *= 0.9;
    }

    if (this.phaseElapsed >= SCENE003.pauseDuration) {
      this.connectionState.transition(CONNECTION_STATES.CONNECTED);
      this.emitEvent(CONNECTION_EVENTS.CONNECTION_CREATED);
      this.connectionFormed = true;
      this.transitionPhase(PHASE_FILAMENT);
    }
  }

  /**
   * Filament phase: fade in the connection line.
   * @param {number} deltaTime - Frame delta
   */
  updateFilament(deltaTime) {
    this.filamentProgress = clamp(
      this.phaseElapsed / SCENE003.filamentFadeInDuration, 0, 1
    );
    this.connectionState.data.progress = this.filamentProgress;
    this.connectionState.data.lineOpacity = this.filamentProgress * SCENE003.filamentMaxOpacity;
    this.connectionState.data.lineWidth = this.filamentProgress * SCENE003.filamentMaxWidth;

    if (this.filamentProgress >= 1) {
      this.emitEvent(CONNECTION_EVENTS.PULSE_STARTED);
      this.pulseProgress = 0;
      this.transitionPhase(PHASE_PULSE);
    }
  }

  /**
   * Pulse phase: single pulse travels from A to B.
   * @param {number} deltaTime - Frame delta
   */
  updatePulse(deltaTime) {
    this.pulseProgress = clamp(this.phaseElapsed / SCENE003.pulseDuration, 0, 1);
    this.connectionState.data.pulseProgress = this.pulseProgress;

    if (this.pulseProgress >= 1) {
      this.pulseProgress = -1;
      this.emitEvent(CONNECTION_EVENTS.PULSE_FINISHED);
      this.transitionPhase(PHASE_COMPLETE);
    }
  }

  /**
   * Render the connection visuals (filament and pulse).
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} deltaTime - Frame delta time for breathing
   */
  render(ctx, deltaTime) {
    if (this.phase === PHASE_IDLE || this.phase === PHASE_DISCOVERY) return;
    if (this.phase === PHASE_APPROACH || this.phase === PHASE_PAUSE) return;
    if (!this.particleA || !this.particleB) return;

    const reducedMotion = this.getReducedMotion();

    // Render the filament
    if (this.filamentProgress > 0) {
      this.renderer.render(
        ctx, this.particleA, this.particleB,
        this.filamentProgress, reducedMotion, deltaTime || 0.016
      );
    }

    // Render the pulse
    if (this.pulseProgress >= 0 && this.pulseProgress <= 1) {
      this.pulseRenderer.render(
        ctx, this.particleA, this.particleB,
        this.pulseProgress, reducedMotion
      );
    }
  }

  /**
   * Get the current connection state string.
   * @returns {string} Current state from CONNECTION_STATES
   */
  getConnectionState() {
    return this.connectionState.getState();
  }

  /**
   * Get the two connected particle references.
   * @returns {{particleA: Object|null, particleB: Object|null, indexA: number, indexB: number}}
   */
  getConnectedParticles() {
    return {
      particleA: this.particleA,
      particleB: this.particleB,
      indexA: this.indexA,
      indexB: this.indexB
    };
  }

  /**
   * Transition to a new lifecycle phase and reset phase timer.
   * @param {string} newPhase - Target phase
   */
  transitionPhase(newPhase) {
    this.phase = newPhase;
    this.phaseElapsed = 0;
  }

  /**
   * Register an event listener for connection lifecycle events.
   * @param {string} eventName - Event name from CONNECTION_EVENTS
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  /**
   * Emit an event to all registered listeners.
   * @param {string} eventName - Event name to emit
   */
  emitEvent(eventName) {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](this.connectionState.data);
    }
  }

  /**
   * Check if reduced motion is preferred.
   * @returns {boolean}
   */
  getReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Destroy the connection manager and release all resources.
   */
  destroy() {
    this.renderer.destroy();
    this.pulseRenderer.destroy();
    this.connectionState.destroy();
    this.eventListeners.clear();
    this.universe = null;
    this.particleA = null;
    this.particleB = null;
    this.phase = PHASE_IDLE;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
