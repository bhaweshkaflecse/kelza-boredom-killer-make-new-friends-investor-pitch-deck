/**
 * PatternSuggestion
 * Creates influence masks (soft radial gradients) that gently encourage
 * density, alignment, and spacing. NOT continent meshes. Masks feel organic,
 * driven by noise. Results should evoke familiarity without certainty.
 *
 * Reusable for Earth emergence, communities, marketplace, and trust systems.
 * Zero per-frame allocations. Pre-allocated mask pool and result object.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { clamp } from '../../utils/helpers.js';

const CONFIG = settings.scene006.patternSuggestion;
const MAX_MASKS = CONFIG.maskCount;
const MAX_INFLUENCE = CONFIG.maxInfluence;
const FADE_IN_DURATION = CONFIG.fadeInDuration;
const NOISE_SCALE = CONFIG.noiseScale;

/**
 * Create a pre-allocated mask object.
 * @returns {Object} Mask state
 */
function createMask() {
  return {
    centerX: 0,
    centerY: 0,
    radius: 0,
    noiseOffsetX: 0,
    noiseOffsetY: 0,
    strength: 0,
    densityBias: 0,
    alignmentBias: 0,
    spacingBias: 0,
    active: false,
    fadeProgress: 0
  };
}

export class PatternSuggestion {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;

    /** @type {Object[]} Pre-allocated mask pool */
    this.masks = [];
    this.activeMaskCount = 0;

    // Noise for organic shapes
    this.noise = null;
    this.noiseTime = 0;

    // Dimensions
    this.width = 0;
    this.height = 0;

