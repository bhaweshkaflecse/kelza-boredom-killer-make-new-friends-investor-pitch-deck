/**
 * EnergyPulseSystem
 * Manages invisible energy pulses that travel through the particle field.
 * Pulses expand outward and subtly influence particle motion.
 * Object-pooled for zero allocation during runtime. No visual output.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';

const SCENE002 = settings.scene002;
const PULSE_CONFIG = SCENE002.pulses;

export class EnergyPulseSystem {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = null;
    this.maxConcurrent = PULSE_CONFIG.maxConcurrent;
    this.spawnInterval = PULSE_CONFIG.spawnInterval;
    this.spawnVariation = PULSE_CONFIG.spawnVariation;
    this.baseStrength = PULSE_CONFIG.strength;
    this.speed = PULSE_CONFIG.speed;
    this.maxRadius = PULSE_CONFIG.maxRadius;
    this.decayRate = PULSE_CONFIG.decayRate;

    /** @type {{x: number, y: number, radius: number, strength: number, active: boolean}[]} */
    this.pool = [];
    this.activeCount = 0;
    this.spawnTimer = 0;
    this.nextSpawnTime = 0;

    this.fieldWidth = 0;
    this.fieldHeight = 0;
  }

  /**
   * Initialize the energy pulse system.
   * @param {number} width - Field width
   * @param {number} height - Field height
   */
  init(width, height) {
    this.noise = new Noise(PULSE_CONFIG.seed);
    this.fieldWidth = width;
    this.fieldHeight = height;
    this.allocatePool();
    this.nextSpawnTime = this.computeNextSpawnTime(0);
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Pre-allocate the pulse object pool.
   */
  allocatePool() {
    this.pool = new Array(this.maxConcurrent);
    for (let i = 0; i < this.maxConcurrent; i++) {
      this.pool[i] = {
        x: 0,
        y: 0,
        radius: 0,
        strength: 0,
        active: false
      };
    }
    this.activeCount = 0;
  }

  /**
   * Compute the next noise-driven spawn time.
   * @param {number} elapsedTime - Current elapsed time
   * @returns {number} Next spawn time in seconds
   */
  computeNextSpawnTime(elapsedTime) {
    const n = this.noise.noise2D(elapsedTime * 0.1, 50);
    const variation = (n + 1) * 0.5 * this.spawnVariation;
    return elapsedTime + this.spawnInterval + variation;
  }

  /**
   * Update all active pulses and handle spawning.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.updateActivePulses(deltaTime);
    this.checkSpawn(elapsedTime);
  }

  /**
   * Expand and decay all active pulses.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateActivePulses(deltaTime) {
    this.activeCount = 0;

    for (let i = 0; i < this.maxConcurrent; i++) {
      const pulse = this.pool[i];
      if (!pulse.active) continue;

      pulse.radius += this.speed * deltaTime;
      pulse.strength *= this.decayRate;

      if (pulse.radius >= this.maxRadius || pulse.strength < 0.0001) {
        pulse.active = false;
      } else {
        this.activeCount++;
      }
    }
  }

  /**
   * Check if a new pulse should spawn.
   * @param {number} elapsedTime - Elapsed time
   */
  checkSpawn(elapsedTime) {
    if (elapsedTime < this.nextSpawnTime) return;
    if (this.activeCount >= this.maxConcurrent) {
      this.nextSpawnTime = this.computeNextSpawnTime(elapsedTime);
      return;
    }

    // Use seeded noise for deterministic spawn positions
    const nx = (this.noise.noise2D(elapsedTime * 0.37, 100) + 1) * 0.5;
    const ny = (this.noise.noise2D(200, elapsedTime * 0.41) + 1) * 0.5;
    this.spawn(
      nx * this.fieldWidth,
      ny * this.fieldHeight
    );
    this.nextSpawnTime = this.computeNextSpawnTime(elapsedTime);
  }

  /**
   * Spawn a new energy pulse at the given position.
   * @param {number} x - Origin X
   * @param {number} y - Origin Y
   */
  spawn(x, y) {
    for (let i = 0; i < this.maxConcurrent; i++) {
      const pulse = this.pool[i];
      if (pulse.active) continue;

      pulse.x = x;
      pulse.y = y;
      pulse.radius = 1;
      pulse.strength = this.baseStrength;
      pulse.active = true;
      this.activeCount++;
      return;
    }
  }

  /**
   * Apply pulse forces to a particle. Call for each active particle.
   * @param {Object} particle - Particle from pool
   */
  applyToParticle(particle) {
    for (let i = 0; i < this.maxConcurrent; i++) {
      const pulse = this.pool[i];
      if (!pulse.active) continue;

      const dx = particle.x - pulse.x;
      const dy = particle.y - pulse.y;
      const distSq = dx * dx + dy * dy;
      const rSq = pulse.radius * pulse.radius;

      const innerSq = (pulse.radius - 20) * (pulse.radius - 20);
      if (distSq > rSq || distSq < innerSq) continue;

      const dist = Math.sqrt(distSq);
      if (dist < 1) continue;

      const invDist = 1 / dist;
      particle.ax += dx * invDist * pulse.strength;
      particle.ay += dy * invDist * pulse.strength;
    }
  }

  /**
   * Resize the field dimensions.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.fieldWidth = width;
    this.fieldHeight = height;
  }

  /**
   * Destroy the energy pulse system and release resources.
   */
  destroy() {
    this.pool = [];
    this.activeCount = 0;
    this.noise = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
