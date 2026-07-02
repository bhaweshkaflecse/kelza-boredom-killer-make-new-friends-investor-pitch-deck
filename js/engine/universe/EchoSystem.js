/**
 * EchoSystem
 * Occasionally triggers approximate repetition of previously observed
 * constellation arrangements. Timing is noise-modulated, never deterministic.
 *
 * Relies on MemoryEngine and PatternMemory for data.
 * Zero per-frame allocations. Pre-allocated result object.
 *
 * Reusable for recommendation echoes, trust reinforcement,
 * and conversation pattern recall in future scenes.
 */

import { Noise } from '../../utils/Noise.js';
import { clamp } from '../../utils/helpers.js';
import { settings } from '../../config/settings.js';

const CFG = settings.scene007.echo;

export class EchoSystem {
  constructor() {
    this.noise = null;
    this.memoryEngine = null;
    this.patternMemory = null;
    this.elapsedTime = 0;
    this.lastEchoTime = 0;
    this.nextEchoInterval = 0;
    this.echoActive = false;
    this.echoAge = 0;
    this.echoDuration = 3;
    this.echoCount = 0;

    // Pre-allocated result object for getActiveEcho
    this._echoResult = {
      targetX: 0,
      targetY: 0,
      strength: 0,
      patternDx: 0,
      patternDy: 0,
      active: false
    };
  }

  /**
   * Initialize the echo system.
   * @param {number} seed - Noise seed for timing modulation
   * @param {Object} memoryEngine - MemoryEngine instance
   * @param {Object} patternMemory - PatternMemory instance
   */
  init(seed, memoryEngine, patternMemory) {
    this.noise = new Noise(seed);
    this.memoryEngine = memoryEngine;
    this.patternMemory = patternMemory;
    this.elapsedTime = 0;
    this.lastEchoTime = 0;
    this.echoActive = false;
    this.echoAge = 0;
    this.echoCount = 0;
    this.nextEchoInterval = this.computeNextInterval();
  }

  /**
   * Update the echo system. Decides when to trigger echoes.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Scene elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    this.elapsedTime = elapsedTime;

    if (this.echoActive) {
      this.echoAge += deltaTime;
      if (this.echoAge >= this.echoDuration) {
        this.echoActive = false;
        this._echoResult.active = false;
      }
      return;
    }

    // Check if it is time for a new echo
    const timeSince = this.elapsedTime - this.lastEchoTime;
    if (timeSince >= this.nextEchoInterval) {
      this.tryTriggerEcho();
    }
  }

  /**
   * Get the current active echo target.
   * Returns pre-allocated result object. Do not store across frames.
   * @returns {{targetX: number, targetY: number, strength: number, patternDx: number, patternDy: number, active: boolean}}
   */
  getActiveEcho() {
    return this._echoResult;
  }

  /**
   * Whether an echo is currently active.
   * @returns {boolean}
   */
  isEchoActive() {
    return this.echoActive;
  }

  /** Destroy the echo system and release references. */
  destroy() {
    this.noise = null;
    this.memoryEngine = null;
    this.patternMemory = null;
    this._echoResult = null;
  }

  // --- Private helpers ---

  /** Attempt to trigger an echo from strongest memories. */
  tryTriggerEcho() {
    if (!this.memoryEngine || this.echoCount >= CFG.maxEchos) return;

    const memories = this.memoryEngine.getStrongestMemories(4);
    let target = null;

    for (let i = 0; i < 4; i++) {
      if (memories[i] && memories[i].active) {
        target = memories[i];
        break;
      }
    }

    if (!target) {
      // No memories to echo, defer
      this.lastEchoTime = this.elapsedTime;
      this.nextEchoInterval = this.computeNextInterval();
      return;
    }

    this.activateEcho(target);
  }

  /** Activate an echo toward a memory target with noise modulation. */
  activateEcho(memory) {
    const noiseX = this.noise.noise2D(
      this.elapsedTime * 0.15, memory.x * 0.01
    );
    const noiseY = this.noise.noise2D(
      memory.y * 0.01, this.elapsedTime * 0.15
    );

    const accuracy = CFG.recallAccuracy;
    const modulation = CFG.noiseModulation;

    this._echoResult.targetX = memory.x + noiseX * modulation * 100;
    this._echoResult.targetY = memory.y + noiseY * modulation * 100;
    this._echoResult.strength = memory.strength * accuracy;
    this._echoResult.patternDx = noiseX * modulation;
    this._echoResult.patternDy = noiseY * modulation;
    this._echoResult.active = true;

    this.echoActive = true;
    this.echoAge = 0;
    this.echoCount++;
    this.lastEchoTime = this.elapsedTime;
    this.nextEchoInterval = this.computeNextInterval();
  }

  /** Compute noise-modulated interval until next echo attempt. */
  computeNextInterval() {
    const mid = (CFG.minInterval + CFG.maxInterval) * 0.5;
    const range = (CFG.maxInterval - CFG.minInterval) * 0.5;
    const noiseVal = this.noise.noise2D(
      this.echoCount * 1.7, this.elapsedTime * 0.05
    );
    return clamp(mid + noiseVal * range, CFG.minInterval, CFG.maxInterval);
  }
}