    // Pre-allocated result object for getInfluenceAt
    this._result = { density: 0, alignment: 0, spacing: 0 };
  }

  /**
   * Initialize the pattern suggestion system.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Noise seed
   */
  init(width, height, seed) {
    this.width = width;
    this.height = height;
    this.noise = new Noise(seed);
    this.noiseTime = 0;
    this.activeMaskCount = 0;

    // Pre-allocate mask pool
    this.masks.length = 0;
    for (let i = 0; i < MAX_MASKS; i++) {
      this.masks.push(createMask());
    }

    // Place initial masks using noise-driven positions
    this.placeMasks();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Place masks at noise-driven positions across the canvas.
   * Masks are distributed organically, avoiding perfect grids.
   */
  placeMasks() {
    const marginX = this.width * 0.15;
    const marginY = this.height * 0.15;
    const innerW = this.width - marginX * 2;
    const innerH = this.height - marginY * 2;

    for (let i = 0; i < MAX_MASKS; i++) {
      const mask = this.masks[i];

      // Noise-based placement
      const nx = this.noise.noise2D(i * 7.3, 100) * 0.5 + 0.5;
      const ny = this.noise.noise2D(i * 11.7, 200) * 0.5 + 0.5;

      mask.centerX = marginX + nx * innerW;
      mask.centerY = marginY + ny * innerH;
      mask.radius = 60 + Math.abs(this.noise.noise2D(i * 3.1, 300)) * 120;
      mask.noiseOffsetX = i * 13.7;
      mask.noiseOffsetY = i * 17.3;

      // Bias values from noise (organic variation)
      mask.densityBias = 0.3 + Math.abs(this.noise.noise2D(i * 5.1, 400)) * 0.7;
      mask.alignmentBias = 0.2 + Math.abs(this.noise.noise2D(i * 6.3, 500)) * 0.6;
      mask.spacingBias = 0.1 + Math.abs(this.noise.noise2D(i * 4.7, 600)) * 0.5;

      mask.strength = 0;
      mask.active = true;
      mask.fadeProgress = 0;
    }
    this.activeMaskCount = MAX_MASKS;
  }

  /**
   * Update mask strengths based on recognition confidence.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} recognitionConfidence - Current confidence (0 to ~0.35)
   */
  update(deltaTime, recognitionConfidence) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.noiseTime += deltaTime;
    this.updateMaskStrengths(deltaTime, recognitionConfidence);
    this.updateMaskDrift(deltaTime);
  }

  /**
   * Fade masks in proportionally to recognition confidence.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} confidence - Recognition confidence
   */
  updateMaskStrengths(deltaTime, confidence) {
    const fadeRate = 1 / FADE_IN_DURATION;

    for (let i = 0; i < MAX_MASKS; i++) {
      const mask = this.masks[i];
      if (!mask.active) continue;

      // Target strength scales with confidence
      const targetStrength = confidence * MAX_INFLUENCE;

      // Smooth fade toward target
      if (mask.strength < targetStrength) {
        mask.fadeProgress += fadeRate * deltaTime;
        if (mask.fadeProgress > 1) mask.fadeProgress = 1;
        mask.strength = targetStrength * mask.fadeProgress;
      } else {
        mask.strength = targetStrength;
      }
    }
  }

  /**
   * Apply slow noise-driven drift to mask centers (organic breathing).
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateMaskDrift(deltaTime) {
    const driftSpeed = 0.3;

    for (let i = 0; i < MAX_MASKS; i++) {
      const mask = this.masks[i];
      if (!mask.active) continue;

      // Gentle drift from noise
      const driftX = this.noise.noise2D(
        mask.noiseOffsetX + this.noiseTime * 0.02,
        mask.noiseOffsetY
      ) * driftSpeed * deltaTime;

      const driftY = this.noise.noise2D(
        mask.noiseOffsetX,
        mask.noiseOffsetY + this.noiseTime * 0.02
      ) * driftSpeed * deltaTime;

      mask.centerX += driftX;
      mask.centerY += driftY;
    }
  }

  /**
   * Get the influence at a world position. Returns pre-allocated result.
   * Accumulates soft radial falloff from all active masks.
   * @param {number} x - Query X
   * @param {number} y - Query Y
   * @returns {{density: number, alignment: number, spacing: number}}
   */
  getInfluenceAt(x, y) {
    this._result.density = 0;
    this._result.alignment = 0;
    this._result.spacing = 0;

    for (let i = 0; i < MAX_MASKS; i++) {
      const mask = this.masks[i];
      if (!mask.active || mask.strength < 0.001) continue;

      const dx = x - mask.centerX;
      const dy = y - mask.centerY;
      const distSq = dx * dx + dy * dy;
      const radiusSq = mask.radius * mask.radius;

      if (distSq >= radiusSq) continue;

      // Soft radial falloff (quadratic for smooth gradient)
      const dist = Math.sqrt(distSq);
      const t = 1 - (dist / mask.radius);
      const falloff = t * t;

      // Add noise perturbation for organic edge
      const noiseMod = this.noise.noise2D(
        x * NOISE_SCALE + mask.noiseOffsetX,
        y * NOISE_SCALE + mask.noiseOffsetY
      ) * 0.3 + 0.7;

      const influence = mask.strength * falloff * noiseMod;

      this._result.density += influence * mask.densityBias;
      this._result.alignment += influence * mask.alignmentBias;
      this._result.spacing += influence * mask.spacingBias;
    }

    // Clamp accumulated values
    this._result.density = clamp(this._result.density, 0, MAX_INFLUENCE);
    this._result.alignment = clamp(this._result.alignment, 0, MAX_INFLUENCE);
    this._result.spacing = clamp(this._result.spacing, 0, MAX_INFLUENCE);

    return this._result;
  }

  /**
   * Get the number of active masks.
   * @returns {number}
   */
  getMaskCount() {
    return this.activeMaskCount;
  }

  /**
   * Handle canvas resize and redistribute masks.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    this.width = width;
    this.height = height;

    for (let i = 0; i < MAX_MASKS; i++) {
      const mask = this.masks[i];
      mask.centerX *= scaleX;
      mask.centerY *= scaleY;
    }
  }

  /**
   * Destroy the system and release all resources.
   */
  destroy() {
    this.masks.length = 0;
    this.activeMaskCount = 0;
    this.noise = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
