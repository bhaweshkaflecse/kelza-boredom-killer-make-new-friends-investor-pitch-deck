/**
 * JourneyController
 * Lightweight cinematic journey controller. Drives intentional camera
 * progression along a single path from start to destination.
 * NOT a generic navigation system. Exists only for cinematic journeys.
 *
 * Uses smoothstep easing (t*t*(3-2*t)) for continuous, invisible movement.
 * Extremely slow base speed (~0.0003 units per second).
 * Zero per-frame allocations.
 */

const STATE_IDLE = 'idle';
const STATE_ACTIVE = 'active';
const STATE_APPROACHING = 'approaching';
const STATE_COMPLETE = 'complete';

export class JourneyController {
  constructor() {
    this.state = STATE_IDLE;
    this.startX = 0;
    this.startY = 0;
    this.destX = 0;
    this.destY = 0;
    this.progress = 0;
    this.speed = 0.0003;
    this.easeInDuration = 5;
    this.easeOutDuration = 4;
    this.reducedMotionFactor = 0.3;
    this.reducedMotion = false;
    this.elapsedTime = 0;
    this.totalDistance = 0;
    this._targetPosition = { x: 0, y: 0 };
  }

  /**
   * Initialize the journey with start and destination.
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} destX - Destination X coordinate
   * @param {number} destY - Destination Y coordinate
   * @param {Object} config - Journey configuration
   */
  init(startX, startY, destX, destY, config) {
    this.startX = startX;
    this.startY = startY;
    this.destX = destX;
    this.destY = destY;
    this.progress = 0;
    this.elapsedTime = 0;
    this.speed = config.speed || 0.0003;
    this.easeInDuration = config.easeInDuration || 5;
    this.easeOutDuration = config.easeOutDuration || 4;
    this.reducedMotionFactor = config.reducedMotionFactor || 0.3;
    this._targetPosition.x = startX;
    this._targetPosition.y = startY;
    this.state = STATE_ACTIVE;

    const dx = destX - startX;
    const dy = destY - startY;
    this.totalDistance = Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Update journey progression each frame.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state === STATE_COMPLETE || this.state === STATE_IDLE) return;

    this.elapsedTime += deltaTime;
    this.advanceProgress(deltaTime);
    this.computeTarget();
    this.evaluateState();
  }

  /**
   * Advance progress using eased speed factor.
   * @param {number} deltaTime - Frame delta in seconds
   */
  advanceProgress(deltaTime) {
    let speedFactor = this.computeSpeedFactor();
    if (this.reducedMotion) {
      speedFactor *= this.reducedMotionFactor;
    }

    this.progress += this.speed * speedFactor * deltaTime;
    if (this.progress > 1) this.progress = 1;
  }

  /**
   * Compute speed factor using ease-in and ease-out.
   * @returns {number} Speed multiplier 0-1
   */
  computeSpeedFactor() {
    // Ease-in at start
    if (this.elapsedTime < this.easeInDuration) {
      const t = this.elapsedTime / this.easeInDuration;
      return this.smoothstep(t);
    }

    // Ease-out near end (based on remaining progress)
    const remaining = 1 - this.progress;
    const easeOutThreshold = 0.15;
    if (remaining < easeOutThreshold) {
      const t = remaining / easeOutThreshold;
      return this.smoothstep(t);
    }

    return 1;
  }

  /**
   * Smoothstep easing function: t*t*(3-2*t).
   * @param {number} t - Input value 0-1
   * @returns {number} Eased value 0-1
   */
  smoothstep(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  }

  /**
   * Compute the current target position based on progress.
   * Mutates the pre-allocated _targetPosition object.
   */
  computeTarget() {
    const eased = this.smoothstep(this.progress);
    this._targetPosition.x = this.startX + (this.destX - this.startX) * eased;
    this._targetPosition.y = this.startY + (this.destY - this.startY) * eased;
  }

  /**
   * Evaluate current journey state based on progress.
   */
  evaluateState() {
    if (this.progress >= 1) {
      this.state = STATE_COMPLETE;
    } else if (this.progress > 0.85) {
      this.state = STATE_APPROACHING;
    }
  }

  /**
   * Get current journey progress (0 to 1).
   * @returns {number} Progress value
   */
  getJourneyProgress() {
    return this.progress;
  }

  /**
   * Get the current target position. Returns pre-allocated object.
   * Do not store this reference - it is mutated in place.
   * @returns {{x: number, y: number}} Target position
   */
  getTargetPosition() {
    return this._targetPosition;
  }

  /**
   * Check if the journey is complete.
   * @returns {boolean} True if progress >= 1
   */
  isComplete() {
    return this.state === STATE_COMPLETE;
  }

  /**
   * Enable or disable reduced motion mode.
   * @param {boolean} enabled - Reduce speed by ~70%
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
  }

  /**
   * Get the current state string.
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Reset the controller to idle state.
   */
  reset() {
    this.state = STATE_IDLE;
    this.progress = 0;
    this.elapsedTime = 0;
    this._targetPosition.x = 0;
    this._targetPosition.y = 0;
  }

  /**
   * Destroy and release all state.
   */
  destroy() {
    this.state = STATE_IDLE;
    this.progress = 0;
    this.elapsedTime = 0;
    this.totalDistance = 0;
  }
}
