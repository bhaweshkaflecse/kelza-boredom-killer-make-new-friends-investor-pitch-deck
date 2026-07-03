/**
 * InsightTransition
 * Reusable bridge class that manages the transition from the cinematic
 * Scene011 to the DOM-based product experience.
 *
 * Responsibilities:
 * - 1-second silence delay after Scene011 completes
 * - Reduces universe particle motion by ~80% over 2 seconds
 * - Reveals the insight statement via CSS class toggle
 * - Unlocks scroll after text appears
 * - Respects prefers-reduced-motion
 */

import { InsightSection } from './InsightSection.js';

const SILENCE_DELAY_MS = 1000;
const DAMPING_DURATION_MS = 2000;
const TEXT_SETTLE_DELAY_MS = 2000;
const DAMPING_TARGET = 0.2;

/** @enum {string} */
const TRANSITION_STATE = {
  IDLE: 'idle',
  TRANSITIONING: 'transitioning',
  COMPLETE: 'complete',
  DESTROYED: 'destroyed'
};

export class InsightTransition {
  /**
   * @param {Object} options
   * @param {Object} options.engine - Engine instance
   * @param {Object} options.universe - UniverseEngine instance
   * @param {Object} options.scrollManager - ScrollManager instance
   */
  constructor({ engine, universe, scrollManager }) {
    this.engine = engine;
    this.universe = universe;
    this.scrollManager = scrollManager;
    this.insightSection = new InsightSection();
    this.state = TRANSITION_STATE.IDLE;
    this.dampingRafId = null;
    this.timeouts = [];
  }

  /**
   * Start the transition sequence.
   * Reduced motion path: skip delays, immediately show text, unlock scroll.
   */
  start() {
    if (this.state !== TRANSITION_STATE.IDLE) return;
    this.state = TRANSITION_STATE.TRANSITIONING;

    const reducedMotion = this.engine.reducedMotion ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      this.insightSection.reveal();
      if (this.scrollManager) {
        this.scrollManager.unlock();
      }
      this.state = TRANSITION_STATE.COMPLETE;
      return;
    }

    // Step 1: Silence delay (1 second of nothing)
    const silenceTimeout = setTimeout(() => {
      // Step 2: Reduce particle motion over 2 seconds
      this.dampParticleMotion();

      // Step 3: After damping settles, reveal text
      const revealTimeout = setTimeout(() => {
        this.insightSection.reveal();

        // Step 4: After text appears, unlock scroll
        const unlockTimeout = setTimeout(() => {
          if (this.scrollManager) {
            this.scrollManager.unlock();
          }
          this.state = TRANSITION_STATE.COMPLETE;
        }, TEXT_SETTLE_DELAY_MS);
        this.timeouts.push(unlockTimeout);
      }, DAMPING_DURATION_MS);
      this.timeouts.push(revealTimeout);
    }, SILENCE_DELAY_MS);
    this.timeouts.push(silenceTimeout);
  }

  /**
   * Gradually reduce particle velocities to ~20% of original over DAMPING_DURATION_MS.
   * Stores original velocities at the start and interpolates toward the target,
   * avoiding compounding per-frame multiplication.
   */
  dampParticleMotion() {
    if (!this.universe || !this.universe.particleEngine) return;

    const particleEngine = this.universe.particleEngine;
    const pool = particleEngine.pool;
    if (!pool || pool.length === 0) return;

    // Store original velocities to lerp from
    const originalVelocities = [];
    for (let i = 0; i < pool.length; i++) {
      originalVelocities.push({ vx: pool[i].vx, vy: pool[i].vy });
    }

    const startTime = performance.now();

    const applyDamping = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / DAMPING_DURATION_MS, 1);
      // Ease-out: decelerates toward end
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      // Interpolate from 1.0 to DAMPING_TARGET
      const dampingFactor = 1 - (easedProgress * (1 - DAMPING_TARGET));

      for (let i = 0; i < pool.length; i++) {
        const particle = pool[i];
        if (!particle.active) continue;
        particle.vx = originalVelocities[i].vx * dampingFactor;
        particle.vy = originalVelocities[i].vy * dampingFactor;
      }

      if (progress < 1) {
        this.dampingRafId = requestAnimationFrame(applyDamping);
      } else {
        this.dampingRafId = null;
      }
    };

    this.dampingRafId = requestAnimationFrame(applyDamping);
  }

  /**
   * Clean up timers and animation frames.
   */
  destroy() {
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts = [];

    if (this.dampingRafId) {
      cancelAnimationFrame(this.dampingRafId);
      this.dampingRafId = null;
    }

    if (this.insightSection) {
      this.insightSection.destroy();
      this.insightSection = null;
    }

    this.state = TRANSITION_STATE.DESTROYED;
  }
}
