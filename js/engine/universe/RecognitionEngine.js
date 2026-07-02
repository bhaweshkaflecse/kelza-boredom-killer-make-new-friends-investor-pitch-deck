/**
 * RecognitionEngine
 * Evaluates overall network coherence and tracks RecognitionConfidence.
 * Controls recognition pacing so audience suspects but never knows.
 * Never exposes exact geometry. Future-ready for Earth emergence,
 * communities, marketplace, and trust systems.
 *
 * Zero per-frame allocations. Pre-allocated result objects.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { clamp } from '../../utils/helpers.js';

const CONFIG = settings.scene006.recognition;
const CONFIDENCE_TARGET = CONFIG.confidenceTarget;
const CONFIDENCE_RATE = CONFIG.confidenceRate;
const COHERENCE_THRESHOLD = CONFIG.coherenceThreshold;
const PACE_SPEED = CONFIG.paceSpeed;

export class RecognitionEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;

    // Core tracking values
    this.confidence = 0;
    this.coherence = 0;
    this.paceMultiplier = 1;

    // Noise-driven pacing
    this.noise = null;
    this.noiseTime = 0;

    // Dimensions
    this.width = 0;
    this.height = 0;

    // Internal accumulators (pre-allocated, no per-frame alloc)
    this._coherenceAccum = 0;
    this._prevNodes = 0;
    this._prevEdges = 0;
    this._stabilityTimer = 0;
  }

  /**
   * Initialize the recognition engine.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  init(width, height) {
    this.width = width;
    this.height = height;
    this.confidence = 0;
    this.coherence = 0;
    this.paceMultiplier = 1;
    this.noiseTime = 0;
    this._coherenceAccum = 0;
    this._prevNodes = 0;
    this._prevEdges = 0;
    this._stabilityTimer = 0;
    this.noise = new Noise(947);
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Update recognition confidence and coherence.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {{nodes: number, edges: number, neighborhoods: number, trend: number}} graphMetrics
   * @param {number} neighborhoodCount - Active neighborhoods
   */
  update(deltaTime, graphMetrics, neighborhoodCount) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.noiseTime += deltaTime * PACE_SPEED;

    this.updateCoherence(graphMetrics, neighborhoodCount);
    this.updatePacing(deltaTime);
    this.updateConfidence(deltaTime);
  }

  /**
   * Compute coherence from graph metrics.
   * @param {{nodes: number, edges: number, neighborhoods: number, trend: number}} metrics
   * @param {number} neighborhoodCount - Active neighborhoods
   */
  updateCoherence(metrics, neighborhoodCount) {
    const nodes = metrics.nodes;
    const edges = metrics.edges;

    // Coherence grows when the network becomes structured
    const connectivity = nodes > 0 ? edges / (nodes * 2) : 0;
    const neighborhoodFactor = neighborhoodCount * 0.15;

    // Stability: coherence increases when graph is growing steadily
    const growth = (nodes - this._prevNodes) + (edges - this._prevEdges) * 0.5;
    if (growth > 0) {
      this._stabilityTimer += 0.01;
    } else {
      this._stabilityTimer *= 0.98;
    }

    this._prevNodes = nodes;
    this._prevEdges = edges;

    // Blend connectivity, neighborhoods, and stability
    const raw = connectivity * 0.4 + neighborhoodFactor * 0.35
      + clamp(this._stabilityTimer, 0, 0.5) * 0.25;

    // Smooth coherence transitions (no sudden jumps)
    this.coherence += (clamp(raw, 0, 1) - this.coherence) * 0.02;
  }

  /**
   * Apply noise-driven pacing variation to prevent mechanical feel.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updatePacing(deltaTime) {
    // Noise creates organic hesitation and acceleration
    const paceNoise = this.noise.noise2D(this.noiseTime, 0);
    // Range 0.6 to 1.4 so recognition never feels constant
    this.paceMultiplier = 1 + paceNoise * 0.4;
  }

  /**
   * Advance confidence toward target based on coherence and pacing.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateConfidence(deltaTime) {
    // Only accumulate confidence when coherence exceeds threshold
    if (this.coherence < COHERENCE_THRESHOLD) return;

    const coherenceExcess = this.coherence - COHERENCE_THRESHOLD;
    const rate = CONFIDENCE_RATE * this.paceMultiplier * coherenceExcess;
    this.confidence += rate * deltaTime;

    // Clamp to target - never reach certainty
    if (this.confidence > CONFIDENCE_TARGET) {
      this.confidence = CONFIDENCE_TARGET;
    }
  }

  /**
   * Get the current recognition confidence (0 to ~0.35).
   * @returns {number}
   */
  getConfidence() {
    return this.confidence;
  }

  /**
   * Get the current network coherence (0 to 1).
   * @returns {number}
   */
  getCoherence() {
    return this.coherence;
  }

  /**
   * Get the current pace multiplier for other systems.
   * @returns {number}
   */
  getPaceMultiplier() {
    return this.paceMultiplier;
  }

  /**
   * Handle canvas resize.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Destroy the engine and release all resources.
   */
  destroy() {
    this.noise = null;
    this.confidence = 0;
    this.coherence = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
