/**
 * RipplePropagation
 * Invisible residual wave from the connection pulse. Expands extremely slowly
 * and applies only tiny behavioral influence. No visible circles or shockwaves.
 * Object-pooled with zero per-frame allocations.
 *
 * Distinct from EnergyPulseSystem: much slower, persistent, behavioral only.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const CONFIG = settings.scene004.ripple;
const MAX_RIPPLES = CONFIG.maxRipples;

/**
 * Create a single ripple object (pooled).
 * @returns {Object} Ripple state
 */
function createRipple() {
  return {
    x: 0,
    y: 0,
    radius: 0,
    maxRadius: CONFIG.maxRadius,
    strength: CONFIG.residualStrength,
    speed: CONFIG.speed,
    active: false
  };
}

export class RipplePropagation {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    /** @type {Object[]} Pre-allocated ripple pool */
    this.ripples = [];
    this.rippleCount = 0;
    this.activeCount = 0;

    // Pre-allocated view for getActiveRipples
    this._view = { ripples: null, count: 0 };
  }

  /**
   * Initialize the ripple system with pre-allocated pool.
   */
  init() {
    this.ripples.length = 0;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      this.ripples.push(createRipple());
    }
    this.rippleCount = 0;
    this.activeCount = 0;
    this._view.ripples = this.ripples;
    this._view.count = 0;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Spawn a new ripple at the given position.
   * Triggered once after connection pulse disappears.
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @returns {number} Ripple index or -1 if pool is full
   */
  spawn(x, y) {
    if (this.rippleCount >= MAX_RIPPLES) return -1;

    const ripple = this.ripples[this.rippleCount];
    ripple.x = x;
    ripple.y = y;
    ripple.radius = 0;
    ripple.maxRadius = CONFIG.maxRadius;
    ripple.strength = CONFIG.residualStrength;
    ripple.speed = CONFIG.speed;
    ripple.active = true;
    this.rippleCount++;
    this.activeCount++;
    return this.rippleCount - 1;
  }

  /**
   * Update all active ripples. Expand extremely slowly.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    const decayRate = CONFIG.decayRate;

    for (let i = 0; i < this.rippleCount; i++) {
      const ripple = this.ripples[i];
      if (!ripple.active) continue;

      // Expand very slowly
      ripple.radius += ripple.speed * deltaTime;

      if (ripple.radius >= ripple.maxRadius) {
        ripple.radius = ripple.maxRadius;
        ripple.strength *= decayRate;

        if (ripple.strength < 0.001) {
          ripple.active = false;
          this.activeCount--;
        }
      }
    }
  }

  /**
   * Get the residual behavioral weight at a given squared distance from a ripple.
   * Returns 0-1 falloff value based on how close the point is to the wavefront.
   * @param {number} distSq - Squared distance from ripple center
   * @param {number} rippleIndex - Index into the pool
   * @returns {number} Behavioral influence weight (0-1)
   */
  getInfluenceAtDistance(distSq, rippleIndex) {
    if (rippleIndex < 0 || rippleIndex >= this.rippleCount) return 0;
    const ripple = this.ripples[rippleIndex];
    if (!ripple.active || ripple.radius < 1) return 0;

    const radiusSq = ripple.radius * ripple.radius;
    if (distSq > radiusSq) return 0;

    // Falloff from center outward - strongest near the expanding edge
    const dist = Math.sqrt(distSq);
    const normalized = dist / ripple.radius;
    // Bell-shaped: strongest at ~70% of radius (the wavefront)
    const waveFront = 1 - Math.abs(normalized - 0.7) * 3.33;
    const weight = Math.max(0, waveFront) * ripple.strength;

    return weight;
  }

  /**
   * Get active ripples view. Returns pre-allocated object.
   * @returns {{ripples: Object[], count: number}} Pre-allocated view (do not store)
   */
  getActiveRipples() {
    this._view.count = this.rippleCount;
    return this._view;
  }

  /**
   * Destroy the ripple system and release resources.
   */
  destroy() {
    this.ripples.length = 0;
    this.rippleCount = 0;
    this.activeCount = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
