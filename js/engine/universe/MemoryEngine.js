/**
 * MemoryEngine
 * Transient environmental memory system with pre-allocated pool.
 * Stores, reinforces, and decays memories of spatial positions.
 * Noise-driven decay ensures memories never fade uniformly.
 *
 * Reusable for future AI recommendations, trust systems,
 * community memory, and marketplace reputation.
 *
 * Zero per-frame allocations. Object pooling throughout.
 */

import { Noise } from '../../utils/Noise.js';
import { clamp } from '../../utils/helpers.js';
import { settings } from '../../config/settings.js';

const CFG = settings.scene007.memory;

export class MemoryEngine {
  constructor() {
    this.pool = null;
    this.maxMemories = CFG.maxMemories;
    this.activeCount = 0;
    this.noise = null;
    this.width = 0;
    this.height = 0;
    this.elapsedTime = 0;

    // Pre-allocated result arrays
    this._strongestResult = [];
  }

  /**
   * Initialize the memory pool and noise generator.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Noise seed for decay variation
   */
  init(width, height, seed) {
    this.width = width;
    this.height = height;
    this.noise = new Noise(seed);
    this.elapsedTime = 0;
    this.activeCount = 0;

    this.pool = new Array(this.maxMemories);
    for (let i = 0; i < this.maxMemories; i++) {
      this.pool[i] = {
        x: 0,
        y: 0,
        strength: 0,
        age: 0,
        signature: 0,
        reinforceCount: 0,
        active: false
      };
    }

    this._strongestResult = new Array(this.maxMemories);
    for (let i = 0; i < this.maxMemories; i++) {
      this._strongestResult[i] = null;
    }
  }

  /**
   * Create a new memory at a position with a pattern signature.
   * Reuses an inactive slot or the weakest active memory.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} signature - Numeric hash of the pattern
   */
  createMemory(x, y, signature) {
    let slot = this.findInactiveSlot();
    if (slot === -1) {
      slot = this.findWeakestSlot();
    }

    const mem = this.pool[slot];
    mem.x = x;
    mem.y = y;
    mem.strength = CFG.formationThreshold;
    mem.age = 0;
    mem.signature = signature;
    mem.reinforceCount = 0;
    mem.active = true;

    this.recountActive();
  }

  /**
   * Reinforce an existing memory, increasing its strength.
   * @param {number} index - Pool index of the memory
   */
  reinforceMemory(index) {
    if (index < 0 || index >= this.maxMemories) return;
    const mem = this.pool[index];
    if (!mem.active) return;

    mem.strength = clamp(
      mem.strength + CFG.reinforceRate, 0, CFG.strengthTarget
    );
    mem.reinforceCount++;
  }

  /**
   * Update all active memories: noise-driven decay and age tracking.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    this.elapsedTime += deltaTime;

    for (let i = 0; i < this.maxMemories; i++) {
      const mem = this.pool[i];
      if (!mem.active) continue;

      mem.age += deltaTime;

      // Noise-driven decay variation so memories fade non-uniformly
      const noiseVal = this.noise.noise2D(
        i * 0.3, this.elapsedTime * 0.1
      );
      const decayVariation = 0.99 + noiseVal * 0.01;
      const effectiveDecay = CFG.decayRate * decayVariation;

      mem.strength *= effectiveDecay;

      // Cap strength at target
      if (mem.strength > CFG.strengthTarget) {
        mem.strength = CFG.strengthTarget;
      }

      // Deactivate faded memories
      if (mem.strength < 0.001) {
        mem.active = false;
      }
    }

    this.recountActive();
  }

  /**
   * Get the top N strongest active memories.
   * Returns pre-allocated array (do not store across frames).
   * @param {number} count - Number of memories to return
   * @returns {Object[]} Array of memory references (may contain nulls)
   */
  getStrongestMemories(count) {
    const limit = Math.min(count, this.maxMemories);

    // Reset result
    for (let i = 0; i < limit; i++) {
      this._strongestResult[i] = null;
    }

    // Simple insertion sort for small N
    let filled = 0;
    for (let i = 0; i < this.maxMemories; i++) {
      const mem = this.pool[i];
      if (!mem.active) continue;

      if (filled < limit) {
        this._strongestResult[filled] = mem;
        filled++;
        this.insertionSortResult(filled);
      } else if (mem.strength > this._strongestResult[limit - 1].strength) {
        this._strongestResult[limit - 1] = mem;
        this.insertionSortResult(limit);
      }
    }

    return this._strongestResult;
  }

  /**
   * Get average strength of all active memories (global MemoryStrength).
   * @returns {number} Average strength 0-strengthTarget
   */
  getMemoryStrength() {
    if (this.activeCount === 0) return 0;
    let total = 0;
    for (let i = 0; i < this.maxMemories; i++) {
      if (this.pool[i].active) {
        total += this.pool[i].strength;
      }
    }
    return total / this.activeCount;
  }

  /**
   * Resize the memory coordinate space.
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /** Destroy the memory engine and release references. */
  destroy() {
    this.pool = null;
    this.noise = null;
    this._strongestResult = null;
    this.activeCount = 0;
  }

  // --- Private helpers ---

  /** Find an inactive slot index, or -1 if all are active. */
  findInactiveSlot() {
    for (let i = 0; i < this.maxMemories; i++) {
      if (!this.pool[i].active) return i;
    }
    return -1;
  }

  /** Find the weakest active slot index. */
  findWeakestSlot() {
    let weakest = 0;
    let weakestStrength = Infinity;
    for (let i = 0; i < this.maxMemories; i++) {
      if (this.pool[i].strength < weakestStrength) {
        weakestStrength = this.pool[i].strength;
        weakest = i;
      }
    }
    return weakest;
  }

  /** Sort the result array descending by strength (insertion sort). */
  insertionSortResult(count) {
    for (let i = 1; i < count; i++) {
      const item = this._strongestResult[i];
      if (!item) continue;
      let j = i - 1;
      while (j >= 0 && this._strongestResult[j] &&
             this._strongestResult[j].strength < item.strength) {
        this._strongestResult[j + 1] = this._strongestResult[j];
        j--;
      }
      this._strongestResult[j + 1] = item;
    }
  }

  /** Recount active memories. */
  recountActive() {
    let count = 0;
    for (let i = 0; i < this.maxMemories; i++) {
      if (this.pool[i].active) count++;
    }
    this.activeCount = count;
  }
}
