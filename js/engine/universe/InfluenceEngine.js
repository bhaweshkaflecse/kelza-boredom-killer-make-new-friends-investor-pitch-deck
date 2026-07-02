/**
 * InfluenceEngine
 * Reusable radial influence system. Connected relationships emit soft influence
 * fields that probabilistically affect nearby particle behavior.
 * Supports future influence types (conversation, creator, community, etc.)
 * but only 'connection' is active for Scene004.
 *
 * Zero per-frame allocations. Pre-allocated source pool and result object.
 */

import { MANAGER_STATES, INFLUENCE_TYPES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const CONFIG = settings.scene004.influence;
const MAX_SOURCES = CONFIG.maxSources;

/**
 * Create a single influence source object (pooled).
 * @returns {Object} Influence source
 */
function createSource() {
  return {
    x: 0,
    y: 0,
    radius: 0,
    maxRadius: CONFIG.radius,
    strength: 0,
    type: INFLUENCE_TYPES.CONNECTION,
    active: false,
    expansionProgress: 0
  };
}

export class InfluenceEngine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    /** @type {Object[]} Pre-allocated source pool */
    this.sources = [];
    this.sourceCount = 0;
    this.activeCount = 0;
    this.width = 0;
    this.height = 0;

    // Pre-allocated result object for getInfluenceAt - never create new ones
    this._result = { strength: 0, type: INFLUENCE_TYPES.CONNECTION };
  }

  /**
   * Initialize the influence engine.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  init(width, height) {
    this.width = width;
    this.height = height;

    // Pre-allocate source pool
    this.sources.length = 0;
    for (let i = 0; i < MAX_SOURCES; i++) {
      this.sources.push(createSource());
    }
    this.sourceCount = 0;
    this.activeCount = 0;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Add an influence source at the given position.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Influence type from INFLUENCE_TYPES
   * @param {number} strength - Influence strength (0-1)
   * @returns {number} Source index or -1 if pool is full
   */
  addSource(x, y, type, strength) {
    if (this.sourceCount >= MAX_SOURCES) return -1;

    const source = this.sources[this.sourceCount];
    source.x = x;
    source.y = y;
    source.radius = 0;
    source.maxRadius = CONFIG.radius;
    source.strength = strength;
    source.type = type;
    source.active = true;
    source.expansionProgress = 0;
    this.sourceCount++;
    this.activeCount++;
    return this.sourceCount - 1;
  }

  /**
   * Update all active sources - expand radius slowly over time.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    const expansionSpeed = CONFIG.expansionSpeed;
    const decayRate = CONFIG.decayRate;

    for (let i = 0; i < this.sourceCount; i++) {
      const source = this.sources[i];
      if (!source.active) continue;

      // Expand radius slowly toward maxRadius
      if (source.radius < source.maxRadius) {
        source.radius += expansionSpeed * deltaTime;
        if (source.radius > source.maxRadius) {
          source.radius = source.maxRadius;
        }
        source.expansionProgress = source.radius / source.maxRadius;
      }

      // Gentle decay once fully expanded
      if (source.radius >= source.maxRadius) {
        source.strength *= decayRate;
        if (source.strength < 0.001) {
          source.active = false;
          this.activeCount--;
        }
      }
    }
  }

  /**
   * Get the influence at a world position. Returns pre-allocated result.
   * Bilinear falloff from center of nearest active source.
   * @param {number} x - Query X
   * @param {number} y - Query Y
   * @returns {{strength: number, type: string}} Pre-allocated result (do not store)
   */
  getInfluenceAt(x, y) {
    this._result.strength = 0;
    this._result.type = INFLUENCE_TYPES.CONNECTION;

    let maxStr = 0;

    for (let i = 0; i < this.sourceCount; i++) {
      const source = this.sources[i];
      if (!source.active || source.radius < 1) continue;

      const dx = x - source.x;
      const dy = y - source.y;
      const distSq = dx * dx + dy * dy;
      const radiusSq = source.radius * source.radius;

      if (distSq >= radiusSq) continue;

      // Bilinear falloff: 1 at center, 0 at edge
      const dist = Math.sqrt(distSq);
      const falloff = 1 - (dist / source.radius);
      const str = source.strength * falloff * falloff;

      if (str > maxStr) {
        maxStr = str;
        this._result.type = source.type;
      }
    }

    this._result.strength = maxStr;
    return this._result;
  }

  /**
   * Get the number of active influence sources.
   * @returns {number}
   */
  getActiveCount() {
    return this.activeCount;
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
    this.sources.length = 0;
    this.sourceCount = 0;
    this.activeCount = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
