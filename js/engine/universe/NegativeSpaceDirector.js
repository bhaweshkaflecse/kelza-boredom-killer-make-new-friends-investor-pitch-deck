/**
 * NegativeSpaceDirector
 * Intentionally preserves empty regions (voids) in the particle field.
 * Negative space is as important as particles. Voids evolve slowly via noise,
 * and future scenes (Earth, communities, marketplace) build on them.
 *
 * Max 5 voids. Noise-driven placement that breathes organically.
 * Zero per-frame allocations. Pre-allocated void pool and result object.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { clamp } from '../../utils/helpers.js';

const CONFIG = settings.scene006.negativeSpace;
const MAX_VOIDS = CONFIG.maxVoids;
const PRESERVATION_STRENGTH = CONFIG.preservationStrength;
const MIN_VOID_RADIUS = CONFIG.minVoidRadius;
const IMPORTANCE_WEIGHT = CONFIG.importanceWeight;

/**
 * Create a pre-allocated void object.
 * @returns {Object} Void state
 */
function createVoid() {
  return {
    centerX: 0,
    centerY: 0,
    radius: 0,
    strength: 0,
    noiseOffsetX: 0,
    noiseOffsetY: 0,
    importance: 0,
    active: false
  };
}

export class NegativeSpaceDirector {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;

    /** @type {Object[]} Pre-allocated void pool */
    this.voids = [];
    this.activeVoidCount = 0;

    // Noise for organic void evolution
    this.noise = null;
    this.noiseTime = 0;

    // Dimensions
    this.width = 0;
    this.height = 0;

