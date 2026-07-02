/**
 * ClusterDetection
 * Detects temporary particle clusters using spatial proximity.
 * Noise-driven thresholds make clusters appear, dissolve, and reform naturally.
 * Provides cluster data for other systems. No rendering.
 */

import { MANAGER_STATES, CLUSTER_EVENTS } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';

const SCENE002 = settings.scene002;
const CLUSTER_CONFIG = SCENE002.clusters;

const MAX_CLUSTERS = 32;
const SPATIAL_HASH_PRIME_A = 73856093;
const SPATIAL_HASH_PRIME_B = 19349669;

export class ClusterDetection {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = null;
    this.minSize = CLUSTER_CONFIG.minSize;
    this.maxSize = CLUSTER_CONFIG.maxSize;
    this.radius = CLUSTER_CONFIG.radius;
    this.radiusSq = this.radius * this.radius;
    this.updateInterval = CLUSTER_CONFIG.updateInterval;
    this.noiseSpeed = CLUSTER_CONFIG.noiseSpeed;
    this.thresholdMin = CLUSTER_CONFIG.thresholdMin;
    this.thresholdMax = CLUSTER_CONFIG.thresholdMax;

    this.frameCounter = 0;

    /** @type {Uint8Array} Pre-allocated visited array for flood-fill */
    this.visited = null;
    this.maxParticles = 0;

    /** @type {{centerX: number, centerY: number, particleIndices: number[], strength: number}[]} */
    this.clusters = [];
    this.clusterCount = 0;

    /** @type {Map<number, number[]>} Spatial hash grid */
    this.grid = new Map();

