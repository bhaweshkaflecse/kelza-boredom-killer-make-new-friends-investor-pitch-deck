/**
 * GradientRenderer
 * Multi-layer nebula-like background gradients.
 * Very subtle purple/blue tones shifting slowly over time.
 * Creates depth in the deep space environment.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { Noise } from '../../utils/Noise.js';

const GRADIENT_NOISE_SEED = 33;
const GRADIENT_LAYER_COUNT = 4;
const GRADIENT_DRIFT_SPEED = 0.005;
const GRADIENT_BASE_OPACITY = 0.025;
const REDUCED_MOTION_SPEED_FACTOR = 0.3;

/**
 * Pre-defined gradient layer configurations.
 * Each creates a subtle nebula-like glow at different positions.
 */
const GRADIENT_LAYERS = Object.freeze([
  Object.freeze({
    color: { r: 20, g: 15, b: 45 },
    xBase: 0.3, yBase: 0.4, radiusMult: 0.6,
    speedMult: 1.0, opacityMult: 1.0
  }),
  Object.freeze({
    color: { r: 15, g: 20, b: 50 },
    xBase: 0.7, yBase: 0.6, radiusMult: 0.5,
    speedMult: 0.8, opacityMult: 0.8
  }),
  Object.freeze({
    color: { r: 25, g: 10, b: 40 },
    xBase: 0.5, yBase: 0.3, radiusMult: 0.7,
    speedMult: 0.6, opacityMult: 0.6
  }),
  Object.freeze({
    color: { r: 12, g: 18, b: 35 },
    xBase: 0.4, yBase: 0.7, radiusMult: 0.55,
    speedMult: 0.9, opacityMult: 0.7
  })
]);

export class GradientRenderer {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = new Noise(GRADIENT_NOISE_SEED);
    this.reducedMotion = false;
    this.speedFactor = 1;
  }

  /**
   * Initialize the gradient renderer.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    this.speedFactor = reducedMotion ? REDUCED_MOTION_SPEED_FACTOR : 1;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Render all gradient layers to the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} elapsedTime - Elapsed time from TimeEngine
   */
  render(ctx, width, height, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    for (let i = 0; i < GRADIENT_LAYER_COUNT; i++) {
      this.renderGradientLayer(ctx, width, height, i, elapsedTime);
    }
  }

  /**
   * Render a single gradient layer.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} index - Layer index
   * @param {number} elapsedTime - Elapsed time in seconds
   */
  renderGradientLayer(ctx, width, height, index, elapsedTime) {
    const config = GRADIENT_LAYERS[index];
    const t = elapsedTime * GRADIENT_DRIFT_SPEED * config.speedMult * this.speedFactor;

    const noiseX = this.noise.noise2D(t + index * 3, t * 0.3);
    const noiseY = this.noise.noise2D(t * 0.4, t + index * 5);

    const centerX = width * (config.xBase + noiseX * 0.08);
    const centerY = height * (config.yBase + noiseY * 0.06);
    const radius = Math.max(width, height) * config.radiusMult;

    const { r, g, b } = config.color;
    const opacity = GRADIENT_BASE_OPACITY * config.opacityMult;

    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${opacity * 0.4})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
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
   * Destroy the gradient renderer.
   */
  destroy() {
    this.state = MANAGER_STATES.DESTROYED;
  }
}
