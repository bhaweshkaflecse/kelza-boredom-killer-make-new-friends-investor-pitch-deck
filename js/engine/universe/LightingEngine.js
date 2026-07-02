/**
 * LightingEngine
 * Multi-source ambient lighting system with independent breathing.
 * Supports primary, secondary, and accent light sources, each with
 * independent noise-driven opacity and color. Theme transitions
 * affect all sources. All timing from TimeEngine.
 */

import { MANAGER_STATES, LIGHTING_THEMES, LIGHT_SOURCE_IDS } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { lerp } from '../../utils/helpers.js';

const PRIMARY_NOISE_SEED = 42;
const SECONDARY_NOISE_SEED = 67;
const ACCENT_NOISE_SEED = 91;
const SECONDARY_POSITION_X = 0.3;
const SECONDARY_POSITION_Y = 0.7;
const ACCENT_POSITION_X = 0.75;
const ACCENT_POSITION_Y = 0.35;
const SECONDARY_OPACITY_MULT = 0.6;
const ACCENT_OPACITY_MULT = 0.4;
const SECONDARY_SPEED_MULT = 0.8;
const ACCENT_SPEED_MULT = 1.2;
const SECONDARY_RADIUS_MULT = 0.5;
const ACCENT_RADIUS_MULT = 0.35;

export class LightingEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.sources = [];
    this.currentTheme = 'dark';
    this.targetTheme = 'dark';
    this.currentColor = { r: 0, g: 0, b: 0 };
    this.startColor = { r: 0, g: 0, b: 0 };
    this.targetColor = { r: 0, g: 0, b: 0 };
    this.transitionProgress = 1;
    this.reducedMotion = false;

    this.noiseSpeed = settings.universe.lighting.breathSpeed;
    this.breathAmplitude = settings.universe.lighting.breathAmplitude;
    this.transitionSpeed = settings.universe.lighting.transitionSpeed;
    this.minOpacity = settings.universe.lighting.minOpacity;
    this.maxOpacity = settings.universe.lighting.maxOpacity;
  }

  /**
   * Initialize the lighting engine with multiple sources.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    this.setupSources();

    const themeColors = LIGHTING_THEMES[this.currentTheme];
    this.currentColor = { ...themeColors };
    this.startColor = { ...themeColors };
    this.targetColor = { ...themeColors };
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Set up the three independent light sources.
   */
  setupSources() {
    this.sources = [
      {
        id: LIGHT_SOURCE_IDS.PRIMARY,
        noise: new Noise(PRIMARY_NOISE_SEED),
        posX: 0.5, posY: 0.5,
        opacity: 0,
        speedMult: 1.0,
        opacityMult: 1.0,
        radiusMult: 0.7
      },
      {
        id: LIGHT_SOURCE_IDS.SECONDARY,
        noise: new Noise(SECONDARY_NOISE_SEED),
        posX: SECONDARY_POSITION_X, posY: SECONDARY_POSITION_Y,
        opacity: 0,
        speedMult: SECONDARY_SPEED_MULT,
        opacityMult: SECONDARY_OPACITY_MULT,
        radiusMult: SECONDARY_RADIUS_MULT
      },
      {
        id: LIGHT_SOURCE_IDS.ACCENT,
        noise: new Noise(ACCENT_NOISE_SEED),
        posX: ACCENT_POSITION_X, posY: ACCENT_POSITION_Y,
        opacity: 0,
        speedMult: ACCENT_SPEED_MULT,
        opacityMult: ACCENT_OPACITY_MULT,
        radiusMult: ACCENT_RADIUS_MULT
      }
    ];
  }

  /**
   * Set the active lighting theme.
   * @param {string} themeName - Theme name (dark, purple, magenta, blue, gold, white)
   */
  setTheme(themeName) {
    if (!LIGHTING_THEMES[themeName]) return;
    if (themeName === this.currentTheme && this.transitionProgress >= 1) return;

    this.targetTheme = themeName;
    this.startColor = { ...this.currentColor };
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
   * Update the lighting engine state.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.updateTransition(deltaTime);
    this.updateSources(elapsedTime);
  }

  /**
   * Update color transition between themes.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateTransition(deltaTime) {
    if (this.transitionProgress >= 1) return;

    this.transitionProgress = Math.min(
      1, this.transitionProgress + deltaTime * this.transitionSpeed
    );

    const t = this.transitionProgress;
    this.currentColor.r = lerp(this.startColor.r, this.targetColor.r, t);
    this.currentColor.g = lerp(this.startColor.g, this.targetColor.g, t);
    this.currentColor.b = lerp(this.startColor.b, this.targetColor.b, t);

    if (this.transitionProgress >= 1) {
      this.currentTheme = this.targetTheme;
    }
  }

  /**
   * Update all light sources breathing independently.
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  updateSources(elapsedTime) {
    if (this.reducedMotion) {
      for (let i = 0; i < this.sources.length; i++) {
        this.sources[i].opacity = this.minOpacity * this.sources[i].opacityMult;
      }
      return;
    }

    for (let i = 0; i < this.sources.length; i++) {
      this.updateSource(this.sources[i], elapsedTime);
    }
  }

  /**
   * Update a single light source breathing.
   * @param {Object} source - Light source object
   * @param {number} elapsedTime - Elapsed time in seconds
   */
  updateSource(source, elapsedTime) {
    const t = elapsedTime * this.noiseSpeed * source.speedMult;
    const breathValue = source.noise.noise2D(t, t * 0.7);
    const normalizedBreath = (breathValue + 1) * 0.5;

    const baseOpacity = this.minOpacity + normalizedBreath * this.breathAmplitude;
    source.opacity = Math.max(
      this.minOpacity * source.opacityMult,
      Math.min(this.maxOpacity * source.opacityMult, baseOpacity * source.opacityMult)
    );
  }

  /**
   * Render all light sources to the canvas context.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  render(ctx, width, height) {
    const { r, g, b } = this.currentColor;

    for (let i = 0; i < this.sources.length; i++) {
      this.renderSource(ctx, width, height, this.sources[i], r, g, b);
    }
  }

  /**
   * Render a single light source as a radial gradient.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Object} source - Light source
   * @param {number} r - Red channel
   * @param {number} g - Green channel
   * @param {number} b - Blue channel
   */
  renderSource(ctx, width, height, source, r, g, b) {
    if (source.opacity <= 0) return;

    const cx = width * source.posX;
    const cy = height * source.posY;
    const radius = Math.max(width, height) * source.radiusMult;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${source.opacity})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Apply a warmth offset that blends the current color toward gold.
   * Used by Scene004 to subtly warm the environment as influence spreads.
   * @param {number} value - Warmth factor (0 = no change, 1 = full gold blend)
   */
  setWarmthOffset(value) {
    if (value <= 0) return;
    const gold = LIGHTING_THEMES.gold;
    const t = Math.min(value, 1) * 0.15; // Subtle blend, max 15% shift
    this.currentColor.r = this.currentColor.r + (gold.r - this.currentColor.r) * t;
    this.currentColor.g = this.currentColor.g + (gold.g - this.currentColor.g) * t;
    this.currentColor.b = this.currentColor.b + (gold.b - this.currentColor.b) * t;
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
    this.sources = [];
    this.state = MANAGER_STATES.DESTROYED;
  }
}
