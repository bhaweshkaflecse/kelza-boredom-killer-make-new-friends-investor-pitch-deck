/**
 * TimeEngine
 * Unified clock source for the entire Kelza experience.
 * All subsystems (particles, lighting, shaders, globe, phone, AI)
 * synchronize from this single timeline. No independent timers.
 */

import { MANAGER_STATES } from '../../config/constants.js';

const DEFAULT_SPEED = 1;
const MIN_SPEED = 0;
const MAX_SPEED = 10;

export class TimeEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.elapsedTime = 0;
    this.deltaTime = 0;
    this.speed = DEFAULT_SPEED;
    this.isPaused = false;
    this.startTime = 0;
    this.frameCount = 0;
  }

  /**
   * Initialize the time engine.
   */
  init() {
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Update the clock with the frame delta.
   * @param {number} deltaTime - Raw delta time in seconds from the RAF loop
   */
  update(deltaTime) {
    if (this.isPaused) {
      this.deltaTime = 0;
      return;
    }

    this.deltaTime = deltaTime * this.speed;
    this.elapsedTime += this.deltaTime;
    this.frameCount++;
  }

  /**
   * Get the total elapsed time in seconds (scaled by speed).
   * @returns {number} Elapsed time in seconds
   */
  getTime() {
    return this.elapsedTime;
  }

  /**
   * Get the current frame delta time in seconds (scaled by speed).
   * @returns {number} Delta time in seconds
   */
  getDelta() {
    return this.deltaTime;
  }

  /**
   * Get the current frame count.
   * @returns {number} Total frames elapsed
   */
  getFrameCount() {
    return this.frameCount;
  }

  /**
   * Set the time speed multiplier.
   * @param {number} multiplier - Speed multiplier (0 to 10)
   */
  setSpeed(multiplier) {
    this.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, multiplier));
  }

  /**
   * Get the current speed multiplier.
   * @returns {number} Current speed
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * Pause the clock. Delta will be zero while paused.
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume the clock after pause.
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Reset the clock to zero.
   */
  reset() {
    this.elapsedTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.startTime = performance.now();
  }

  /**
   * Destroy the time engine and release resources.
   */
  destroy() {
    this.isPaused = true;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
