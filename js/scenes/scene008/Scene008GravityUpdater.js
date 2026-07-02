/**
 * Scene008GravityUpdater
 * Helper module for Scene008 gravity influence, recognition advancement,
 * and constellation alignment with gravitational composition.
 * Zero per-frame allocations. Follows Scene007MemoryUpdater pattern.
 */

import { settings } from '../../config/settings.js';

const SCENE008 = settings.scene008;
const CONFIDENCE_MAX = SCENE008.recognition.confidenceTarget; // 0.55
const CONFIDENCE_START = SCENE008.recognition.confidenceStart; // 0.35
const CONFIDENCE_RATE = SCENE008.recognition.confidenceRate;
const COHERENCE_THRESHOLD = SCENE008.recognition.coherenceThreshold;

// Module-level state for confidence tracking (avoids per-frame alloc)
let _currentConfidence = CONFIDENCE_START;
let _alignmentActive = false;
let _realizationActive = false;

/**
 * Reset module state. Call on scene enter.
 */
export function resetGravityState() {
  _currentConfidence = CONFIDENCE_START;
  _alignmentActive = false;
  _realizationActive = false;
}

/**
 * Set alignment mode active.
 */
export function activateAlignment() {
  _alignmentActive = true;
}

/**
 * Set realization mode active.
 */
export function activateRealization() {
  _realizationActive = true;
}

/**
 * Get the current confidence value managed by this updater.
 * @returns {number} Current confidence (0.35 to 0.55)
 */
export function getCurrentConfidence() {
  return _currentConfidence;
}

/**
 * Apply gravity center influence to particles and update the gravity system.
 * @param {Object} gravityCenter - GravityCenter instance
 * @param {Object[]} pool - Particle pool
 * @param {number} activeCount - Active particle count
 * @param {number} deltaTime - Frame delta in seconds
 */
export function updateGravityInfluence(gravityCenter, pool, activeCount, deltaTime) {
  if (!gravityCenter) return;
  gravityCenter.update(deltaTime);
  gravityCenter.applyToParticles(pool, activeCount, deltaTime, 1.0);
}

/**
 * Advance recognition confidence based on gravitational coherence.
 * Confidence advances from 0.35 toward 0.55, driven by rotational coherence.
 * Never exceeds 0.55.
 * @param {Object} gravityCenter - GravityCenter instance
 * @param {number} deltaTime - Frame delta in seconds
 * @param {number} progressMultiplier - Phase-based progress (0-1)
 * @returns {number} Updated confidence value
 */
export function advanceConfidence(gravityCenter, deltaTime, progressMultiplier) {
  if (!gravityCenter) return _currentConfidence;

  const coherence = gravityCenter.getRotationalCoherence();
  if (coherence < COHERENCE_THRESHOLD) return _currentConfidence;

  const advance = CONFIDENCE_RATE * coherence * progressMultiplier * deltaTime;
  _currentConfidence += advance;

  if (_currentConfidence > CONFIDENCE_MAX) {
    _currentConfidence = CONFIDENCE_MAX;
  }

  return _currentConfidence;
}

/**
 * Apply gravitational alignment to constellation hints.
 * Biases constellation positions toward the gravitational center.
 * @param {Object} constellationHints - ConstellationHints instance
 * @param {Object} gravityCenter - GravityCenter instance
 */
export function alignConstellations(constellationHints, gravityCenter) {
  if (!_alignmentActive || !constellationHints || !gravityCenter) return;

  const center = gravityCenter.getCenter();
  const coherence = gravityCenter.getRotationalCoherence();
  const weight = SCENE008.constellationAlignment.gravitationalWeight * coherence;

  if (constellationHints.biasTowardCenter) {
    constellationHints.biasTowardCenter(center.x, center.y, weight);
  }
}

/**
 * Apply motion reduction to particles based on negative space calming.
 * @param {Object[]} pool - Particle pool
 * @param {number} activeCount - Active particle count
 * @param {number} deltaTime - Frame delta in seconds
 * @param {number} reductionFactor - How much to reduce motion (0-1)
 */
export function applyMotionReduction(pool, activeCount, deltaTime, reductionFactor) {
  if (reductionFactor <= 0) return;

  const damping = 1 - reductionFactor * deltaTime;
  for (let i = 0; i < activeCount; i++) {
    const p = pool[i];
    if (!p || !p.active) continue;
    p.vx *= damping;
    p.vy *= damping;
  }
}

/**
 * Update camera composition toward gravity center.
 * Camera becomes almost still, observing the gravitational composition.
 * @param {Object} cameraController - CameraController reference
 * @param {Object} gravityCenter - GravityCenter instance
 * @param {number} canvasW - Canvas width
 * @param {number} canvasH - Canvas height
 * @param {boolean} reducedMotion - Whether reduced motion is active
 */
export function updateCameraComposition(
  cameraController, gravityCenter, canvasW, canvasH, reducedMotion
) {
  if (!cameraController || !gravityCenter) return;

  const center = gravityCenter.getCenter();
  const coherence = gravityCenter.getRotationalCoherence();
  const weight = SCENE008.camera.compositionWeight * coherence;
  const factor = reducedMotion ? SCENE008.camera.reducedMotionFactor : 1;

  const nx = ((center.x - canvasW * 0.5) / canvasW) * weight * factor;
  const ny = ((center.y - canvasH * 0.5) / canvasH) * weight * factor;

  cameraController.setTarget(nx * 5, ny * 5);
}
