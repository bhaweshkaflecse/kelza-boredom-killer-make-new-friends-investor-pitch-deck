/**
 * GravityCenter
 * Establishes a shared center of gravitational influence for the universe.
 * Affects particles with subtle curved (tangential) trajectories.
 * Uses Noise for organic drift of the center position.
 * Pre-allocated, zero per-frame allocations.
 *
 * This is NOT a sphere, globe, or visible object.
 * It is a compositional force that creates rotational coherence.
 */

import { Noise } from '../../utils/Noise.js';
import { settings } from '../../config/settings.js';

const CFG = settings.scene008.gravity;

export class GravityCenter {
  constructor() {
    this.noise = null;
    this.centerX = 0;
    this.centerY = 0;
    this.canvasW = 0;
    this.canvasH = 0;
    this.halfW = 0;
    this.halfH = 0;
    this.elapsedTime = 0;
    this.rotationalCoherence = 0;
    // Pre-allocated direction vector
    this._dx = 0;
    this._dy = 0;
    this._dist = 0;
    this._tangentX = 0;
    this._tangentY = 0;
  }

  /**
   * Initialize the gravity center.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Noise seed
   */
  init(width, height, seed) {
    this.noise = new Noise(seed);
    this.canvasW = width;
    this.canvasH = height;
    this.halfW = width * 0.5;
    this.halfH = height * 0.5;
    this.centerX = this.halfW;
    this.centerY = this.halfH;
    this.elapsedTime = 0;
    this.rotationalCoherence = 0;
  }

  /**
   * Update the gravity center position using noise-driven drift.
   * Also advances rotational coherence over time.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    this.elapsedTime += deltaTime;

    const t = this.elapsedTime * CFG.noiseSpeed;
    const nx = this.noise.noise2D(t, 0) * this.halfW * 0.15;
    const ny = this.noise.noise2D(0, t) * this.halfH * 0.15;

    this.centerX = this.halfW + nx;
    this.centerY = this.halfH + ny;

    // Advance rotational coherence toward maxCoherence
    const target = CFG.maxCoherence;
    this.rotationalCoherence += (target - this.rotationalCoherence) * CFG.coherenceRate;
  }

  /**
   * Apply subtle tangential (perpendicular) force to particles.
   * Creates gently curved trajectories without orbits or spirals.
   * @param {Object[]} pool - Particle pool
   * @param {number} activeCount - Number of active particles
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} strength - Multiplier for force application
   */
  applyToParticles(pool, activeCount, deltaTime, strength) {
    const cx = this.centerX;
    const cy = this.centerY;
    const coherence = this.rotationalCoherence;
    const force = CFG.strength * strength * coherence * deltaTime;

    for (let i = 0; i < activeCount; i++) {
      const p = pool[i];
      if (!p || !p.active) continue;

      this._dx = p.x - cx;
      this._dy = p.y - cy;
      this._dist = Math.sqrt(this._dx * this._dx + this._dy * this._dy);

      if (this._dist < 1) continue;

      // Tangential force (perpendicular to radial direction)
      const invDist = 1 / this._dist;
      this._tangentX = -this._dy * invDist;
      this._tangentY = this._dx * invDist;

      // Apply diminishing force with distance (inverse, not inverse-square)
      const distanceFactor = 200 / (this._dist + 200);
      p.vx += this._tangentX * force * distanceFactor;
      p.vy += this._tangentY * force * distanceFactor;
    }
  }

  /**
   * Get the current center position.
   * @returns {{x: number, y: number}} Center coordinates
   */
  getCenter() {
    return { x: this.centerX, y: this.centerY };
  }

  /**
   * Get the current rotational coherence value (0-1).
   * Used by other systems to gauge gravitational composition strength.
   * @returns {number} Coherence between 0 and maxCoherence
   */
  getRotationalCoherence() {
    return this.rotationalCoherence;
  }

  /**
   * Handle canvas resize.
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    const ratioX = width / (this.canvasW || width);
    const ratioY = height / (this.canvasH || height);
    this.canvasW = width;
    this.canvasH = height;
    this.halfW = width * 0.5;
    this.halfH = height * 0.5;
    this.centerX *= ratioX;
    this.centerY *= ratioY;
  }

  /**
   * Destroy the gravity center and release references.
   */
  destroy() {
    this.noise = null;
    this.rotationalCoherence = 0;
    this.elapsedTime = 0;
  }
}
