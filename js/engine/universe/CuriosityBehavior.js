/**
 * CuriosityBehavior
 * A behavior module compatible with BehaviorSystem's apply() interface.
 * Activates only when a particle is within an influence region.
 * When active: reduces wander/drift contribution by applying a gentle
 * noise-driven searching vector. Particles become curious but do NOT connect.
 *
 * States: idle (outside influence), searching (inside, gentle seeking),
 * attracted (near another particle, no connection).
 *
 * Zero per-frame allocations. Pre-allocated noise instance.
 */

import { CURIOSITY_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';

const CONFIG = settings.scene004.curiosity;

export class CuriosityBehavior {
  constructor() {
    this.noise = new Noise(CONFIG.seed);
    this.searchStrength = CONFIG.searchStrength;
    this.noiseScale = CONFIG.noiseScale;
    this.noiseSpeed = CONFIG.noiseSpeed;
    this.activationThreshold = CONFIG.activationThreshold;
    this.deactivationRadiusSq = CONFIG.deactivationRadius * CONFIG.deactivationRadius;
    this.enabled = false;
  }

  /**
   * Enable the curiosity behavior (called by scene phases).
   */
  activate() {
    this.enabled = true;
  }

  /**
   * Disable the curiosity behavior.
   */
  deactivate() {
    this.enabled = false;
  }

  /**
   * Apply curiosity force to a particle.
   * Compatible with BehaviorSystem: apply(particle, dt, elapsed, ctx)
   *
   * ctx must contain:
   *   - influenceEngine: InfluenceEngine instance for region queries
   *
   * @param {Object} particle - Particle from pool
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   * @param {Object} ctx - Context with influenceEngine reference
   */
  apply(particle, deltaTime, elapsedTime, ctx) {
    if (!this.enabled) return;
    if (!ctx || !ctx.influenceEngine) return;

    const influence = ctx.influenceEngine.getInfluenceAt(particle.x, particle.y);

    // Only activate inside influence regions above threshold
    if (influence.strength < this.activationThreshold) return;

    // Scale searching force by influence strength (gentle, probability-based)
    const influenceFactor = influence.strength;

    // Noise-driven searching: organic orbiting motion
    const nx = particle.x * this.noiseScale;
    const ny = particle.y * this.noiseScale;
    const nt = elapsedTime * this.noiseSpeed;

    // Use separate noise channels for x/y to avoid correlation
    const seekX = this.noise.noise3D(nx, ny, nt + 50);
    const seekY = this.noise.noise3D(nx + 200, ny + 200, nt + 50);

    // Apply gentle searching vector, scaled by influence
    const force = this.searchStrength * influenceFactor;
    particle.ax += seekX * force;
    particle.ay += seekY * force;

    // Gentle dampening within influence - reduces wander/drift indirectly
    const dampen = 1 - (influenceFactor * 0.02);
    particle.vx *= dampen;
    particle.vy *= dampen;
  }

  /**
   * Destroy and release resources.
   */
  destroy() {
    this.noise = null;
    this.enabled = false;
  }
}
