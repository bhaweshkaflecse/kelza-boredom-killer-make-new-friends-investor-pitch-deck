/**
 * ArrivalDirector
 * Lightweight, arrival-only director. Manages the transition from
 * cosmic scale to intimate scale through spatial compression,
 * environmental quieting, and camera settling.
 *
 * NOT a generic engine. Exists only for the Arrival scene.
 *
 * Responsibilities:
 * - Spatial compression: pull particles toward connection midpoint
 *   (perceptual closeness, not geometric zoom)
 * - Environmental quieting: dampen velocities, reduce drift
 * - Settling: exponential decay of remaining movement toward rest
 *
 * Zero per-frame allocations. All state pre-allocated in constructor.
 */

const STATE_IDLE = 'idle';
const STATE_ACTIVE = 'active';
const STATE_SETTLING = 'settling';
const STATE_COMPLETE = 'complete';

export class ArrivalDirector {
  constructor() {
    this.state = STATE_IDLE;
    this.canvasW = 0;
    this.canvasH = 0;
    this.connectionMidX = 0;
    this.connectionMidY = 0;
    this.compressionFactor = 0;
    this.quietingFactor = 0;
    this.settlingProgress = 0;
    this.elapsedTime = 0;
    this.compressionRate = 0.02;
    this.settlingDuration = 6;
    this.particleDamping = 0.4;
    this.compressionTarget = 0.7;
    this.driftReduction = 0.85;
    this.reducedMotion = false;
    this.reducedMotionFactor = 0.3;
  }

