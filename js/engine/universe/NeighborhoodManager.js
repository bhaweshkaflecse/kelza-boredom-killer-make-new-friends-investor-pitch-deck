/**
 * NeighborhoodManager
 * Detects small groups (2-6 particles) behaving similarly within influence
 * regions. Neighborhoods form, align, coordinate, then disperse naturally.
 * No visible labels, circles, or highlighting - just coordinated intent.
 *
 * Uses spatial hashing (like ClusterDetection pattern).
 * Pre-allocated neighborhood pool. Zero per-frame allocations.
 * Runs at reduced frequency (every N frames from settings).
 *
 * Reduced motion: skip velocity alignment, use opacity coordination instead.
 */

import { MANAGER_STATES, NEIGHBORHOOD_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const CONFIG = settings.scene005.neighborhood;
const MAX_NEIGHBORHOODS = CONFIG.maxNeighborhoods;
const ALIGNMENT_RADIUS = CONFIG.alignmentRadius;
const ALIGNMENT_RADIUS_SQ = ALIGNMENT_RADIUS * ALIGNMENT_RADIUS;
const COORDINATION_THRESHOLD = CONFIG.coordinationThreshold;
const DISPERSE_TIMEOUT = CONFIG.disperseTimeout;
const UPDATE_INTERVAL = CONFIG.updateInterval;
const MAX_PARTICLES_PER_NEIGHBORHOOD = 8;

const SPATIAL_HASH_PRIME_A = 73856093;
const SPATIAL_HASH_PRIME_B = 19349669;

/**
 * Create a pre-allocated neighborhood object.
 * @returns {Object} Neighborhood state
 */
function createNeighborhood() {
  return {
    particleIndices: new Int32Array(MAX_PARTICLES_PER_NEIGHBORHOOD),
    count: 0,
    state: NEIGHBORHOOD_STATES.FORMING,
    timer: 0,
    avgVx: 0,
    avgVy: 0,
    active: false
  };
}

export class NeighborhoodManager {
  constructor() {
    this.managerState = MANAGER_STATES.UNINITIALIZED;
    /** @type {Object[]} Pre-allocated neighborhood pool */
    this.neighborhoods = [];
    this.activeCount = 0;
    this.frameCounter = 0;
    this.maxParticles = 0;
    this.reducedMotion = false;

    /** @type {Map<number, number[]>} Spatial hash grid */
    this.grid = new Map();
  }

  /**
   * Initialize the neighborhood manager.
   * @param {number} maxParticles - Maximum particle count for bounds checks
   */
  init(maxParticles) {
    this.maxParticles = maxParticles;
    this.neighborhoods.length = 0;

    for (let i = 0; i < MAX_NEIGHBORHOODS; i++) {
      this.neighborhoods.push(createNeighborhood());
    }

    this.activeCount = 0;
    this.frameCounter = 0;
    this.managerState = MANAGER_STATES.READY;
  }

  /**
   * Set reduced motion preference.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
  }

  /**
   * Update the neighborhood manager.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} deltaTime - Frame delta in seconds
   * @param {Object} influenceEngine - InfluenceEngine for region checks
   */
  update(particles, activeCount, deltaTime, influenceEngine) {
    if (this.managerState !== MANAGER_STATES.READY) return;

    this.frameCounter++;

    // Run detection at reduced frequency
    if (this.frameCounter >= UPDATE_INTERVAL) {
      this.frameCounter = 0;
      this.detectNeighborhoods(particles, activeCount, influenceEngine);
    }

    // Always update active neighborhoods
    this.updateNeighborhoods(particles, deltaTime);
  }

  /**
   * Detect potential neighborhoods within influence regions.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {Object} influenceEngine - InfluenceEngine for region checks
   */
  detectNeighborhoods(particles, activeCount, influenceEngine) {
    if (!influenceEngine || influenceEngine.getActiveCount() === 0) return;

    // Find an inactive neighborhood slot
    let freeSlot = -1;
    for (let i = 0; i < MAX_NEIGHBORHOODS; i++) {
      if (!this.neighborhoods[i].active) {
        freeSlot = i;
        break;
      }
    }
    if (freeSlot === -1) return;

    // Build spatial hash for proximity queries
    this.buildGrid(particles, activeCount);

    // Search for a group of nearby particles inside influence
    const limit = Math.min(activeCount, this.maxParticles);
    for (let i = 0; i < limit; i++) {
      const p = particles[i];
      if (!p.active) continue;

      const inf = influenceEngine.getInfluenceAt(p.x, p.y);
      if (inf.strength < COORDINATION_THRESHOLD) continue;

      // Try to form a neighborhood around this particle
      const hood = this.neighborhoods[freeSlot];
      hood.particleIndices[0] = i;
      hood.count = 1;

      const cx = Math.floor(p.x / ALIGNMENT_RADIUS);
      const cy = Math.floor(p.y / ALIGNMENT_RADIUS);

      this.findNeighbors(cx, cy, i, p, particles, hood);

      // Require at least 2 particles for a neighborhood
      if (hood.count >= 2) {
        hood.active = true;
        hood.state = NEIGHBORHOOD_STATES.FORMING;
        hood.timer = 0;
        hood.avgVx = 0;
        hood.avgVy = 0;
        this.activeCount++;
        return; // Only form one neighborhood per detection cycle
      }
    }
  }

  /**
   * Find neighboring particles within alignment radius.
   * @param {number} cx - Cell X of center particle
   * @param {number} cy - Cell Y of center particle
   * @param {number} centerIdx - Center particle index
   * @param {Object} centerP - Center particle
   * @param {Object[]} particles - Particle pool
   * @param {Object} hood - Neighborhood to populate
   */
  findNeighbors(cx, cy, centerIdx, centerP, particles, hood) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = (cx + dx) * SPATIAL_HASH_PRIME_A + (cy + dy) * SPATIAL_HASH_PRIME_B;
        const cell = this.grid.get(key);
        if (!cell) continue;

        for (let k = 0; k < cell.length; k++) {
          if (hood.count >= 6) return;
          const ni = cell[k];
          if (ni === centerIdx) continue;

          const np = particles[ni];
          const ddx = np.x - centerP.x;
          const ddy = np.y - centerP.y;
          if (ddx * ddx + ddy * ddy < ALIGNMENT_RADIUS_SQ) {
            hood.particleIndices[hood.count] = ni;
            hood.count++;
          }
        }
      }
    }
  }

  /**
   * Build spatial hash grid for proximity queries.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active count
   */
  buildGrid(particles, activeCount) {
    this.grid.clear();
    const cellSize = ALIGNMENT_RADIUS;
    const limit = Math.min(activeCount, this.maxParticles);

    for (let i = 0; i < limit; i++) {
      const p = particles[i];
      if (!p.active) continue;

      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      const key = cx * SPATIAL_HASH_PRIME_A + cy * SPATIAL_HASH_PRIME_B;

      let cell = this.grid.get(key);
      if (!cell) {
        cell = [];
        this.grid.set(key, cell);
      }
      cell.push(i);
    }
  }

  /**
   * Update all active neighborhoods - transition through states.
   * @param {Object[]} particles - Particle pool
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateNeighborhoods(particles, deltaTime) {
    for (let i = 0; i < MAX_NEIGHBORHOODS; i++) {
      const hood = this.neighborhoods[i];
      if (!hood.active) continue;

      hood.timer += deltaTime;
      this.transitionNeighborhood(hood, particles, deltaTime);
    }
  }

  /**
   * Handle state transitions for a single neighborhood.
   * @param {Object} hood - Neighborhood object
   * @param {Object[]} particles - Particle pool
   * @param {number} deltaTime - Frame delta in seconds
   */
  transitionNeighborhood(hood, particles, deltaTime) {
    switch (hood.state) {
      case NEIGHBORHOOD_STATES.FORMING:
        if (hood.timer >= 1.0) {
          hood.state = NEIGHBORHOOD_STATES.ALIGNED;
          hood.timer = 0;
        }
        break;

      case NEIGHBORHOOD_STATES.ALIGNED:
        this.applyAlignment(hood, particles, deltaTime);
        if (hood.timer >= 2.0) {
          hood.state = NEIGHBORHOOD_STATES.COORDINATED;
          hood.timer = 0;
        }
        break;

      case NEIGHBORHOOD_STATES.COORDINATED:
        this.applyAlignment(hood, particles, deltaTime);
        if (hood.timer >= 3.0) {
          hood.state = NEIGHBORHOOD_STATES.DISPERSING;
          hood.timer = 0;
        }
        break;

      case NEIGHBORHOOD_STATES.DISPERSING:
        if (hood.timer >= DISPERSE_TIMEOUT) {
          hood.active = false;
          hood.count = 0;
          this.activeCount--;
        }
        break;
    }
  }

  /**
   * Apply gentle velocity alignment to neighborhood particles.
   * @param {Object} hood - Neighborhood object
   * @param {Object[]} particles - Particle pool
   * @param {number} deltaTime - Frame delta in seconds
   */
  applyAlignment(hood, particles, deltaTime) {
    let sumVx = 0;
    let sumVy = 0;
    let validCount = 0;

    for (let i = 0; i < hood.count; i++) {
      const idx = hood.particleIndices[i];
      const p = particles[idx];
      if (!p || !p.active) continue;
      sumVx += p.vx;
      sumVy += p.vy;
      validCount++;
    }

    if (validCount < 2) {
      hood.active = false;
      hood.count = 0;
      this.activeCount--;
      return;
    }

    hood.avgVx = sumVx / validCount;
    hood.avgVy = sumVy / validCount;

    const strength = 0.02 * deltaTime;

    for (let i = 0; i < hood.count; i++) {
      const idx = hood.particleIndices[i];
      const p = particles[idx];
      if (!p || !p.active) continue;

      if (this.reducedMotion) {
        // Reduced motion: only opacity coordination
        p.opacity = Math.min(p.targetOpacity, p.opacity + strength * 0.3);
      } else {
        // Normal: gentle velocity alignment
        p.vx += (hood.avgVx - p.vx) * strength;
        p.vy += (hood.avgVy - p.vy) * strength;
      }
    }
  }

  /**
   * Get the count of currently active neighborhoods.
   * @returns {number}
   */
  getActiveCount() {
    return this.activeCount;
  }

  /**
   * Destroy the manager and release all resources.
   */
  destroy() {
    this.neighborhoods.length = 0;
    this.activeCount = 0;
    this.frameCounter = 0;
    this.grid.clear();
    this.managerState = MANAGER_STATES.DESTROYED;
  }
}
