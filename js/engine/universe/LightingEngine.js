/**
 * LightingEngine
 * Ambient lighting system with color theme support.
 * Creates subtle "breathing" effects using noise-driven opacity/color shifts.
 * Supports future chapter-based theme transitions.
 */

import { MANAGER_STATES, LIGHTING_THEMES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { lerp } from '../../utils/helpers.js';

const NOISE_SPEED = 0.15;
const BREATH_AMPLITUDE = 0.03;
const TRANSITION_SPEED = 0.8;
const MIN_OPACITY = 0.02;
const MAX_OPACITY = 0.08;

export class LightingEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = new Noise(42);
    this.currentTheme = 'dark';
    this.targetTheme = 'dark';
    this.currentColor = { r: 0, g: 0, b: 0 };
    this.targetColor = { r: 0, g: 0, b: 0 };
    this.opacity = MIN_OPACITY;
    this.breathValue = 0;
    this.transitionProgress = 1;
    this.reducedMotion = false;
  }

  /**
   * Initialize the lighting engine.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    const themeColors = LIGHTING_THEMES[this.currentTheme];
    this.currentColor = { ...themeColors };
    this.targetColor = { ...themeColors };
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Set the active lighting theme.
   * @param {string} themeName - Theme name (dark, purple, magenta, blue, gold, white)
   */
  setTheme(themeName) {
    if (!LIGHTING_THEMES[themeName]) return;
    if (themeName === this.currentTheme && this.transitionProgress >= 1) return;

    this.targetTheme = themeName;
    this.targetColor = { ...LIGHTING_THEMES[themeName] };
    this.transitionProgress = 0;
  }

  /**
   * Get the current theme name.
   * @returns {string} Current theme identifier
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Get the current computed lighting color with breathing applied.
   * @returns {{r: number, g: number, b: number, a: number}} RGBA color
   */
  getColor() {
    return {
      r: this.currentColor.r,
      g: this.currentColor.g,
      b: this.currentColor.b,
      a: this.opacity
    };
  }

  /**
   * Update the lighting engine state.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.updateTransition(deltaTime);
    this.updateBreathing(elapsedTime);
  }

  /**
   * Update color transition between themes.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateTransition(deltaTime) {
    if (this.transitionProgress >= 1) return;

    this.transitionProgress = Math.min(
      1,
      this.transitionProgress + deltaTime * TRANSITION_SPEED
    );

    const t = this.transitionProgress;
    this.currentColor.r = lerp(this.currentColor.r, this.targetColor.r, t);
    this.currentColor.g = lerp(this.currentColor.g, this.targetColor.g, t);
    this.currentColor.b = lerp(this.currentColor.b, this.targetColor.b, t);

    if (this.transitionProgress >= 1) {
      this.currentTheme = this.targetTheme;
    }
  }

  /**
   * Update the breathing ambient effect using noise.
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  updateBreathing(elapsedTime) {
    if (this.reducedMotion) {
      this.opacity = MIN_OPACITY;
      return;
    }

    this.breathValue = this.noise.noise2D(
      elapsedTime * NOISE_SPEED,
      elapsedTime * NOISE_SPEED * 0.7
    );

    const normalizedBreath = (this.breathValue + 1) * 0.5;
    this.opacity = MIN_OPACITY + normalizedBreath * BREATH_AMPLITUDE;
    this.opacity = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, this.opacity));
  }

  /**
   * Render ambient lighting to the canvas context.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  render(ctx, width, height) {
    if (this.opacity <= 0) return;

    const { r, g, b } = this.currentColor;
    const gradient = ctx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.7
    );

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity})`);
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
  }

  /**
   * Destroy the lighting engine and release resources.
   */
  destroy() {
    this.state = MANAGER_STATES.DESTROYED;
  }
}