  /**
   * Initialize the arrival director with canvas and connection data.
   * @param {number} canvasW - Canvas width
   * @param {number} canvasH - Canvas height
   * @param {number} connectionMidX - Connection midpoint X
   * @param {number} connectionMidY - Connection midpoint Y
   * @param {Object} config - Arrival configuration from settings
   */
  init(canvasW, canvasH, connectionMidX, connectionMidY, config) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.connectionMidX = connectionMidX;
    this.connectionMidY = connectionMidY;
    this.compressionFactor = 0;
    this.quietingFactor = 0;
    this.settlingProgress = 0;
    this.elapsedTime = 0;
    this.compressionRate = config.compressionRate || 0.02;
    this.settlingDuration = config.settlingDuration || 6;
    this.reducedMotionFactor = config.reducedMotionFactor || 0.3;
    this.state = STATE_ACTIVE;
  }

  /**
   * Set environment configuration values.
   * @param {Object} envConfig - Environment settings
   */
  setEnvironmentConfig(envConfig) {
    this.particleDamping = envConfig.particleDamping || 0.4;
    this.compressionTarget = envConfig.compressionTarget || 0.7;
    this.driftReduction = envConfig.driftReduction || 0.85;
  }

  /**
   * Set reduced motion preference.
   * @param {boolean} enabled - Whether reduced motion is active
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
  }

  /**
   * Update the arrival director each frame.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {Object[]} pool - Particle pool array
   * @param {number} activeCount - Number of active particles
   * @param {Object} cameraController - Camera controller reference
   */
  update(deltaTime, pool, activeCount, cameraController) {
    if (this.state === STATE_IDLE || this.state === STATE_COMPLETE) return;

    this.elapsedTime += deltaTime;
    this.advanceCompression(deltaTime);
    this.advanceQuieting(deltaTime);
    this.advanceSettling(deltaTime);
    this.applySpatialCompression(pool, activeCount, deltaTime);
    this.applyVelocityDamping(pool, activeCount, deltaTime);
    this.applyCameraSettling(cameraController);
  }

  /**
   * Advance spatial compression factor toward target.
   * @param {number} deltaTime - Frame delta in seconds
   */
  advanceCompression(deltaTime) {
    const rate = this.reducedMotion
      ? this.compressionRate * this.reducedMotionFactor
      : this.compressionRate;
    const target = this.compressionTarget;
    this.compressionFactor += (target - this.compressionFactor) * rate * deltaTime;
  }

  /**
   * Advance environmental quieting factor.
   * @param {number} deltaTime - Frame delta in seconds
   */
  advanceQuieting(deltaTime) {
    const target = this.driftReduction;
    this.quietingFactor += (target - this.quietingFactor) * 0.03 * deltaTime;
  }

  /**
   * Advance settling progress as exponential decay.
   * @param {number} deltaTime - Frame delta in seconds
   */
  advanceSettling(deltaTime) {
    if (this.settlingDuration <= 0) {
      this.settlingProgress = 1;
      return;
    }
    const t = this.elapsedTime / this.settlingDuration;
    this.settlingProgress = t >= 1 ? 1 : 1 - Math.exp(-3 * t);
    if (this.settlingProgress >= 0.99) {
      this.state = STATE_SETTLING;
    }
  }

  /**
   * Pull particles slightly toward connection midpoint.
   * Perceptual compression, not geometric zoom.
   * @param {Object[]} pool - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} deltaTime - Frame delta in seconds
   */
  applySpatialCompression(pool, activeCount, deltaTime) {
    if (this.compressionFactor < 0.001) return;
    const strength = this.compressionFactor * 0.005 * deltaTime;
    const midX = this.connectionMidX;
    const midY = this.connectionMidY;
    const limit = Math.min(activeCount, pool.length);

    for (let i = 0; i < limit; i++) {
      const p = pool[i];
      if (!p || p.opacity <= 0) continue;
      const dx = midX - p.x;
      const dy = midY - p.y;
      p.x += dx * strength;
      p.y += dy * strength;
    }
  }

  /**
   * Dampen particle velocities to reduce ambient motion.
   * @param {Object[]} pool - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} deltaTime - Frame delta in seconds
   */
  applyVelocityDamping(pool, activeCount, deltaTime) {
    if (this.quietingFactor < 0.001) return;
    const damping = 1 - this.particleDamping * this.quietingFactor * deltaTime;
    const factor = damping < 0.5 ? 0.5 : damping;
    const limit = Math.min(activeCount, pool.length);

    for (let i = 0; i < limit; i++) {
      const p = pool[i];
      if (!p || p.opacity <= 0) continue;
      p.vx *= factor;
      p.vy *= factor;
    }
  }

  /**
   * Apply camera settling - reduce drift multiplier toward near-zero.
   * @param {Object} cameraController - Camera controller reference
   */
  applyCameraSettling(cameraController) {
    if (!cameraController || !cameraController.setDriftMultiplier) return;
    if (this.reducedMotion) return;
    const startDrift = 0.03;
    const endDrift = 0.01;
    const drift = startDrift + (endDrift - startDrift) * this.settlingProgress;
    cameraController.setDriftMultiplier(drift);
  }

  /**
   * Get current compression factor (0 to compressionTarget).
   * @returns {number} Compression factor
   */
  getCompressionFactor() {
    return this.compressionFactor;
  }

  /**
   * Get current quieting factor (0 to driftReduction).
   * @returns {number} Quieting factor
   */
  getQuietingFactor() {
    return this.quietingFactor;
  }

  /**
   * Get settling progress (0 to 1).
   * @returns {number} Settling progress
   */
  getSettlingProgress() {
    return this.settlingProgress;
  }

  /**
   * Check if director has completed settling.
   * @returns {boolean} True if settling is complete
   */
  isSettled() {
    return this.state === STATE_SETTLING || this.state === STATE_COMPLETE;
  }

  /**
   * Mark director as complete.
   */
  complete() {
    this.state = STATE_COMPLETE;
  }

  /**
   * Reset to idle state.
   */
  reset() {
    this.state = STATE_IDLE;
    this.compressionFactor = 0;
    this.quietingFactor = 0;
    this.settlingProgress = 0;
    this.elapsedTime = 0;
  }

  /**
   * Destroy and release all state.
   */
  destroy() {
    this.state = STATE_IDLE;
    this.compressionFactor = 0;
    this.quietingFactor = 0;
    this.settlingProgress = 0;
    this.elapsedTime = 0;
  }
}
