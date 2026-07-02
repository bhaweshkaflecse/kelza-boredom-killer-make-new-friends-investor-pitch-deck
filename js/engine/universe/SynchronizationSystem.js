/**
 * SynchronizationSystem
 * Detects small groups (2-4 particles) near each other within influence regions
 * and temporarily synchronizes their velocities. Groups form and diverge subtly.
 * Should almost never be consciously noticed by the viewer.
 *
 * Uses pre-allocated Int32Array groups. Object-pooled. Zero per-frame allocations.
 * Runs at reduced frequency (every N frames from settings).
 *
 * Reduced motion: applies opacity variation instead of movement sync.
 */

import { MANAGER_STATES, SYNC_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const CONFIG = settings.scene004.synchronization;
const MAX_GROUPS = CONFIG.maxGroups;
const GROUP_SIZE = CONFIG.groupSize;
const DETECTION_RADIUS_SQ = CONFIG.detectionRadius * CONFIG.detectionRadius;
const UPDATE_INTERVAL = CONFIG.updateInterval;

/**
 * Create a pre-allocated sync group.
 * @returns {Object} Sync group state
 */
function createGroup() {
  return {
    particleIndices: new Int32Array(GROUP_SIZE),
    count: 0,
    syncTimer: 0,
    phase: SYNC_STATES.INDEPENDENT,
    active: false,
    avgVx: 0,
    avgVy: 0
  };
}

export class SynchronizationSystem {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    /** @type {Object[]} Pre-allocated group pool */
    this.groups = [];
    this.activeGroupCount = 0;
    this.frameCounter = 0;
    this.maxParticles = 0;
    this.reducedMotion = false;
    this.syncStrength = CONFIG.syncStrength;
    this.syncDuration = CONFIG.syncDuration;
    this.divergeDuration = CONFIG.divergeDuration;
  }

  /**
   * Initialize the synchronization system.
   * @param {number} maxParticles - Maximum particle count for bounds checks
   */
  init(maxParticles) {
    this.maxParticles = maxParticles;
    this.groups.length = 0;
    for (let i = 0; i < MAX_GROUPS; i++) {
      this.groups.push(createGroup());
    }
    this.activeGroupCount = 0;
    this.frameCounter = 0;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Set reduced motion preference.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
  }

  /**
   * Update the synchronization system. Runs detection at reduced frequency.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} deltaTime - Frame delta in seconds
   * @param {Object} influenceEngine - InfluenceEngine for region checks
   */
  update(particles, activeCount, deltaTime, influenceEngine) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.frameCounter++;

    // Run detection at reduced frequency
    if (this.frameCounter >= UPDATE_INTERVAL) {
      this.frameCounter = 0;
      this.detectGroups(particles, activeCount, influenceEngine);
    }

    // Always update active groups
    this.updateGroups(particles, deltaTime);
  }

  /**
   * Detect potential synchronization groups within influence regions.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {Object} influenceEngine - InfluenceEngine for region checks
   */
  detectGroups(particles, activeCount, influenceEngine) {
    if (!influenceEngine || influenceEngine.getActiveCount() === 0) return;

    // Find an inactive group slot
    let freeSlot = -1;
    for (let g = 0; g < MAX_GROUPS; g++) {
      if (!this.groups[g].active) {
        freeSlot = g;
        break;
      }
    }
    if (freeSlot === -1) return;

    // Search for a cluster of nearby particles inside influence
    const limit = Math.min(activeCount, this.maxParticles);
    for (let i = 0; i < limit; i++) {
      const p = particles[i];
      if (!p.active) continue;

      const inf = influenceEngine.getInfluenceAt(p.x, p.y);
      if (inf.strength < 0.03) continue;

      // Try to form a group around this particle
      const group = this.groups[freeSlot];
      group.particleIndices[0] = i;
      group.count = 1;

      for (let j = i + 1; j < limit && group.count < GROUP_SIZE; j++) {
        const q = particles[j];
        if (!q.active) continue;

        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < DETECTION_RADIUS_SQ) {
          group.particleIndices[group.count] = j;
          group.count++;
        }
      }

      // Require at least 2 particles for a group
      if (group.count >= 2) {
        group.active = true;
        group.phase = SYNC_STATES.SYNCHRONIZING;
        group.syncTimer = 0;
        group.avgVx = 0;
        group.avgVy = 0;
        this.activeGroupCount++;
        return; // Only form one group per detection cycle
      }
    }
  }

  /**
   * Update all active sync groups - lerp velocities or diverge.
   * @param {Object[]} particles - Particle pool
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateGroups(particles, deltaTime) {
    for (let g = 0; g < MAX_GROUPS; g++) {
      const group = this.groups[g];
      if (!group.active) continue;

      group.syncTimer += deltaTime;

      if (group.phase === SYNC_STATES.SYNCHRONIZING) {
        if (group.syncTimer >= this.syncDuration) {
          group.phase = SYNC_STATES.DIVERGING;
          group.syncTimer = 0;
          continue;
        }
        this.applySynchronization(group, particles, deltaTime);
      } else if (group.phase === SYNC_STATES.DIVERGING) {
        if (group.syncTimer >= this.divergeDuration) {
          group.active = false;
          group.count = 0;
          this.activeGroupCount--;
        }
      }
    }
  }

  /**
   * Gently lerp group particle velocities toward the group average.
   * @param {Object} group - Sync group
   * @param {Object[]} particles - Particle pool
   * @param {number} deltaTime - Frame delta in seconds
   */
  applySynchronization(group, particles, deltaTime) {
    // Compute average velocity
    let sumVx = 0;
    let sumVy = 0;
    let validCount = 0;

    for (let i = 0; i < group.count; i++) {
      const idx = group.particleIndices[i];
      const p = particles[idx];
      if (!p || !p.active) continue;
      sumVx += p.vx;
      sumVy += p.vy;
      validCount++;
    }

    if (validCount < 2) {
      group.active = false;
      group.count = 0;
      this.activeGroupCount--;
      return;
    }

    group.avgVx = sumVx / validCount;
    group.avgVy = sumVy / validCount;

    const strength = this.syncStrength * deltaTime;

    // Apply gentle velocity alignment
    for (let i = 0; i < group.count; i++) {
      const idx = group.particleIndices[i];
      const p = particles[idx];
      if (!p || !p.active) continue;

      if (this.reducedMotion) {
        // Reduced motion: only slight alpha variation
        p.alpha = Math.min(1, p.alpha + strength * 0.5);
      } else {
        // Normal: gentle velocity lerp toward average
        p.vx += (group.avgVx - p.vx) * strength;
        p.vy += (group.avgVy - p.vy) * strength;
      }
    }
  }

  /**
   * Get the count of currently active synchronization groups.
   * @returns {number}
   */
  getActiveGroupCount() {
    return this.activeGroupCount;
  }

  /**
   * Destroy the system and release all resources.
   */
  destroy() {
    this.groups.length = 0;
    this.activeGroupCount = 0;
    this.frameCounter = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