    /** @type {{type: string, clusterIndex: number}[]} Event queue */
    this.events = [];
    this.previousClusterCount = 0;
  }

  /**
   * Initialize the cluster detection system.
   * @param {number} [maxParticles=2048] - Maximum particle count for pre-allocating visited array
   */
  init(maxParticles = 2048) {
    this.noise = new Noise(CLUSTER_CONFIG.seed);
    this.maxParticles = maxParticles;
    this.visited = new Uint8Array(maxParticles);
    this.allocateClusters();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Pre-allocate cluster result objects and view.
   */
  allocateClusters() {
    this.clusters = new Array(MAX_CLUSTERS);
    for (let i = 0; i < MAX_CLUSTERS; i++) {
      this.clusters[i] = {
        centerX: 0,
        centerY: 0,
        particleIndices: [],
        strength: 0
      };
    }
    this.clusterCount = 0;
    /** @type {{clusters: Object[], count: number}} Pre-allocated view object */
    this._clusterView = { clusters: this.clusters, count: 0 };
  }

  /**
   * Update cluster detection. Runs every N frames.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Number of active particles
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(particles, activeCount, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.frameCounter++;
    if (this.frameCounter < this.updateInterval) return;
    this.frameCounter = 0;

    this.previousClusterCount = this.clusterCount;
    this.detectClusters(particles, activeCount, elapsedTime);
    this.emitEvents();
  }

  /**
   * Detect clusters from particle positions.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} elapsedTime - Elapsed time for noise
   */
  detectClusters(particles, activeCount, elapsedTime) {
    const threshold = this.getNoiseThreshold(elapsedTime);
    this.buildGrid(particles, activeCount);
    this.clusterCount = 0;

    // Reuse pre-allocated visited array, resizing only if needed
    if (activeCount > this.visited.length) {
      this.visited = new Uint8Array(activeCount);
    } else {
      this.visited.fill(0, 0, activeCount);
    }
    const visited = this.visited;
    const cellSize = this.radius;

    for (let i = 0; i < activeCount; i++) {
      if (visited[i]) continue;
      const p = particles[i];
      if (!p.active) continue;

      const group = this.floodFill(
        i, particles, activeCount, visited, cellSize, threshold
      );
      if (group.length >= this.minSize && group.length <= this.maxSize) {
        this.recordCluster(group, particles);
      }
      if (this.clusterCount >= MAX_CLUSTERS) break;
    }

    this._clusterView.count = this.clusterCount;
  }

  /**
   * Get the current noise-driven density threshold.
   * @param {number} elapsedTime - Elapsed time
   * @returns {number} Threshold value
   */
  getNoiseThreshold(elapsedTime) {
    const n = this.noise.noise2D(elapsedTime * this.noiseSpeed, 0);
    const normalized = (n + 1) * 0.5;
    return this.thresholdMin + normalized * (this.thresholdMax - this.thresholdMin);
  }

  /**
   * Build spatial hash grid for proximity queries.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active count
   */
  buildGrid(particles, activeCount) {
    this.grid.clear();
    const cellSize = this.radius;

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      if (!p.active) continue;

      const key = this.hashKey(p.x, p.y, cellSize);
      let cell = this.grid.get(key);
      if (!cell) {
        cell = [];
        this.grid.set(key, cell);
      }
      cell.push(i);
    }
  }

  /**
   * Flood-fill to find a connected group of nearby particles.
   * @param {number} startIdx - Starting particle index
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active count
   * @param {Uint8Array} visited - Visited flag array
   * @param {number} cellSize - Cell size for hashing
   * @param {number} threshold - Density threshold (unused currently, reserved)
   * @returns {number[]} Particle indices in the group
   */
  floodFill(startIdx, particles, activeCount, visited, cellSize, threshold) {
    const group = [startIdx];
    visited[startIdx] = 1;
    let head = 0;

    while (head < group.length && group.length < this.maxSize) {
      const idx = group[head++];
      const p = particles[idx];
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = (cx + dx) * SPATIAL_HASH_PRIME_A + (cy + dy) * SPATIAL_HASH_PRIME_B;
          const cell = this.grid.get(key);
          if (!cell) continue;

          for (let j = 0; j < cell.length; j++) {
            const ni = cell[j];
            if (visited[ni]) continue;
            const np = particles[ni];
            const ddx = np.x - p.x;
            const ddy = np.y - p.y;
            if (ddx * ddx + ddy * ddy < this.radiusSq) {
              visited[ni] = 1;
              group.push(ni);
              if (group.length >= this.maxSize) break;
            }
          }
          if (group.length >= this.maxSize) break;
        }
        if (group.length >= this.maxSize) break;
      }
    }

    return group;
  }

  /**
   * Record a detected cluster into the pre-allocated array.
   * @param {number[]} group - Particle indices
   * @param {Object[]} particles - Particle pool
   */
  recordCluster(group, particles) {
    if (this.clusterCount >= MAX_CLUSTERS) return;

    const cluster = this.clusters[this.clusterCount];
    cluster.particleIndices = group;
    cluster.strength = group.length / this.maxSize;

    let cx = 0;
    let cy = 0;
    for (let i = 0; i < group.length; i++) {
      cx += particles[group[i]].x;
      cy += particles[group[i]].y;
    }
    cluster.centerX = cx / group.length;
    cluster.centerY = cy / group.length;

    this.clusterCount++;
  }

  /**
   * Emit cluster lifecycle events.
   */
  emitEvents() {
    this.events.length = 0;

    if (this.clusterCount > this.previousClusterCount) {
      this.events.push({ type: CLUSTER_EVENTS.FORMED, clusterIndex: this.clusterCount - 1 });
    } else if (this.clusterCount < this.previousClusterCount) {
      this.events.push({ type: CLUSTER_EVENTS.DISSOLVED, clusterIndex: -1 });
    } else if (this.clusterCount > 0 && this.previousClusterCount > 0) {
      this.events.push({ type: CLUSTER_EVENTS.REFORMED, clusterIndex: 0 });
    }
  }

  /**
   * Compute spatial hash key.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} cellSize - Cell size
   * @returns {number} Hash key
   */
  hashKey(x, y, cellSize) {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    return cx * SPATIAL_HASH_PRIME_A + cy * SPATIAL_HASH_PRIME_B;
  }

  /**
   * Get the cluster array and count as a non-copying view.
   * Consumers must only iterate from 0 to clusterCount - 1.
   * @returns {{clusters: {centerX: number, centerY: number, particleIndices: number[], strength: number}[], count: number}}
   */
  getClusterView() {
    return this._clusterView;
  }

  /**
   * Get pending events since last update.
   * @returns {{type: string, clusterIndex: number}[]}
   */
  getEvents() {
    return this.events;
  }

  /**
   * Destroy the cluster detection system and release resources.
   */
  destroy() {
    this.grid.clear();
    this.clusters = [];
    this.clusterCount = 0;
    this.events = [];
    this.noise = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
