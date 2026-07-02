/**
 * ConnectionRenderer
 * Renders ONE living filament line on canvas between two particle positions.
 * The line breathes (opacity oscillates via noise), uses a quadratic bezier
 * with noise-displaced control point for organic feel.
 *
 * Constraints:
 *   - Max opacity: 0.18 (under 20%)
 *   - Max width: 1.4px (under 1.5px)
 *   - Zero allocations in render loop
 */

import { Noise } from '../../utils/Noise.js';
import { settings } from '../../config/settings.js';
import { clamp } from '../../utils/helpers.js';

const SCENE003 = settings.scene003;
const MAX_OPACITY = SCENE003.filamentMaxOpacity;
const MAX_WIDTH = SCENE003.filamentMaxWidth;
const BREATH_SPEED = SCENE003.filamentBreathSpeed;
const NOISE_SCALE = SCENE003.filamentNoiseScale;
const BREATH_SEED_OFFSET = 77.3;

export class ConnectionRenderer {
  constructor() {
    /** @type {Noise|null} */
    this.noise = null;

    /** @type {boolean} */
    this.reducedMotion = false;

    // Pre-allocated control point for bezier (no allocations in render)
    this.cpX = 0;
    this.cpY = 0;

    // Pre-allocated midpoint
    this.midX = 0;
    this.midY = 0;

    // Internal time accumulator for breathing
    this.breathTime = 0;
  }

  /**
   * Initialize the connection renderer.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(reducedMotion) {
    this.noise = new Noise(42);
    this.reducedMotion = reducedMotion;
    this.breathTime = 0;
  }

  /**
   * Render a living filament between two particles.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} particleA - First particle {x, y}
   * @param {Object} particleB - Second particle {x, y}
   * @param {number} progress - Fade-in progress (0-1)
   * @param {boolean} reducedMotion - Current reduced motion state
   * @param {number} deltaTime - Frame delta time in seconds
   */
  render(ctx, particleA, particleB, progress, reducedMotion, deltaTime) {
    if (progress <= 0) return;

    this.breathTime += deltaTime;

    // Compute midpoint (no allocation - reuse instance fields)
    this.midX = (particleA.x + particleB.x) * 0.5;
    this.midY = (particleA.y + particleB.y) * 0.5;

    // Noise-displaced control point for organic curve
    const noiseOffset = this.computeControlPointOffset(reducedMotion);
    this.cpX = this.midX + noiseOffset;
    this.cpY = this.midY - noiseOffset * 0.7;

    // Breathing opacity via noise
    const breathValue = this.computeBreathOpacity(reducedMotion);
    const opacity = clamp(progress * breathValue, 0, MAX_OPACITY);
    const width = clamp(progress * MAX_WIDTH, 0, MAX_WIDTH);

    if (opacity <= 0) return;

    // Draw the quadratic bezier filament
    ctx.beginPath();
    ctx.moveTo(particleA.x, particleA.y);
    ctx.quadraticCurveTo(this.cpX, this.cpY, particleB.x, particleB.y);
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /**
   * Compute the noise-based control point offset for organic curve shape.
   * @param {boolean} reducedMotion - Whether to reduce motion
   * @returns {number} Pixel offset for control point
   */
  computeControlPointOffset(reducedMotion) {
    if (reducedMotion) return 0;

    const n = this.noise.noise2D(
      this.midX * NOISE_SCALE,
      this.midY * NOISE_SCALE + this.breathTime * BREATH_SPEED
    );
    // Map noise [-1,1] to offset range [-15, 15]
    return n * 15;
  }

  /**
   * Compute breathing opacity oscillation via noise.
   * @param {boolean} reducedMotion - Whether to reduce motion
   * @returns {number} Opacity factor (0 to MAX_OPACITY)
   */
  computeBreathOpacity(reducedMotion) {
    if (reducedMotion) return MAX_OPACITY;

    const n = this.noise.noise2D(
      this.breathTime * BREATH_SPEED + BREATH_SEED_OFFSET,
      BREATH_SEED_OFFSET
    );
    // Map from [-1, 1] to [0.5, 1.0] range then multiply by max
    const factor = (n + 1) * 0.25 + 0.5;
    return MAX_OPACITY * factor;
  }

  /**
   * Destroy the renderer and release resources.
   */
  destroy() {
    this.noise = null;
    this.breathTime = 0;
  }
}
