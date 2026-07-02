/**
 * FogRenderer
 * Cinematic fog layer with multiple depth-separated fog bands.
 * Very soft, barely visible, creates depth without obscuring content.
 * Reacts to time and noise for organic movement.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { Noise } from '../../utils/Noise.js';

const FOG_NOISE_SEED = 55;
const FOG_LAYER_COUNT = 3;
const FOG_BASE_OPACITY = 0.015;
const FOG_DRIFT_SPEED = 0.008;
const FOG_VERTICAL_BIAS = 0.7;
const FOG_SPREAD_MIN = 0.3;
const FOG_SPREAD_MAX = 0.8;
const REDUCED_MOTION_SPEED_FACTOR = 0.3;

/**
 * Pre-defined fog layer configurations.
 * Each layer has unique depth, speed, and position parameters.
 */
const FOG_LAYERS = Object.freeze([
  Object.freeze({
    yBias: 0.8, xOffset: 0.3, speedMult: 1.0, opacityMult: 1.0, spread: 0.7
  }),
  Object.freeze({
    yBias: 0.6, xOffset: 0.7, speedMult: 0.7, opacityMult: 0.7, spread: 0.5
  }),
  Object.freeze({
    yBias: 0.4, xOffset: 0.5, speedMult: 0.5, opacityMult: 0.5, spread: 0.6
  })
]);

export class FogRenderer {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = new Noise(FOG_NOISE_SEED);
    this.reducedMotion = false;
    this.speedFactor = 1;
    this.width = 0;
    this.height = 0;
  }

  /**
   * Initialize the fog renderer.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    this.speedFactor = reducedMotion ? REDUCED_MOTION_SPEED_FACTOR : 1;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Render all fog layers to the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} elapsedTime - Elapsed time from TimeEngine
   */
  render(ctx, width, height, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.width = width;
    this.height = height;

    for (let i = 0; i < FOG_LAYER_COUNT; i++) {
      this.renderFogLayer(ctx, i, elapsedTime);
    }
  }

  /**
   * Render a single fog layer.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} index - Fog layer index
   * @param {number} elapsedTime - Elapsed time in seconds
   */
  renderFogLayer(ctx, index, elapsedTime) {
    const config = FOG_LAYERS[index];
    const t = elapsedTime * FOG_DRIFT_SPEED * config.speedMult * this.speedFactor;

    const noiseX = this.noise.noise2D(t + index, t * 0.5);
    const noiseY = this.noise.noise2D(t * 0.7, t + index * 2);

    const centerX = this.width * (config.xOffset + noiseX * 0.1);
    const centerY = this.height * (config.yBias + noiseY * 0.05);
    const radius = Math.max(this.width, this.height) * config.spread;

    const opacity = FOG_BASE_OPACITY * config.opacityMult;

    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    gradient.addColorStop(0, `rgba(15, 12, 30, ${opacity})`);
    gradient.addColorStop(0.5, `rgba(15, 12, 30, ${opacity * 0.5})`);
    gradient.addColorStop(1, 'rgba(15, 12, 30, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Handle canvas resize.
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
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
    this.speedFactor = enabled ? REDUCED_MOTION_SPEED_FACTOR : 1;
  }

  /**
   * Destroy the fog renderer.
   */
  destroy() {
    this.state = MANAGER_STATES.DESTROYED;
  }
}