    // Pre-allocated result object for getRepulsionAt
    this._result = { strength: 0, directionX: 0, directionY: 0 };
  }

  /**
   * Initialize the negative space director.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Noise seed
   */
  init(width, height, seed) {
    this.width = width;
    this.height = height;
    this.noise = new Noise(seed);
    this.noiseTime = 0;
    this.activeVoidCount = 0;

    // Pre-allocate void pool
    this.voids.length = 0;
    for (let i = 0; i < MAX_VOIDS; i++) {
      this.voids.push(createVoid());
    }

    // Place initial voids using noise
    this.placeVoids();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Place voids at noise-driven positions, well-distributed across canvas.
   */
  placeVoids() {
    const marginX = this.width * 0.1;
    const marginY = this.height * 0.1;
    const innerW = this.width - marginX * 2;
    const innerH = this.height - marginY * 2;

    for (let i = 0; i < MAX_VOIDS; i++) {
      const v = this.voids[i];

      // Noise-based placement for organic distribution
      const nx = this.noise.noise2D(i * 9.7, 50) * 0.5 + 0.5;
      const ny = this.noise.noise2D(i * 13.3, 150) * 0.5 + 0.5;

      v.centerX = marginX + nx * innerW;
      v.centerY = marginY + ny * innerH;
      v.radius = MIN_VOID_RADIUS
        + Math.abs(this.noise.noise2D(i * 5.9, 250)) * 60;
      v.noiseOffsetX = i * 19.3;
      v.noiseOffsetY = i * 23.7;
      v.strength = PRESERVATION_STRENGTH;
      v.importance = 0.5
        + Math.abs(this.noise.noise2D(i * 7.1, 350)) * 0.5;
      v.active = true;
    }
    this.activeVoidCount = MAX_VOIDS;
  }

  /**
   * Update void positions and strengths.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {Object[]} particles - Particle pool (unused - voids are data-only)
   * @param {number} activeCount - Active particle count
   * @param {number} recognitionConfidence - Current confidence (0 to ~0.35)
   */
  update(deltaTime, particles, activeCount, recognitionConfidence) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.noiseTime += deltaTime;
    this.updateVoidBreathing(deltaTime);
    this.updateVoidStrengths(recognitionConfidence);
  }

  /**
   * Apply slow noise-driven breathing to void positions and radii.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateVoidBreathing(deltaTime) {
    const breathSpeed = 0.015;
    const positionDrift = 0.2;

    for (let i = 0; i < MAX_VOIDS; i++) {
      const v = this.voids[i];
      if (!v.active) continue;

      const t = this.noiseTime * breathSpeed;

      // Gentle position drift
      v.centerX += this.noise.noise2D(
        v.noiseOffsetX + t, v.noiseOffsetY
      ) * positionDrift * deltaTime;

      v.centerY += this.noise.noise2D(
        v.noiseOffsetX, v.noiseOffsetY + t
      ) * positionDrift * deltaTime;

      // Radius breathing
      const radiusMod = this.noise.noise2D(
        v.noiseOffsetX + t * 0.5, v.noiseOffsetY + 500
      );
      v.radius = MIN_VOID_RADIUS + Math.abs(radiusMod) * 60;
    }
  }

  /**
   * Adjust void strengths based on recognition confidence.
   * Voids become slightly more defined as recognition grows.
   * @param {number} confidence - Recognition confidence
   */
  updateVoidStrengths(confidence) {
    // As confidence grows, voids become more intentional
    const strengthMod = 1 + confidence * IMPORTANCE_WEIGHT;

    for (let i = 0; i < MAX_VOIDS; i++) {
      const v = this.voids[i];
      if (!v.active) continue;

      v.strength = clamp(
        PRESERVATION_STRENGTH * strengthMod * v.importance,
        0, 1
      );
    }
  }

  /**
   * Get the repulsion force at a world position. Returns pre-allocated result.
   * Particles near voids are gently pushed outward.
   * @param {number} x - Query X
   * @param {number} y - Query Y
   * @returns {{strength: number, directionX: number, directionY: number}}
   */
  getRepulsionAt(x, y) {
    this._result.strength = 0;
    this._result.directionX = 0;
    this._result.directionY = 0;

    let maxStr = 0;
    let bestDx = 0;
    let bestDy = 0;

    for (let i = 0; i < MAX_VOIDS; i++) {
      const v = this.voids[i];
      if (!v.active) continue;

      const dx = x - v.centerX;
      const dy = y - v.centerY;
      const distSq = dx * dx + dy * dy;
      const radiusSq = v.radius * v.radius;

      if (distSq >= radiusSq) continue;
      if (distSq < 1) continue; // Avoid division by zero

      const dist = Math.sqrt(distSq);
      const invDist = 1 / dist;

      // Strength falls off from center (strongest at center)
      const t = 1 - (dist / v.radius);
      const str = v.strength * t * t;

      if (str > maxStr) {
        maxStr = str;
        // Direction points outward from void center
        bestDx = dx * invDist;
        bestDy = dy * invDist;
      }
    }

    this._result.strength = maxStr;
    this._result.directionX = bestDx;
    this._result.directionY = bestDy;
    return this._result;
  }

  /**
   * Get the number of active voids.
   * @returns {number}
   */
  getVoidCount() {
    return this.activeVoidCount;
  }

  /**
   * Check if a position is inside any void.
   * @param {number} x - Query X
   * @param {number} y - Query Y
   * @returns {boolean} True if inside a void
   */
  isInVoid(x, y) {
    for (let i = 0; i < MAX_VOIDS; i++) {
      const v = this.voids[i];
      if (!v.active) continue;

      const dx = x - v.centerX;
      const dy = y - v.centerY;
      if (dx * dx + dy * dy < v.radius * v.radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Handle canvas resize and scale void positions.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    this.width = width;
    this.height = height;

    for (let i = 0; i < MAX_VOIDS; i++) {
      const v = this.voids[i];
      v.centerX *= scaleX;
      v.centerY *= scaleY;
    }
  }

  /**
   * Destroy the director and release all resources.
   */
  destroy() {
    this.voids.length = 0;
    this.activeVoidCount = 0;
    this.noise = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
