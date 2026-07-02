/**
 * CameraController
 * Virtual 2D camera abstraction providing drift, parallax, and transform.
 * No Three.js. Coordinates other layers can query for positional offsets.
 * Movement is nearly invisible - slow noise-driven drift only.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { lerp } from '../../utils/helpers.js';

const CAMERA_NOISE_SEED = 99;
const DRIFT_SPEED = 0.02;
const DRIFT_AMPLITUDE_X = 3;
const DRIFT_AMPLITUDE_Y = 2;
const ROTATION_AMPLITUDE = 0.0005;
const ROTATION_SPEED = 0.015;
const ZOOM_BASE = 1;
const ZOOM_AMPLITUDE = 0.002;
const ZOOM_SPEED = 0.01;
const TARGET_LERP_SPEED = 2.0;
const REDUCED_MOTION_FACTOR = 0.2;
const CLUSTER_BIAS_STRENGTH = settings.scene002.cameraIntelligence.clusterBias;
const CLUSTER_BIAS_SPEED = settings.scene002.cameraIntelligence.biasSpeed;

export class CameraController {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = new Noise(CAMERA_NOISE_SEED);
    this.position = { x: 0, y: 0 };
    this.rotation = 0;
    this.zoom = ZOOM_BASE;
    this.targetPosition = { x: 0, y: 0 };
    this.driftOffset = { x: 0, y: 0 };
    this._parallaxResult = { x: 0, y: 0 };
    this.reducedMotion = false;
    this.motionFactor = 1;
    this.driftMultiplier = 1;
    this.clusterBiasX = 0;
    this.clusterBiasY = 0;
    this.hasClusterBias = false;
  }

  /**
   * Initialize the camera controller.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   */
  init(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    this.driftMultiplier = 1;
    this.motionFactor = reducedMotion ? REDUCED_MOTION_FACTOR : 1;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Update camera drift and parameters each frame.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time from TimeEngine
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.updateDrift(elapsedTime);
    this.updateRotation(elapsedTime);
    this.updateZoom(elapsedTime);
    this.updateTargetLerp(deltaTime);
  }

  /**
   * Update noise-driven positional drift.
   * @param {number} elapsedTime - Elapsed time in seconds
   */
  updateDrift(elapsedTime) {
    const t = elapsedTime * DRIFT_SPEED * this.motionFactor;
    const nx = this.noise.noise2D(t, 0);
    const ny = this.noise.noise2D(0, t * 1.3);

    this.driftOffset.x = nx * DRIFT_AMPLITUDE_X * this.motionFactor;
    this.driftOffset.y = ny * DRIFT_AMPLITUDE_Y * this.motionFactor;

    this.position.x = this.targetPosition.x + this.driftOffset.x;
    this.position.y = this.targetPosition.y + this.driftOffset.y;
  }

  /**
   * Update noise-driven rotation.
   * @param {number} elapsedTime - Elapsed time in seconds
   */
  updateRotation(elapsedTime) {
    const t = elapsedTime * ROTATION_SPEED * this.motionFactor;
    this.rotation = this.noise.noise2D(t, t * 0.7) * ROTATION_AMPLITUDE * this.motionFactor;
  }

  /**
   * Update noise-driven zoom.
   * @param {number} elapsedTime - Elapsed time in seconds
   */
  updateZoom(elapsedTime) {
    const t = elapsedTime * ZOOM_SPEED * this.motionFactor;
    const nz = this.noise.noise2D(t * 0.5, t * 0.8);
    this.zoom = ZOOM_BASE + nz * ZOOM_AMPLITUDE * this.motionFactor;
  }

  /**
   * Smoothly lerp toward a target position, incorporating cluster bias.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateTargetLerp(deltaTime) {
    const baseX = this.hasClusterBias ? this.clusterBiasX : 0;
    const baseY = this.hasClusterBias ? this.clusterBiasY : 0;
    const lerpFactor = Math.min(1, TARGET_LERP_SPEED * deltaTime);
    this.targetPosition.x = lerp(this.targetPosition.x, baseX, lerpFactor);
    this.targetPosition.y = lerp(this.targetPosition.y, baseY, lerpFactor);
  }

  /**
   * Get the current camera transform for rendering.
   * @returns {{x: number, y: number, rotation: number, zoom: number}}
   */
  getTransform() {
    return {
      x: this.position.x,
      y: this.position.y,
      rotation: this.rotation,
      zoom: this.zoom
    };
  }

  /**
   * Get parallax offset for a given depth layer.
   * Returns a pre-allocated object - do not store the reference across frames.
   * @param {number} depth - Depth value (0 = closest, higher = further)
   * @returns {{x: number, y: number}} Parallax offset (reused object)
   */
  getParallaxOffset(depth) {
    const factor = depth * 0.15 * this.motionFactor;
    this._parallaxResult.x = this.driftOffset.x * factor;
    this._parallaxResult.y = this.driftOffset.y * factor;
    return this._parallaxResult;
  }

  /**
   * Set a target position for the camera to drift toward.
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  setTarget(x, y) {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
  }

  /**
   * Reset camera to center position.
   */
  reset() {
    this.position.x = 0;
    this.position.y = 0;
    this.targetPosition.x = 0;
    this.targetPosition.y = 0;
    this.driftOffset.x = 0;
    this.driftOffset.y = 0;
    this.rotation = 0;
    this.zoom = ZOOM_BASE;
  }

  /**
   * Set reduced motion preference.
   * Composes with driftMultiplier so accessibility override is never lost.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
    this.motionFactor = enabled
      ? REDUCED_MOTION_FACTOR * this.driftMultiplier
      : this.driftMultiplier;
  }

  /**
   * Set the drift multiplier to control camera motion intensity.
   * Used by scenes to progressively reduce movement.
   * Composes with reduced-motion setting so accessibility is never overwritten.
   * @param {number} value - Drift factor (0 = no motion, 1 = full motion)
   */
  setDriftMultiplier(value) {
    this.driftMultiplier = Math.min(Math.max(value, 0), 1);
    this.motionFactor = this.reducedMotion
      ? REDUCED_MOTION_FACTOR * this.driftMultiplier
      : this.driftMultiplier;
  }

  /**
   * Set cluster bias - gently bias camera drift toward the weighted center
   * of current particle clusters. Extremely subtle; visitors should never
   * consciously notice the bias.
   * @param {{centerX: number, centerY: number, strength: number}[]} clusters - Active clusters
   * @param {number} count - Number of valid clusters in the array
   * @param {number} canvasWidth - Canvas width for normalization
   * @param {number} canvasHeight - Canvas height for normalization
   */
  setClusterBias(clusters, count, canvasWidth, canvasHeight) {
    if (!clusters || count === 0) {
      this.clearClusterBias();
      return;
    }

    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    for (let i = 0; i < count; i++) {
      const cluster = clusters[i];
      const w = cluster.strength;
      weightedX += cluster.centerX * w;
      weightedY += cluster.centerY * w;
      totalWeight += w;
    }

    if (totalWeight > 0) {
      // Normalize relative to canvas center so bias is in -1..1 range
      const cx = (weightedX / totalWeight - canvasWidth * 0.5) / (canvasWidth * 0.5);
      const cy = (weightedY / totalWeight - canvasHeight * 0.5) / (canvasHeight * 0.5);
      // Scale to a maximum of DRIFT_AMPLITUDE_X/Y pixels of bias
      this.clusterBiasX = cx * CLUSTER_BIAS_STRENGTH * DRIFT_AMPLITUDE_X;
      this.clusterBiasY = cy * CLUSTER_BIAS_STRENGTH * DRIFT_AMPLITUDE_Y;
      this.hasClusterBias = true;
    }
  }

  /**
   * Clear the cluster bias and return camera to normal center drift.
   */
  clearClusterBias() {
    this.clusterBiasX = 0;
    this.clusterBiasY = 0;
    this.hasClusterBias = false;
  }

  /**
   * Destroy the camera controller.
   */
  destroy() {
    this.reset();
    this.clearClusterBias();
    this.state = MANAGER_STATES.DESTROYED;
  }
}
