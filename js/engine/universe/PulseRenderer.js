/**
 * PulseRenderer
 * Renders a single tiny pulse dot traveling along the connection bezier
 * from particle A to particle B.
 *
 * Constraints:
 *   - Radius approximately 2px
 *   - Opacity 0.4-0.6
 *   - Travels once, never repeats
 *   - Reduced motion: opacity swell at midpoint instead of travel
 *   - Zero allocations in render loop
 */

import { settings } from '../../config/settings.js';
import { lerp, clamp } from '../../utils/helpers.js';

const SCENE003 = settings.scene003;
const PULSE_SIZE = SCENE003.pulseSize;
const PULSE_MIN_OPACITY = 0.4;
const PULSE_MAX_OPACITY = 0.6;

export class PulseRenderer {
  constructor() {
    /** @type {boolean} */
    this.reducedMotion = false;

    // Pre-allocated position for pulse dot
    this.dotX = 0;
    this.dotY = 0;

    // Pre-allocated control point (matches ConnectionRenderer bezier)
    this.cpX = 0;
    this.cpY = 0;

    // Pre-allocated midpoint
    this.midX = 0;
    this.midY = 0;
  }

  /**
   * Initialize the pulse renderer.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(reducedMotion) {
    this.reducedMotion = reducedMotion;
  }

  /**
   * Render the pulse dot along the connection bezier.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} particleA - First particle {x, y}
   * @param {Object} particleB - Second particle {x, y}
   * @param {number} pulseProgress - Travel progress (0-1), -1 means inactive
   * @param {boolean} reducedMotion - Current reduced motion state
   */
  render(ctx, particleA, particleB, pulseProgress, reducedMotion) {
    if (pulseProgress < 0 || pulseProgress > 1) return;

    if (reducedMotion) {
      this.renderReducedMotion(ctx, particleA, particleB, pulseProgress);
      return;
    }

    this.renderTravelingDot(ctx, particleA, particleB, pulseProgress);
  }

  /**
   * Render a traveling dot along the quadratic bezier curve.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} particleA - Start particle
   * @param {Object} particleB - End particle
   * @param {number} t - Progress along path (0-1)
   */
  renderTravelingDot(ctx, particleA, particleB, t) {
    // Compute control point (same bezier as ConnectionRenderer)
    this.midX = (particleA.x + particleB.x) * 0.5;
    this.midY = (particleA.y + particleB.y) * 0.5;
    this.cpX = this.midX;
    this.cpY = this.midY;

    // Quadratic bezier evaluation: B(t) = (1-t)^2*P0 + 2*(1-t)*t*CP + t^2*P1
    const invT = 1 - t;
    const invTSq = invT * invT;
    const tSq = t * t;
    const twoInvTT = 2 * invT * t;

    this.dotX = invTSq * particleA.x + twoInvTT * this.cpX + tSq * particleB.x;
    this.dotY = invTSq * particleA.y + twoInvTT * this.cpY + tSq * particleB.y;

    // Opacity peaks at midpoint of journey
    const opacityFactor = 1 - Math.abs(t - 0.5) * 2;
    const opacity = lerp(PULSE_MIN_OPACITY, PULSE_MAX_OPACITY, opacityFactor);

    this.drawDot(ctx, this.dotX, this.dotY, PULSE_SIZE, opacity);
  }

  /**
   * Reduced motion fallback: opacity swell at midpoint instead of travel.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} particleA - Start particle
   * @param {Object} particleB - End particle
   * @param {number} progress - Pulse progress (0-1)
   */
  renderReducedMotion(ctx, particleA, particleB, progress) {
    this.midX = (particleA.x + particleB.x) * 0.5;
    this.midY = (particleA.y + particleB.y) * 0.5;

    // Bell curve opacity: swell up then back down
    const bellCurve = Math.sin(progress * Math.PI);
    const opacity = clamp(bellCurve * PULSE_MAX_OPACITY, 0, PULSE_MAX_OPACITY);

    if (opacity <= 0) return;

    this.drawDot(ctx, this.midX, this.midY, PULSE_SIZE, opacity);
  }

  /**
   * Draw a circular dot at the given position.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Dot radius
   * @param {number} opacity - Dot opacity
   */
  drawDot(ctx, x, y, radius, opacity) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }

  /**
   * Destroy the renderer and release resources.
   */
  destroy() {
    this.dotX = 0;
    this.dotY = 0;
  }
}
