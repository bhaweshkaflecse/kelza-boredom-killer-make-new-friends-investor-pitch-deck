/**
 * InfluenceGraph
 * Invisible graph data structure for tracking emerging relationships.
 * Pre-allocated node and edge pools. Zero per-frame allocations.
 * Reusable for future community, marketplace, trust, and AI systems.
 *
 * Only implements: Nodes, Candidate Edges, Influence Weight.
 * Connection Age and Relationship Strength tracked for future use.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const CONFIG = settings.scene005.network;

/**
 * Create a pre-allocated graph node.
 * @returns {Object} Node object
 */
function createNode() {
  return {
    particleIndex: -1,
    influenceWeight: 0,
    connectionAge: 0,
    active: false
  };
}

/**
 * Create a pre-allocated graph edge.
 * @returns {Object} Edge object
 */
function createEdge() {
  return {
    nodeA: -1,
    nodeB: -1,
    weight: 0,
    age: 0,
    active: false
  };
}

export class InfluenceGraph {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    /** @type {Object[]} Pre-allocated node pool */
    this.nodes = [];
    /** @type {Object[]} Pre-allocated edge pool */
    this.edges = [];
    this.nodeCount = 0;
    this.edgeCount = 0;
    this.maxNodes = CONFIG.maxNodes;
    this.maxEdges = CONFIG.maxEdges;
    this.influenceDecay = CONFIG.influenceDecay;
    this.edgeMaxAge = CONFIG.edgeMaxAge;
  }

  /**
   * Initialize the influence graph with pre-allocated pools.
   */
  init() {
    this.nodes.length = 0;
    this.edges.length = 0;

    for (let i = 0; i < this.maxNodes; i++) {
      this.nodes.push(createNode());
    }
    for (let i = 0; i < this.maxEdges; i++) {
      this.edges.push(createEdge());
    }

    this.nodeCount = 0;
    this.edgeCount = 0;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Add a node to the graph for a particle.
   * @param {number} particleIndex - Index of the particle in the pool
   * @returns {number} Node index or -1 if pool full
   */
  addNode(particleIndex) {
    if (this.nodeCount >= this.maxNodes) return -1;

    // Check if node already exists for this particle
    for (let i = 0; i < this.nodeCount; i++) {
      if (this.nodes[i].active && this.nodes[i].particleIndex === particleIndex) {
        return i;
      }
    }

    const node = this.nodes[this.nodeCount];
    node.particleIndex = particleIndex;
    node.influenceWeight = 0;
    node.connectionAge = 0;
    node.active = true;
    this.nodeCount++;
    return this.nodeCount - 1;
  }

  /**
   * Add an edge between two nodes.
   * @param {number} nodeA - First node index
   * @param {number} nodeB - Second node index
   * @param {number} weight - Initial edge weight (0-1)
   * @returns {number} Edge index or -1 if pool full
   */
  addEdge(nodeA, nodeB, weight) {
    if (nodeA < 0 || nodeB < 0) return -1;
    if (nodeA >= this.nodeCount || nodeB >= this.nodeCount) return -1;

    // Check if edge already exists
    for (let i = 0; i < this.edgeCount; i++) {
      const e = this.edges[i];
      if (!e.active) continue;
      if ((e.nodeA === nodeA && e.nodeB === nodeB) ||
          (e.nodeA === nodeB && e.nodeB === nodeA)) {
        e.weight = Math.max(e.weight, weight);
        return i;
      }
    }

    // Try to append if pool not fully consumed
    if (this.edgeCount < this.maxEdges) {
      const edge = this.edges[this.edgeCount];
      edge.nodeA = nodeA;
      edge.nodeB = nodeB;
      edge.weight = weight;
      edge.age = 0;
      edge.active = true;
      this.edgeCount++;
      return this.edgeCount - 1;
    }

    // Pool exhausted - scan for an inactive slot to reuse
    for (let i = 0; i < this.edgeCount; i++) {
      if (!this.edges[i].active) {
        const edge = this.edges[i];
        edge.nodeA = nodeA;
        edge.nodeB = nodeB;
        edge.weight = weight;
        edge.age = 0;
        edge.active = true;
        return i;
      }
    }

    return -1;
  }

  /**
   * Update edges: age them and decay weights. Deactivate expired edges.
   * @param {number} deltaTime - Frame delta in seconds
   */
  updateEdges(deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    const decayFactor = Math.pow(this.influenceDecay, deltaTime * 60);

    for (let i = 0; i < this.edgeCount; i++) {
      const edge = this.edges[i];
      if (!edge.active) continue;

      edge.age += deltaTime;
      edge.weight *= decayFactor;

      // Deactivate edges that have expired or lost all weight
      if (edge.age > this.edgeMaxAge || edge.weight < 0.001) {
        edge.active = false;
      }
    }
  }

  /**
   * Get the count of active nodes.
   * @returns {number}
   */
  getNodeCount() {
    let count = 0;
    for (let i = 0; i < this.nodeCount; i++) {
      if (this.nodes[i].active) count++;
    }
    return count;
  }

  /**
   * Get the count of active edges.
   * @returns {number}
   */
  getEdgeCount() {
    let count = 0;
    for (let i = 0; i < this.edgeCount; i++) {
      if (this.edges[i].active) count++;
    }
    return count;
  }

  /**
   * Get all active edges for a given node index.
   * Returns edge indices into the edges pool.
   * @param {number} nodeIndex - Node index to query
   * @param {Int32Array} resultBuffer - Pre-allocated buffer to write results
   * @returns {number} Number of edges found
   */
  getEdgesForNode(nodeIndex, resultBuffer) {
    let found = 0;
    const maxResults = resultBuffer.length;

    for (let i = 0; i < this.edgeCount && found < maxResults; i++) {
      const edge = this.edges[i];
      if (!edge.active) continue;
      if (edge.nodeA === nodeIndex || edge.nodeB === nodeIndex) {
        resultBuffer[found] = i;
        found++;
      }
    }
    return found;
  }

  /**
   * Destroy the graph and release all resources.
   */
  destroy() {
    this.nodes.length = 0;
    this.edges.length = 0;
    this.nodeCount = 0;
    this.edgeCount = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
