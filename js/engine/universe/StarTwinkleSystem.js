/**
 * StarTwinkleSystem
 * Reusable star twinkle behavior system.
 * Each star has independent timing for natural, unsynchronized brightness changes.
 * Uses noise for organic randomness. Respects reduced motion.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { randomRange } from '../../utils/helpers.js';

const TWINKLE_NOISE_SEED = 77;
const TWINKLE_INTERVAL_MIN = 3;
const TWINKLE_INTERVAL_MAX = 12;
const TWINKLE_FADE_IN = 0.8;
const TWINKLE_FADE_OUT = 1.2;
const TWINKLE_BRIGHTNESS_MIN = 0.3;
const TWINKLE_BRIGHTNESS_MAX = 1.0;
const REDUCED_MOTION_INTERVAL_MULT = 3;
const REDUCED_MOTION_BRIGHTNESS_MAX = 0.5;

export class StarTwinkleSystem {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = new Noise(TWINKLE_NOISE_SEED);
    this.stars = [];
    this.maxStars = 0;
    this.activeCount = 0;
    this.reducedMotion = false;
  }

  /**
   * Initialize the star twinkle system.
   * @param {number} maxStars - Maximum number of stars to manage
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(maxStars, reducedMotion = false) {
    this.maxStars = maxStars;
    this.reducedMotion = reducedMotion;
    this.allocateStars();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Allocate star twinkle state objects (zero-allocation pool).
   */
  allocateStars() {
    this.stars = new Array(this.maxStars);
    for (let i = 0; i < this.maxStars; i++) {
      this.stars[i] = this.createStarState();
    }
  }

  /**
   * Create a single star twinkle state.
   * @returns {Object} Star state object
   */
  createStarState() {
    return {
      brightness: 0,
      timer: randomRange(0, TWINKLE_INTERVAL_MAX),
      interval: this.getRandomInterval(),
      fadeInDuration: TWINKLE_FADE_IN,
      fadeOutDuration: TWINKLE_FADE_OUT,
      maxBrightness: randomRange(TWINKLE_BRIGHTNESS_MIN, TWINKLE_BRIGHTNESS_MAX),
      phase: 'waiting',
      phaseTimer: 0
    };
  }

  /**
   * Get a random twinkle interval respecting reduced motion.
   * @returns {number} Interval in seconds
   */
  getRandomInterval() {
    const mult = this.reducedMotion ? REDUCED_MOTION_INTERVAL_MULT : 1;
    return randomRange(TWINKLE_INTERVAL_MIN * mult, TWINKLE_INTERVAL_MAX * mult);
  }

  /**
   * Set the number of active stars (linked to particle count).
   * @param {number} count - Number of active stars
   */
  setActiveCount(count) {
    this.activeCount = Math.min(count, this.maxStars);
  }

  /**
   * Update all active star twinkle states.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    for (let i = 0; i < this.activeCount; i++) {
      this.updateStar(i, deltaTime, elapsedTime);
    }
  }

  /**
   * Update a single star twinkle state.
   * @param {number} index - Star index
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  updateStar(index, deltaTime, elapsedTime) {
    const star = this.stars[index];

    if (star.phase === 'waiting') {
      star.timer -= deltaTime;
      if (star.timer <= 0) {
        star.phase = 'fadeIn';
        star.phaseTimer = 0;
        this.randomizeStarBrightness(star, index, elapsedTime);
      }
      return;
    }

    star.phaseTimer += deltaTime;

    if (star.phase === 'fadeIn') {
      const progress = star.phaseTimer / star.fadeInDuration;
      star.brightness = Math.min(star.maxBrightness, star.maxBrightness * progress);
      if (progress >= 1) {
        star.phase = 'fadeOut';
        star.phaseTimer = 0;
      }
      return;
    }

    if (star.phase === 'fadeOut') {
      const progress = star.phaseTimer / star.fadeOutDuration;
      star.brightness = star.maxBrightness * (1 - Math.min(1, progress));
      if (progress >= 1) {
        star.phase = 'waiting';
        star.brightness = 0;
        star.timer = this.getRandomInterval();
      }
    }
  }

  /**
   * Randomize star brightness using noise for organic variation.
   * @param {Object} star - Star state
   * @param {number} index - Star index
   * @param {number} elapsedTime - Elapsed time for noise input
   */
  randomizeStarBrightness(star, index, elapsedTime) {
    const noiseVal = this.noise.noise2D(index * 0.5, elapsedTime * 0.1);
    const normalized = (noiseVal + 1) * 0.5;
    const maxB = this.reducedMotion ? REDUCED_MOTION_BRIGHTNESS_MAX : TWINKLE_BRIGHTNESS_MAX;
    star.maxBrightness = TWINKLE_BRIGHTNESS_MIN + normalized * (maxB - TWINKLE_BRIGHTNESS_MIN);
  }

  /**
   * Get the current brightness multiplier for a star by index.
   * @param {number} index - Star index
   * @returns {number} Brightness multiplier (0 to 1)
   */
  getBrightness(index) {
    if (index >= this.activeCount) return 0;
    return this.stars[index].brightness;
  }

  /**
   * Set reduced motion preference.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
  }

  /**
   * Destroy the star twinkle system.
   */
  destroy() {
    this.stars = [];
    this.activeCount = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
