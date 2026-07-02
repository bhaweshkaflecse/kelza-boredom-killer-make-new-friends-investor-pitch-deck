/**
 * ConstellationHints
 * Renders max 4 extremely faint temporary filaments on the CONSTELLATIONS layer.
 * Uses ConnectionRenderer internally for each hint filament.
 * These are suggestions, not a network diagram.
 *
 * Constraints:
 *   - Max filaments: 4
 *   - Average visible: 1-2
 *   - Opacity NEVER exceeds 0.07 (below 8%)
 *   - Filaments vanish before the viewer fully notices
 *
 * Reduced motion: opacity fades only (no curve displacement).
 * Zero per-frame allocations. Pre-allocated hint pool.
 */

import { Noise } from '../../utils/Noise.js';
import { settings } from '../../config/settings.js';
import { clamp } from '../../utils/helpers.js';

const CONFIG = settings.scene005.constellationHints;
const MAX_FILAMENTS = CONFIG.maxFilaments;
const MAX_OPACITY = CONFIG.maxOpacity;
const FADE_IN_DURATION = CONFIG.fadeInDuration;
const FADE_OUT_DURATION = CONFIG.fadeOutDuration;
const MIN_LIFETIME = CONFIG.minLifetime;
const MAX_LIFETIME = CONFIG.maxLifetime;
const SPAWN_INTERVAL = CONFIG.spawnInterval;
const AVG_VISIBLE = CONFIG.avgVisible;

/**
 * Create a pre-allocated hint filament object.
 * @returns {Object} Hint filament state
 */
function createHint() {
  return {
    indexA: -1,
    indexB: -1,
    opacity: 0,
    targetOpacity: 0,
    lifetime: 0,
    maxLifetime: 0,
    active: false,
    fadePhase: 'in'
  };
}

export class ConstellationHints {
  constructor() {
    /** @type {Object[]} Pre-allocated hint pool */
    this.hints = [];
    this.noise = null;
    this.reducedMotion = false;
    this.mainIndexA = -1;
    this.mainIndexB = -1;
    this.spawnTimer = 0;
    this.activeCount = 0;

    // Pre-allocated bezier control point (reused in render)
    this.cpX = 0;
    this.cpY = 0;
    this.midX = 0;
    this.midY = 0;
    this.breathTime = 0;
  }

  /**
   * Initialize the constellation hints system.
   * @param {boolean} reducedMotion - Whether reduced motion is preferred
   * @param {number} mainIndexA - Main connection particle A index
   * @param {number} mainIndexB - Main connection particle B index
   */
  init(reducedMotion, mainIndexA, mainIndexB) {
    this.reducedMotion = reducedMotion;
    this.mainIndexA = mainIndexA;
    this.mainIndexB = mainIndexB;
    this.noise = new Noise(CONFIG.seed);
    this.spawnTimer = SPAWN_INTERVAL * 0.5; // Start partway through
    this.activeCount = 0;
    this.breathTime = 0;

    this.hints.length = 0;
    for (let i = 0; i < MAX_FILAMENTS; i++) {
      this.hints.push(createHint());
    }
  }

  /**
   * Update hint lifetimes, fading, and spawning logic.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed scene time
   * @param {Object} influenceGraph - InfluenceGraph instance
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   */
  update(deltaTime, elapsedTime, influenceGraph, particles, activeCount) {
    this.breathTime += deltaTime;
    this.updateActiveHints(deltaTime);
    this.updateSpawning(deltaTime, elapsedTime, influenceGraph, particles, activeCount);
  }

  /**
   * Update all active hint filaments (fading in/out).
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateActiveHints(deltaTime) {
    this.activeCount = 0;

    for (let i = 0; i < MAX_FILAMENTS; i++) {
      const hint = this.hints[i];
      if (!hint.active) continue;

      hint.lifetime += deltaTime;
      this.activeCount++;

      if (hint.fadePhase === 'in') {
        hint.opacity += (hint.targetOpacity / FADE_IN_DURATION) * deltaTime;
        if (hint.opacity >= hint.targetOpacity) {
          hint.opacity = hint.targetOpacity;
          hint.fadePhase = 'hold';
        }
      } else if (hint.fadePhase === 'hold') {
        // Check if it is time to fade out
        const fadeOutStart = hint.maxLifetime - FADE_OUT_DURATION;
        if (hint.lifetime >= fadeOutStart) {
          hint.fadePhase = 'out';
        }
      } else if (hint.fadePhase === 'out') {
        hint.opacity -= (hint.targetOpacity / FADE_OUT_DURATION) * deltaTime;
        if (hint.opacity <= 0) {
          hint.opacity = 0;
          hint.active = false;
          this.activeCount--;
        }
      }

      // Safety: deactivate if exceeded max lifetime
      if (hint.lifetime > hint.maxLifetime + 0.5) {
        hint.active = false;
        hint.opacity = 0;
      }
    }
  }

  /**
   * Handle spawning of new hint filaments.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed scene time
   * @param {Object} influenceGraph - InfluenceGraph instance
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   */
  updateSpawning(deltaTime, elapsedTime, influenceGraph, particles, activeCount) {
    // Only spawn if below average visible count
    if (this.activeCount >= AVG_VISIBLE) {
      this.spawnTimer = 0;
      return;
    }

    this.spawnTimer += deltaTime;

    // Noise-driven variation on spawn interval
    const variation = this.noise.noise2D(elapsedTime * 0.1, 50) * 1.5;
    const interval = SPAWN_INTERVAL + variation;

    if (this.spawnTimer < interval) return;
    this.spawnTimer = 0;

    this.spawnHint(influenceGraph, particles, activeCount, elapsedTime);
  }

