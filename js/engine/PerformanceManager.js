/**
 * PerformanceManager
 * Monitors application performance, detects device capabilities,
 * and provides quality reduction recommendations.
 */

import { MANAGER_STATES, DEVICE_TIERS } from '../config/constants.js';
import { settings } from '../config/settings.js';

export class PerformanceManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.frameTimes = [];
    this.maxFrameSamples = 60;
    this.deviceTier = DEVICE_TIERS.HIGH;
    this.memoryInfo = null;
    this.qualityReduced = false;
  }

  /**
   * Initialize the performance manager and detect device capabilities.
   */
  init() {
    this.detectDeviceTier();
    this.lastFpsUpdate = performance.now();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Detect device capability tier based on hardware concurrency and memory.
   */
  detectDeviceTier() {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 4;
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile && cores <= 4) {
      this.deviceTier = DEVICE_TIERS.LOW;
    } else if (cores <= 4 || memory <= 4) {
      this.deviceTier = DEVICE_TIERS.MEDIUM;
    } else if (cores >= 8 && memory >= 8) {
      this.deviceTier = DEVICE_TIERS.ULTRA;
    } else {
      this.deviceTier = DEVICE_TIERS.HIGH;
    }
  }

  /**
   * Get the current frames per second.
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get memory usage information if available.
   * @returns {Object|null} Memory info with usedJSHeapSize and totalJSHeapSize
   */
  getMemory() {
    if (performance.memory) {
      return {
        usedMB: Math.round(performance.memory.usedJSHeapSize / 1048576),
        totalMB: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limitMB: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }

  /**
   * Determine if quality should be reduced based on current performance.
   * @returns {boolean} True if quality should be reduced
   */
  shouldReduceQuality() {
    return this.fps < settings.performance.fpsWarningThreshold || this.qualityReduced;
  }

  /**
   * Get the detected device performance tier.
   * @returns {string} Device tier identifier
   */
  getDeviceTier() {
    return this.deviceTier;
  }

  /**
   * Start monitoring a named metric.
   * @param {string} label - Metric label
   * @returns {Function} End function that returns elapsed time in ms
   */
  monitor(label) {
    const start = performance.now();
    return () => {
      const elapsed = performance.now() - start;
      return { label, elapsed };
    };
  }

  /**
   * Generate a performance report.
   * @returns {Object} Performance report data
   */
  report() {
    return {
      fps: this.fps,
      deviceTier: this.deviceTier,
      memory: this.getMemory(),
      qualityReduced: this.qualityReduced,
      averageFrameTime: this.getAverageFrameTime()
    };
  }

  /**
   * Calculate average frame time from samples.
   * @returns {number} Average frame time in ms
   */
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Update performance metrics - called each frame.
   * @param {number} _deltaTime - Time since last frame in seconds
   */
  update(_deltaTime) {
    const now = performance.now();

    this.frameCount++;
    this.frameTimes.push(now - this.lastFpsUpdate);

    if (this.frameTimes.length > this.maxFrameSamples) {
      this.frameTimes.shift();
    }

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      this.qualityReduced = this.fps < settings.performance.fpsWarningThreshold;
    }
  }

  /**
   * Destroy the performance manager.
   */
  destroy() {
    this.frameTimes = [];
    this.state = MANAGER_STATES.DESTROYED;
  }
}
