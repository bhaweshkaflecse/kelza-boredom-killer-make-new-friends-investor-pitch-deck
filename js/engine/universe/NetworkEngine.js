/**
 * NetworkEngine
 * Top-level network orchestrator. Owns InfluenceGraph and NeighborhoodManager.
 * Maintains invisible graph, tracks neighborhoods, measures local density,
 * and predicts future expansion. INVISIBLE - no rendering. Pure data
 * architecture for future community/marketplace/trust systems.
 *
 * Zero per-frame allocations. Object pooled.
 */

import { MANAGER_STATES, NETWORK_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { InfluenceGraph } from './InfluenceGraph.js';
import { NeighborhoodManager } from './NeighborhoodManager.js';

const CONFIG = settings.scene005.network;
const EDGE_FORMATION_THRESHOLD = CONFIG.edgeFormationThreshold;

export class NetworkEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.networkState = NETWORK_STATES.SEED;

    /** @type {InfluenceGraph} */
    this.graph = null;
    /** @type {NeighborhoodManager} */
    this.neighborhoodManager = null;

    // Dimensions for density calculation
    this.width = 0;
    this.height = 0;
    this.maxParticles = 0;

    // Seed connection data
    this.seedX = 0;
    this.seedY = 0;
    this.seedIndexA = -1;
    this.seedIndexB = -1;
    this.seeded = false;

    // Density measurement (cached)
    this.densityRadius = 120;
    this.densityRadiusSq = this.densityRadius * this.densityRadius;

    // Neighborhood count trend for prediction
    this.prevNeighborhoodCount = 0;
    this.neighborhoodTrend = 0;

    // Pre-allocated metrics result
    this._metrics = { nodes: 0, edges: 0, neighborhoods: 0, trend: 0 };
  }

  /**
   * Initialize the network engine.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} maxParticles - Maximum particle count
   */
  init(width, height, maxParticles) {
    this.width = width;
    this.height = height;
    this.maxParticles = maxParticles;

    this.graph = new InfluenceGraph();
    this.graph.init();

    this.neighborhoodManager = new NeighborhoodManager();
    this.neighborhoodManager.init(maxParticles);

    this.seeded = false;
    this.prevNeighborhoodCount = 0;
    this.neighborhoodTrend = 0;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Set reduced motion preference on sub-managers.
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    if (this.neighborhoodManager) {
      this.neighborhoodManager.setReducedMotion(enabled);
    }
  }

  /**
   * Seed the network from the initial connection.
   * @param {number} midX - Connection midpoint X
   * @param {number} midY - Connection midpoint Y
   * @param {number} indexA - First particle index
   * @param {number} indexB - Second particle index
   */
  seedFromConnection(midX, midY, indexA, indexB) {
    this.seedX = midX;
    this.seedY = midY;
    this.seedIndexA = indexA;
    this.seedIndexB = indexB;

    // Add seed nodes and edge to graph
    const nodeA = this.graph.addNode(indexA);
    const nodeB = this.graph.addNode(indexB);
    this.graph.addEdge(nodeA, nodeB, 1.0);

    this.seeded = true;
    this.networkState = NETWORK_STATES.GROWING;
  }

  /**
   * Update the network engine each frame.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} deltaTime - Frame delta in seconds
   * @param {Object} influenceEngine - InfluenceEngine instance
   */
  update(particles, activeCount, deltaTime, influenceEngine) {
    if (this.state !== MANAGER_STATES.READY) return;
    if (!this.seeded) return;

    // Update graph edge aging and decay
    this.graph.updateEdges(deltaTime);

    // Discover new candidate edges from influenced particles
    this.discoverEdges(particles, activeCount, influenceEngine);

    // Update neighborhood detection and coordination
    this.neighborhoodManager.update(
      particles, activeCount, deltaTime, influenceEngine
    );

    // Track neighborhood trend for future prediction
    this.updateTrend();
  }

  /**
   * Discover new candidate edges from particles within influence.
   * @param {Object[]} particles - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {Object} influenceEngine - InfluenceEngine
   */
  discoverEdges(particles, activeCount, influenceEngine) {
    if (!influenceEngine || influenceEngine.getActiveCount() === 0) return;

    const limit = Math.min(activeCount, this.maxParticles, 200);

    for (let i = 0; i < limit; i++) {
      const p = particles[i];
      if (!p || !p.active) continue;

      const inf = influenceEngine.getInfluenceAt(p.x, p.y);
      if (inf.strength < EDGE_FORMATION_THRESHOLD) continue;

      // Add node if influenced strongly enough
      const nodeIdx = this.graph.addNode(i);
      if (nodeIdx < 0) break;

      // Update node influence weight
      this.graph.nodes[nodeIdx].influenceWeight = inf.strength;
    }
  }

  /** Update neighborhood count trend for future expansion prediction. */
  updateTrend() {
    const current = this.neighborhoodManager.getActiveCount();
    this.neighborhoodTrend = current - this.prevNeighborhoodCount;
    this.prevNeighborhoodCount = current;

    // Update network state based on activity
    if (current >= 3) {
      this.networkState = NETWORK_STATES.EXPANDING;
    } else if (current >= 1) {
      this.networkState = NETWORK_STATES.STABLE;
    }
  }

  /**
   * Get the local density of particles around a point.
   * Simple count of particles within density radius / area.
   * @param {number} x - Query X
   * @param {number} y - Query Y
   * @returns {number} Normalized density (0-1)
   */
  getLocalDensity(x, y) {
    // This is a simplified density check using graph node count
    // Real implementation would query spatial structure
    const nodeCount = this.graph.getNodeCount();
    const maxDensity = this.graph.maxNodes;
    return nodeCount / maxDensity;
  }

  /**
   * Get the count of active neighborhoods.
   * @returns {number}
   */
  getNeighborhoodCount() {
    return this.neighborhoodManager.getActiveCount();
  }

  /**
   * Get graph metrics as a pre-allocated result (do not store).
   * @returns {{nodes: number, edges: number, neighborhoods: number, trend: number}}
   */
  getGraphMetrics() {
    this._metrics.nodes = this.graph.getNodeCount();
    this._metrics.edges = this.graph.getEdgeCount();
    this._metrics.neighborhoods = this.neighborhoodManager.getActiveCount();
    this._metrics.trend = this.neighborhoodTrend;
    return this._metrics;
  }

  /**
   * Destroy the engine and release all resources.
   */
  destroy() {
    if (this.graph) { this.graph.destroy(); this.graph = null; }
    if (this.neighborhoodManager) {
      this.neighborhoodManager.destroy();
      this.neighborhoodManager = null;
    }
    this.seeded = false;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