  /**
   * Spawn a single hint filament from graph edges.
   * @param {Object} influenceGraph - InfluenceGraph instance
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} elapsedTime - Elapsed time for noise
   */
  spawnHint(influenceGraph, particles, activeCount, elapsedTime) {
    if (!influenceGraph || influenceGraph.getNodeCount() < 2) return;

    // Find a free hint slot
    let freeSlot = -1;
    for (let i = 0; i < MAX_FILAMENTS; i++) {
      if (!this.hints[i].active) {
        freeSlot = i;
        break;
      }
    }
    if (freeSlot === -1) return;

    // Pick two nodes that are NOT the main connection pair
    const pair = this.pickPair(influenceGraph, particles, activeCount, elapsedTime);
    if (!pair) return;

    const hint = this.hints[freeSlot];
    hint.indexA = pair.a;
    hint.indexB = pair.b;
    hint.opacity = 0;
    hint.targetOpacity = this.computeTargetOpacity(elapsedTime);
    hint.lifetime = 0;
    hint.maxLifetime = MIN_LIFETIME + Math.abs(
      this.noise.noise2D(elapsedTime * 0.3, 100)
    ) * (MAX_LIFETIME - MIN_LIFETIME);
    hint.active = true;
    hint.fadePhase = 'in';
  }

  /**
   * Pick two particle indices for a hint filament.
   * @param {Object} influenceGraph - InfluenceGraph instance
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} elapsedTime - Elapsed time
   * @returns {{a: number, b: number}|null} Particle indices or null
   */
  pickPair(influenceGraph, particles, activeCount, elapsedTime) {
    const nodeCount = influenceGraph.nodeCount;
    if (nodeCount < 2) return null;

    // Use noise to select starting node
    const noiseVal = Math.abs(this.noise.noise2D(elapsedTime * 0.5, 200));
    const startIdx = Math.floor(noiseVal * nodeCount) % nodeCount;

    for (let attempts = 0; attempts < 8; attempts++) {
      const nodeIdx = (startIdx + attempts) % nodeCount;
      const node = influenceGraph.nodes[nodeIdx];
      if (!node.active) continue;

      const idxA = node.particleIndex;
      if (idxA === this.mainIndexA || idxA === this.mainIndexB) continue;

      // Find another node nearby
      const nextIdx = (nodeIdx + 1 + attempts) % nodeCount;
      const nextNode = influenceGraph.nodes[nextIdx];
      if (!nextNode.active) continue;

      const idxB = nextNode.particleIndex;
      if (idxB === this.mainIndexA || idxB === this.mainIndexB) continue;
      if (idxA === idxB) continue;

      // Verify particles exist and are close enough
      const pA = particles[idxA];
      const pB = particles[idxB];
      if (!pA || !pB || !pA.active || !pB.active) continue;

      const dx = pB.x - pA.x;
      const dy = pB.y - pA.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 200 * 200) {
        return { a: idxA, b: idxB };
      }
    }

    return null;
  }

  /**
   * Compute target opacity for a new hint (always below MAX_OPACITY).
   * @param {number} elapsedTime - Elapsed time for noise variation
   * @returns {number} Target opacity
   */
  computeTargetOpacity(elapsedTime) {
    const variation = this.noise.noise2D(elapsedTime * 0.2, 300);
    // Range: 0.03 to MAX_OPACITY (0.07)
    return clamp(0.05 + variation * 0.02, 0.03, MAX_OPACITY);
  }

  /**
   * Render all active hint filaments.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object[]} particles - Particle pool
   * @param {number} deltaTime - Frame delta in seconds
   * @param {boolean} reducedMotion - Current reduced motion state
   */
  render(ctx, particles, deltaTime, reducedMotion) {
    for (let i = 0; i < MAX_FILAMENTS; i++) {
      const hint = this.hints[i];
      if (!hint.active || hint.opacity <= 0) continue;

      const pA = particles[hint.indexA];
      const pB = particles[hint.indexB];
      if (!pA || !pB || !pA.active || !pB.active) {
        hint.active = false;
        hint.opacity = 0;
        continue;
      }

      this.renderFilament(ctx, pA, pB, hint.opacity, reducedMotion);
    }
  }

  /**
   * Render a single faint filament between two particles.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} pA - First particle
   * @param {Object} pB - Second particle
   * @param {number} opacity - Current opacity
   * @param {boolean} reducedMotion - Reduced motion flag
   */
  renderFilament(ctx, pA, pB, opacity, reducedMotion) {
    const clamped = clamp(opacity, 0, MAX_OPACITY);
    if (clamped <= 0) return;

    this.midX = (pA.x + pB.x) * 0.5;
    this.midY = (pA.y + pB.y) * 0.5;

    if (reducedMotion) {
      this.cpX = this.midX;
      this.cpY = this.midY;
    } else {
      const n = this.noise.noise2D(
        this.midX * 0.01,
        this.midY * 0.01 + this.breathTime * 0.2
      );
      this.cpX = this.midX + n * 10;
      this.cpY = this.midY - n * 7;
    }

    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.quadraticCurveTo(this.cpX, this.cpY, pB.x, pB.y);
    ctx.strokeStyle = `rgba(255, 255, 255, ${clamped})`;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /**
   * Destroy the hints system and release resources.
   */
  destroy() {
    this.hints.length = 0;
    this.noise = null;
    this.activeCount = 0;
    this.spawnTimer = 0;
  }
}
