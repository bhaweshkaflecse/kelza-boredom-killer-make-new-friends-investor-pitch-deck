/**
 * PatternMemory
 * Records constellation arrangements and recalls them approximately.
 * Never returns identical patterns - noise modulation ensures organic recall.
 *
 * Pre-allocated pool with zero per-frame allocations.
 * Reusable for AI recommendations, trust patterns, and community memory.
 */

import { Noise } from '../../utils/Noise.js';
import { settings } from '../../config/settings.js';

const CFG = settings.scene007.patternMemory;

export class PatternMemory {
  constructor() {
    this.pool = null;
    this.maxPatterns = CFG.maxPatterns;
    this.activeCount = 0;
    this.noise = null;
    this.elapsedTime = 0;

    // Pre-allocated result for findSimilarPattern
    this._matchResult = { pattern: null, similarity: 0 };
    // Pre-allocated array for getRecallablePatterns
    this._recallable = [];
  }

  /**
   * Initialize the pattern memory pool.
   * @param {number} seed - Noise seed for approximation
   */
  init(seed) {
    this.noise = new Noise(seed);
    this.elapsedTime = 0;
    this.activeCount = 0;

    this.pool = new Array(this.maxPatterns);
    for (let i = 0; i < this.maxPatterns; i++) {
      this.pool[i] = {
        dx: 0,
        dy: 0,
        distance: 0,
        angle: 0,
        timestamp: 0,
        recallCount: 0,
        active: false
      };
    }

    this._recallable = new Array(this.maxPatterns);
    for (let i = 0; i < this.maxPatterns; i++) {
      this._recallable[i] = null;
    }
  }

  /**
   * Record a constellation arrangement as a relative pattern.
   * @param {Object[]} particles - Particle pool
   * @param {number} indexA - First particle index
   * @param {number} indexB - Second particle index
   */
  recordPattern(particles, indexA, indexB) {
    if (indexA < 0 || indexB < 0) return;
    const pA = particles[indexA];
    const pB = particles[indexB];
    if (!pA || !pB) return;

    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    let slot = this.findInactiveSlot();
    if (slot === -1) {
      slot = this.findOldestSlot();
    }

    const pattern = this.pool[slot];
    pattern.dx = dx;
    pattern.dy = dy;
    pattern.distance = distance;
    pattern.angle = angle;
    pattern.timestamp = this.elapsedTime;
    pattern.recallCount = 0;
    pattern.active = true;

    this.recountActive();
  }

  /**
   * Find a pattern similar to current arrangement. Returns approximate match.
   * Never identical due to noise modulation.
   * @param {Object[]} particles - Particle pool
   * @param {number} indexA - First particle index
   * @param {number} indexB - Second particle index
   * @returns {{pattern: Object|null, similarity: number}} Pre-allocated result
   */
  findSimilarPattern(particles, indexA, indexB) {
    this._matchResult.pattern = null;
    this._matchResult.similarity = 0;

    if (indexA < 0 || indexB < 0) return this._matchResult;
    const pA = particles[indexA];
    const pB = particles[indexB];
    if (!pA || !pB) return this._matchResult;

    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    let bestMatch = null;
    let bestSim = 0;

    for (let i = 0; i < this.maxPatterns; i++) {
      const pattern = this.pool[i];
      if (!pattern.active) continue;

      // Compare angle and distance similarity
      const angleDiff = Math.abs(angle - pattern.angle);
      const distRatio = distance > 0 ? pattern.distance / distance : 0;
      const angleSim = 1 - Math.min(angleDiff / Math.PI, 1);
      const distSim = 1 - Math.abs(1 - distRatio);
      const sim = (angleSim * 0.5 + distSim * 0.5);

      if (sim > CFG.matchThreshold && sim > bestSim) {
        bestSim = sim;
        bestMatch = pattern;
      }
    }

    if (bestMatch) {
      bestMatch.recallCount++;
      this._matchResult.pattern = bestMatch;
      this._matchResult.similarity = bestSim;
    }

    return this._matchResult;
  }

  /**
   * Get active patterns sorted by recall count (most recalled first).
   * Returns pre-allocated array. Do not store across frames.
   * @returns {Object[]} Array of pattern references (may contain nulls)
   */
  getRecallablePatterns() {
    let count = 0;
    for (let i = 0; i < this.maxPatterns; i++) {
      this._recallable[i] = null;
      if (this.pool[i].active) {
        this._recallable[count] = this.pool[i];
        count++;
      }
    }

    // Sort by recallCount descending (insertion sort, small N)
    for (let i = 1; i < count; i++) {
      const item = this._recallable[i];
      let j = i - 1;
      while (j >= 0 && this._recallable[j] &&
             this._recallable[j].recallCount < item.recallCount) {
        this._recallable[j + 1] = this._recallable[j];
        j--;
      }
      this._recallable[j + 1] = item;
    }

    return this._recallable;
  }

  /**
   * Get a recalled pattern with noise-modulated approximation.
   * Never returns exact original values.
   * @param {Object} pattern - Pattern from pool
   * @returns {{dx: number, dy: number}} Approximate direction (reuses pattern object fields)
   */
  getApproximateRecall(pattern) {
    if (!pattern) return { dx: 0, dy: 0 };

    const noiseX = this.noise.noise2D(
      pattern.angle * 2, this.elapsedTime * 0.2
    );
    const noiseY = this.noise.noise2D(
      this.elapsedTime * 0.2, pattern.angle * 2
    );

    const approx = CFG.approximationNoise;
    return {
      dx: pattern.dx + noiseX * pattern.distance * approx,
      dy: pattern.dy + noiseY * pattern.distance * approx
    };
  }

  /**
   * Advance internal time. Call each frame.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    this.elapsedTime += deltaTime;
  }

  /** Destroy the pattern memory and release references. */
  destroy() {
    this.pool = null;
    this.noise = null;
    this._recallable = null;
    this._matchResult = null;
    this.activeCount = 0;
  }

  // --- Private helpers ---

  /** Find an inactive slot index, or -1 if all are active. */
  findInactiveSlot() {
    for (let i = 0; i < this.maxPatterns; i++) {
      if (!this.pool[i].active) return i;
    }
    return -1;
  }

  /** Find the oldest active slot by timestamp. */
  findOldestSlot() {
    let oldest = 0;
    let oldestTime = Infinity;
    for (let i = 0; i < this.maxPatterns; i++) {
      if (this.pool[i].active && this.pool[i].timestamp < oldestTime) {
        oldestTime = this.pool[i].timestamp;
        oldest = i;
      }
    }
    return oldest;
  }

  /** Recount active patterns. */
  recountActive() {
    let count = 0;
    for (let i = 0; i < this.maxPatterns; i++) {
      if (this.pool[i].active) count++;
    }
    this.activeCount = count;
  }
}
