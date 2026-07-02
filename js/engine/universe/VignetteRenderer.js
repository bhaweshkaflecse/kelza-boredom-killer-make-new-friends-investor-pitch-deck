/**
 * VignetteRenderer
 * Cinematic vignette overlay - dark edges fading to transparent center.
 * Adds subtle cinematic framing to the viewport.
 */

import { MANAGER_STATES } from '../../config/constants.js';

const DEFAULT_INTENSITY = 0.4;
const INNER_RADIUS_RATIO = 0.3;
const OUTER_RADIUS_RATIO = 0.85;

export class VignetteRenderer {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.intensity = DEFAULT_INTENSITY;
  }

  /**
   * Initialize the vignette renderer.
   * @param {number} [intensity] - Vignette intensity (0 to 1)
   */
  init(intensity = DEFAULT_INTENSITY) {
    this.intensity = intensity;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Render the vignette overlay.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  render(ctx, width, height) {
    if (this.state !== MANAGER_STATES.READY) return;
    if (this.intensity <= 0) return;

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const innerRadius = maxRadius * INNER_RADIUS_RATIO;
    const outerRadius = maxRadius * OUTER_RADIUS_RATIO;

    const gradient = ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, outerRadius
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${this.intensity})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Set the vignette intensity.
   * @param {number} intensity - Intensity value (0 to 1)
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Destroy the vignette renderer.
   */
  destroy() {
    this.state = MANAGER_STATES.DESTROYED;
  }
}
