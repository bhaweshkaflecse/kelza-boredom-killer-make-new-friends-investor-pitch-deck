/**
 * ParticleEngine
 * High-performance particle system with object pooling and family support.
 * Supports multiple particle families with independent configurations.
 * Zero allocations in the update/render loop.
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
    this.families = [];
    this.familySlots = [];
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
    this.maxCount = PARTICLE_LIMITS[deviceTier] || PARTICLE_LIMITS.medium;
    this.targetCount = Math.floor(this.maxCount * settings.universe.particles.initialDensity);
    this.allocatePool();
    this.spawnInitialParticles();
    this.state = MANAGER_STATES.READY;
  }

  /** Allocate the particle object pool. */
  allocatePool() {
    this.pool = new Array(this.maxCount);
    for (let i = 0; i < this.maxCount; i++) {
      this.pool[i] = {
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
        ax: 0, ay: 0, az: 0, opacity: 0, targetOpacity: 0,
        scale: 1, rotation: 0, lifetime: 0, maxLifetime: 0,
        mass: 1, r: 255, g: 255, b: 255, depth: 0,
        active: false, familyIndex: 0
      };
    }
    this.activeCount = 0;
  }

  /**
   * Set active particle families and redistribute the pool.
   * @param {Object[]} familyConfigs - Array of family configuration objects
   */
  setFamilies(familyConfigs) {
    this.families = familyConfigs;
    this.familySlots = [];
    let offset = 0;
    for (let f = 0; f < familyConfigs.length; f++) {
      const count = Math.floor(this.targetCount * familyConfigs[f].count);
      this.familySlots.push({ start: offset, count, familyIndex: f });
      offset += count;
    }
    this.activeCount = Math.min(offset, this.maxCount);
    this.respawnAllWithFamilies();
  }

  /** Respawn all particles using family configurations. */
  respawnAllWithFamilies() {
    for (let s = 0; s < this.familySlots.length; s++) {
      const slot = this.familySlots[s];
      const family = this.families[slot.familyIndex];
      for (let i = slot.start; i < slot.start + slot.count && i < this.maxCount; i++) {
        this.activateWithFamily(i, family, slot.familyIndex, true);
      }
    }
  }

  /** Spawn initial particles with default settings. */
  spawnInitialParticles() {
    const cfg = settings.universe.particles;
    for (let i = 0; i < this.targetCount; i++) {
      this.activateDefault(i, cfg, true);
    }
    this.activeCount = this.targetCount;
  }

  /** @param {number} idx @param {Object} cfg @param {boolean} scattered */
  activateDefault(idx, cfg, scattered) {
    const p = this.pool[idx];
    p.x = randomRange(0, this.width);
    p.y = randomRange(0, this.height);
    p.z = randomRange(0, this.depthLayers);
    p.vx = randomRange(cfg.speedMin, cfg.speedMax);
    p.vy = randomRange(cfg.speedMin, cfg.speedMax);
    p.vz = 0; p.ax = 0; p.ay = 0; p.az = 0;
    p.scale = randomRange(cfg.sizeMin, cfg.sizeMax);
    p.rotation = randomRange(0, Math.PI * 2);
    p.mass = p.scale; p.r = 255; p.g = 255; p.b = 255;
    p.depth = Math.floor(p.z);
    p.maxLifetime = randomRange(cfg.lifetimeMin, cfg.lifetimeMax);
    p.lifetime = scattered ? randomRange(0, p.maxLifetime) : 0;
    p.opacity = scattered ? randomRange(cfg.alphaMin, cfg.alphaMax) : 0;
    p.targetOpacity = cfg.alphaMax;
    p.active = true; p.familyIndex = 0;
  }

  /** @param {number} idx @param {Object} fam @param {number} fi @param {boolean} scattered */
  activateWithFamily(idx, fam, fi, scattered) {
    const p = this.pool[idx];
    p.x = randomRange(0, this.width);
    p.y = randomRange(0, this.height);
    p.z = randomRange(fam.depthMin, fam.depthMax);
    p.vx = randomRange(fam.speedMin, fam.speedMax);
    p.vy = randomRange(fam.speedMin, fam.speedMax);
    p.vz = 0; p.ax = 0; p.ay = 0; p.az = 0;
    p.scale = randomRange(fam.sizeMin, fam.sizeMax);
    p.rotation = randomRange(0, Math.PI * 2);
    p.mass = p.scale;
    p.r = fam.color.r; p.g = fam.color.g; p.b = fam.color.b;
    p.depth = Math.floor(p.z);
    p.maxLifetime = randomRange(fam.lifetimeMin, fam.lifetimeMax);
    p.lifetime = scattered ? randomRange(0, p.maxLifetime) : 0;
    p.opacity = scattered ? randomRange(fam.opacityMin, fam.opacityMax) : 0;
    p.targetOpacity = fam.opacityMax;
    p.active = true; p.familyIndex = fi;
  }

  /**
   * Update all active particles. Zero allocations.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;
    this.frameCounter++;
    if (this.reducedMotion && this.frameCounter % REDUCED_MOTION_UPDATE_DIVISOR !== 0) return;
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.lifetime += deltaTime;
      if (p.lifetime >= p.maxLifetime) { this.respawnParticle(i); continue; }
      p.vx += p.ax * deltaTime; p.vy += p.ay * deltaTime;
      p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
      p.opacity = this.calcOpacity(p);
      if (p.x < 0) p.x = this.width; if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height; if (p.y > this.height) p.y = 0;
    }
  }

  /** @param {Object} p - Particle @returns {number} */
  calcOpacity(p) {
    const fam = this.families[p.familyIndex];
    const fadeIn = fam ? fam.fadeInDuration : this.fadeInDuration;
    const fadeOut = fam ? fam.fadeOutStart : this.fadeOutStart;
    const ratio = p.lifetime / p.maxLifetime;
    if (ratio < fadeIn) return (ratio / fadeIn) * p.targetOpacity;
    if (ratio > fadeOut) return p.targetOpacity * (1 - (ratio - fadeOut) / (1 - fadeOut));
    return p.targetOpacity;
  }

  /** @param {number} index */
  respawnParticle(index) {
    const p = this.pool[index];
    const fam = this.families[p.familyIndex];
    if (fam) { this.activateWithFamily(index, fam, p.familyIndex, false); }
    else { this.activateDefault(index, settings.universe.particles, false); }
  }

  /**
   * Render all active particles with per-family color batching.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} offsetX - Camera parallax X offset
   * @param {number} offsetY - Camera parallax Y offset
   */
  render(ctx, offsetX = 0, offsetY = 0) {
    if (this.families.length === 0) {
      this.renderBuckets(ctx, 0, this.activeCount, 'rgb(255,255,255)', settings.universe.particles.alphaMax, offsetX, offsetY);
      return;
    }
    for (let f = 0; f < this.familySlots.length; f++) {
      const slot = this.familySlots[f];
      const fam = this.families[slot.familyIndex];
      const color = `rgb(${fam.color.r},${fam.color.g},${fam.color.b})`;
      this.renderBuckets(ctx, slot.start, slot.start + slot.count, color, fam.opacityMax, offsetX, offsetY);
    }
  }

  /** @param {CanvasRenderingContext2D} ctx @param {number} start @param {number} end @param {string} color @param {number} maxOp @param {number} ox @param {number} oy */
  renderBuckets(ctx, start, end, color, maxOp, ox, oy) {
    ctx.fillStyle = color;
    for (let bucket = 1; bucket <= OPACITY_BUCKET_COUNT; bucket++) {
      const bMin = (bucket - 1) / OPACITY_BUCKET_COUNT;
      const bMax = bucket / OPACITY_BUCKET_COUNT;
      let has = false;
      ctx.beginPath();
      for (let i = start; i < end && i < this.activeCount; i++) {
        const p = this.pool[i];
        if (!p.active || p.opacity <= 0) continue;
        const norm = p.opacity / maxOp;
        if (norm <= bMin || norm > bMax) continue;
        const ds = 1 - (p.depth / this.depthLayers) * 0.6;
        const sz = p.scale * ds;
        const px = p.x + ox * (p.depth * 0.15);
        const py = p.y + oy * (p.depth * 0.15);
        ctx.moveTo(px + sz, py);
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        has = true;
      }
      if (has) { ctx.globalAlpha = (bMin + bMax) * 0.5; ctx.fill(); }
    }
  }

  /** @param {number} x @param {number} y */
  setCursorPosition(x, y) { this.cursorX = x; this.cursorY = y; }

  /** @param {number} strength */
  setCursorInfluence(strength) { this.cursorInfluence = strength; }

  /** @param {number} factor - Density factor (0.1 to 1) */
  setDensity(factor) {
    const clamped = Math.max(0.1, Math.min(1, factor));
    this.targetCount = Math.floor(this.maxCount * clamped);
    this.activeCount = Math.min(this.activeCount, this.targetCount);
  }

  /** @param {number} width @param {number} height */
  resize(width, height) { this.width = width; this.height = height; }

  /** @param {boolean} enabled */
  setReducedMotion(enabled) { this.reducedMotion = enabled; }

  /**
   * Get star family slot info.
   * @returns {{start: number, count: number}|null}
   */
  getStarSlot() {
    for (let s = 0; s < this.familySlots.length; s++) {
      const fam = this.families[this.familySlots[s].familyIndex];
      if (fam && fam.behavior === 'twinkle') return this.familySlots[s];
    }
    return null;
  }

  /** Destroy the particle engine and release the pool. */
  destroy() {
    this.pool = [];
    this.activeCount = 0;
    this.families = [];
    this.familySlots = [];
    this.state = MANAGER_STATES.DESTROYED;
  }
}
