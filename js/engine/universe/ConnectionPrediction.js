/**
 * ConnectionPrediction
 * Tracks nearest neighbors for each particle using spatial hashing.
 * Provides neighbor lookup APIs for future rendering systems.
 * Updates at a reduced frequency for performance. No rendering.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const SCENE002 = settings.scene002;
const CONN_CONFIG = SCENE002.connections;

export class ConnectionPrediction {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.maxNeighbors = CONN_CONFIG.maxNeighbors;
    this.updateInterval = CONN_CONFIG.updateInterval;
    this.gridCellSize = CONN_CONFIG.gridCellSize;
    this.maxDistance = CONN_CONFIG.maxDistance;
    this.maxDistanceSq = this.maxDistance * this.maxDistance;

    this.frameCounter = 0;
    this.maxParticles = 0;

    /** @type {Int32Array} Flat neighbor storage: maxParticles * maxNeighbors */
    this.neighborData = null;
    /** @type {Int32Array} Neighbor count per particle */
    this.neighborCounts = null;

    /** @type {Map<number, number[]>} Spatial hash grid */
    this.grid = new Map();
    /** @type {number[]} Pre-allocated cell indices list */
    this.cellIndices = [];

    /** @type {{indexA: number, indexB: number, distSq: number}[]} Candidate connections */
    this.candidates = [];
    this.candidateCount = 0;
    this.maxCandidates = 256;

    /** @type {{candidates: Array, count: number}} Pre-allocated result for getCandidateConnections */
    this.candidateResult = { candidates: null, count: 0 };
  }

  /**
   * Initialize the connection prediction system.
   * @param {number} maxParticles - Maximum particle pool size
   */
  init(maxParticles) {
    this.maxParticles = maxParticles;
    this.neighborData = new Int32Array(maxParticles * this.maxNeighbors);
    this.neighborCounts = new Int32Array(maxParticles);
    this.allocateCandidates();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Pre-allocate candidate connection objects.
   */
  allocateCandidates() {
    this.candidates = new Array(this.maxCandidates);
    for (let i = 0; i < this.maxCandidates; i++) {
      this.candidates[i] = { indexA: -1, indexB: -1, distSq: 0 };
    }
    this.candidateCount = 0;
    this.candidateResult.candidates = this.candidates;
    this.candidateResult.count = 0;
  }

  /**
   * Update neighbor tracking. Only runs every N frames.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Number of active particles
   */
  update(particles, activeCount) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.frameCounter++;
    if (this.frameCounter < this.updateInterval) return;
    this.frameCounter = 0;

    this.buildSpatialHash(particles, activeCount);
    this.findNeighbors(particles, activeCount);
  }

  /**
   * Build the spatial hash grid from active particles.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   */
  buildSpatialHash(particles, activeCount) {
    this.grid.clear();
    const cellSize = this.gridCellSize;

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      if (!p.active) continue;

      const cellKey = this.getCellKey(p.x, p.y, cellSize);
      let cell = this.grid.get(cellKey);
      if (!cell) {
        cell = [];
        this.grid.set(cellKey, cell);
      }
      cell.push(i);
    }
  }

  /**
   * Compute a spatial hash key from world position.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} cellSize - Grid cell size
   * @returns {number} Hash key
   */
  getCellKey(x, y, cellSize) {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    return cx * 73856093 + cy * 19349669;
  }

  /**
   * Find nearest neighbors for all active particles.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   */
  findNeighbors(particles, activeCount) {
    this.neighborCounts.fill(0);
    this.candidateCount = 0;
    const cellSize = this.gridCellSize;
    const maxN = this.maxNeighbors;
    const maxDistSq = this.maxDistanceSq;

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      if (!p.active) continue;

      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      let count = 0;
      const baseIdx = i * maxN;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = (cx + dx) * 73856093 + (cy + dy) * 19349669;
          const cell = this.grid.get(key);
          if (!cell) continue;

          for (let j = 0; j < cell.length; j++) {
            const ni = cell[j];
            if (ni === i) continue;

            const np = particles[ni];
            const ddx = np.x - p.x;
            const ddy = np.y - p.y;
            const distSq = ddx * ddx + ddy * ddy;

            if (distSq < maxDistSq && count < maxN) {
              this.neighborData[baseIdx + count] = ni;
              count++;
              this.addCandidate(i, ni, distSq);
            }
          }
        }
      }
      this.neighborCounts[i] = count;
    }
  }

  /**
   * Add a candidate connection pair.
   * @param {number} a - First particle index
   * @param {number} b - Second particle index
   * @param {number} distSq - Squared distance
   */
  addCandidate(a, b, distSq) {
    if (this.candidateCount >= this.maxCandidates) return;
    if (a > b) return; // avoid duplicates

    const candidate = this.candidates[this.candidateCount];
    candidate.indexA = a;
    candidate.indexB = b;
    candidate.distSq = distSq;
    this.candidateCount++;
  }

  /**
   * Get the neighbor indices for a given particle.
   * @param {number} particleIndex - Particle index
   * @returns {Int32Array} Slice view of neighbor indices
   */
  getNeighbors(particleIndex) {
    const count = this.neighborCounts[particleIndex] || 0;
    const baseIdx = particleIndex * this.maxNeighbors;
    return this.neighborData.subarray(baseIdx, baseIdx + count);
  }

  /**
   * Get all candidate connection pairs from the last update.
   * Returns the backing array and count to avoid per-frame allocations.
   * Consumers must only read indices [0, count).
   * @returns {{candidates: {indexA: number, indexB: number, distSq: number}[], count: number}}
   */
  getCandidateConnections() {
    this.candidateResult.candidates = this.candidates;
    this.candidateResult.count = this.candidateCount;
    return this.candidateResult;
  }

  /**
   * Destroy the connection prediction system and release resources.
   */
  destroy() {
    this.neighborData = null;
    this.neighborCounts = null;
    this.grid.clear();
    this.candidates = [];
    this.candidateCount = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
