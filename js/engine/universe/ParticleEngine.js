/**
 * ParticleEngine
 * High-performance particle system with object pooling.
 * Supports position, velocity, acceleration, opacity, scale, rotation,
 * lifetime, mass, color, depth. Zero allocations in the update loop.
 */

import { MANAGER_STATES, PARTICLE_LIMITS } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { randomRange } from '../../utils/helpers.js';

const REDUCED_MOTION_UPDATE_DIVISOR = 3;
const OPACITY_BUCKET_COUNT = 10;

export class ParticleEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.pool = [];
    this.activeCount = 0;
    this.maxCount = 0;
    this.targetCount = 0;
    this.width = 0;
    this.height = 0;
    this.reducedMotion = false;
    this.frameCounter = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.cursorInfluence = 0;

    this.alphaMin = settings.universe.particles.alphaMin;
    this.alphaMax = settings.universe.particles.alphaMax;
    this.sizeMin = settings.universe.particles.sizeMin;
    this.sizeMax = settings.universe.particles.sizeMax;
    this.speedMin = settings.universe.particles.speedMin;
    this.speedMax = settings.universe.particles.speedMax;
    this.lifetimeMin = settings.universe.particles.lifetimeMin;
    this.lifetimeMax = settings.universe.particles.lifetimeMax;
    this.depthLayers = settings.universe.particles.depthLayers;
    this.fadeInDuration = settings.universe.particles.fadeInDuration;
    this.fadeOutStart = settings.universe.particles.fadeOutStart;
  }

  /**
   * Initialize the particle engine and allocate the pool.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {string} deviceTier - Device performance tier
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(width, height, deviceTier, reducedMotion = false) {
    this.width = width;
    this.height = height;
    this.reducedMotion = reducedMotion;
    this.maxCount = this.getMaxForTier(deviceTier);
    this.targetCount = Math.floor(this.maxCount * settings.universe.particles.initialDensity);

    this.allocatePool();
    this.spawnInitialParticles();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Get maximum particle count for a device tier.
   * @param {string} tier - Device tier identifier
   * @returns {number} Maximum particle count
   */
  getMaxForTier(tier) {
    return PARTICLE_LIMITS[tier] || PARTICLE_LIMITS.medium;
  }

  /**
   * Allocate the particle object pool (pre-allocation, no GC pressure).
   */
  allocatePool() {
    this.pool = new Array(this.maxCount);
    for (let i = 0; i < this.maxCount; i++) {
      this.pool[i] = this.createParticle();
    }
    this.activeCount = 0;
  }

  /**
   * Create a single particle object with all properties.
   * @returns {Object} Particle data object
   */
  createParticle() {
    return {
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      ax: 0, ay: 0, az: 0,
      opacity: 0,
      scale: 1,
      rotation: 0,
      lifetime: 0,
      maxLifetime: 0,
      mass: 1,
      r: 255, g: 255, b: 255,
      depth: 0,
      active: false
    };
  }

  /**
   * Spawn initial particles to fill the target count.
   */
  spawnInitialParticles() {
    for (let i = 0; i < this.targetCount; i++) {
      this.activateParticle(i, true);
    }
    this.activeCount = this.targetCount;
  }

  /**
   * Activate a particle at the given pool index with randomized properties.
   * @param {number} index - Pool index
   * @param {boolean} [scattered=false] - If true, randomize lifetime progress
   */
  activateParticle(index, scattered = false) {
    const p = this.pool[index];
    p.x = randomRange(0, this.width);
    p.y = randomRange(0, this.height);
    p.z = randomRange(0, this.depthLayers);
    p.vx = randomRange(this.speedMin, this.speedMax);
    p.vy = randomRange(this.speedMin, this.speedMax);
    p.vz = 0;
    p.ax = 0;
    p.ay = 0;
    p.az = 0;
    p.scale = randomRange(this.sizeMin, this.sizeMax);
    p.rotation = randomRange(0, Math.PI * 2);
    p.mass = p.scale;
    p.r = 255;
    p.g = 255;
    p.b = 255;
    p.depth = Math.floor(p.z);
    p.maxLifetime = randomRange(this.lifetimeMin, this.lifetimeMax);
    p.lifetime = scattered ? randomRange(0, p.maxLifetime) : 0;
    p.opacity = scattered
      ? randomRange(this.alphaMin, this.alphaMax)
      : 0;
    p.active = true;
  }

  /**
   * Reset a dead particle back to active state at a random edge.
   * @param {number} index - Pool index of the particle to respawn
   */
  respawnParticle(index) {
    this.activateParticle(index, false);
  }

  /**
   * Update all active particles. Zero allocations.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.frameCounter++;

    if (this.reducedMotion && this.frameCounter % REDUCED_MOTION_UPDATE_DIVISOR !== 0) {
      return;
    }

    for (let i = 0; i < this.activeCount; i++) {
      this.updateParticle(i, deltaTime);
    }
  }

  /**
   * Update a single particle by index.
   * @param {number} index - Pool index
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateParticle(index, deltaTime) {
    const p = this.pool[index];
    if (!p.active) return;

    p.lifetime += deltaTime;

    if (p.lifetime >= p.maxLifetime) {
      this.respawnParticle(index);
      return;
    }

    p.vx += p.ax * deltaTime;
    p.vy += p.ay * deltaTime;
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;

    const lifeRatio = p.lifetime / p.maxLifetime;
    p.opacity = this.calculateOpacity(lifeRatio);

    this.wrapBounds(p);
  }

  /**
   * Calculate opacity based on particle life ratio (fade in/out).
   * @param {number} lifeRatio - Progress through lifetime (0 to 1)
   * @returns {number} Opacity value
   */
  calculateOpacity(lifeRatio) {
    if (lifeRatio < this.fadeInDuration) {
      return (lifeRatio / this.fadeInDuration) * this.alphaMax;
    }
    if (lifeRatio > this.fadeOutStart) {
      const fadeProgress = (lifeRatio - this.fadeOutStart) / (1 - this.fadeOutStart);
      return this.alphaMax * (1 - fadeProgress);
    }
    return this.alphaMax;
  }

  /**
   * Wrap particle position around canvas boundaries.
   * @param {Object} p - Particle object
   */
  wrapBounds(p) {
    if (p.x < 0) p.x = this.width;
    if (p.x > this.width) p.x = 0;
    if (p.y < 0) p.y = this.height;
    if (p.y > this.height) p.y = 0;
  }

  /**
   * Render all active particles to the canvas using batched draw calls.
   * Groups particles by opacity bucket for efficient path batching.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    ctx.fillStyle = 'rgb(255, 255, 255)';

    for (let bucket = 1; bucket <= OPACITY_BUCKET_COUNT; bucket++) {
      this.renderOpacityBucket(ctx, bucket);
    }
  }

  /**
   * Render a batch of particles sharing the same opacity bucket.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} bucket - Opacity bucket index (1 to OPACITY_BUCKET_COUNT)
   */
  renderOpacityBucket(ctx, bucket) {
    const bucketMin = (bucket - 1) / OPACITY_BUCKET_COUNT;
    const bucketMax = bucket / OPACITY_BUCKET_COUNT;
    const bucketAlpha = (bucketMin + bucketMax) * 0.5;

    let hasParticles = false;
    ctx.beginPath();

    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i];
      if (!p.active || p.opacity <= 0) continue;

      const normalizedOpacity = p.opacity / this.alphaMax;
      if (normalizedOpacity <= bucketMin || normalizedOpacity > bucketMax) continue;

      const depthScale = 1 - (p.depth / this.depthLayers) * 0.6;
      const size = p.scale * depthScale;

      ctx.moveTo(p.x + size, p.y);
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      hasParticles = true;
    }

    if (hasParticles) {
      ctx.globalAlpha = bucketAlpha;
      ctx.fill();
    }
  }

  /**
   * Set cursor position for future attraction behavior.
   * @param {number} x - Cursor X position
   * @param {number} y - Cursor Y position
   */
  setCursorPosition(x, y) {
    this.cursorX = x;
    this.cursorY = y;
  }

  /**
   * Set cursor influence strength (0 = none, 1 = full).
   * @param {number} strength - Influence strength
   */
  setCursorInfluence(strength) {
    this.cursorInfluence = strength;
  }

  /**
   * Reduce active particle count for performance adaptation.
   * @param {number} factor - Reduction factor (0 to 1, where 1 = full count)
   */
  setDensity(factor) {
    const clamped = Math.max(0.1, Math.min(1, factor));
    this.targetCount = Math.floor(this.maxCount * clamped);
    this.activeCount = Math.min(this.activeCount, this.targetCount);
  }

  /**
   * Handle canvas resize.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Set reduced motion preference.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
  }

  /**
   * Destroy the particle engine and release the pool.
   */
  destroy() {
    this.pool = [];
    this.activeCount = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
