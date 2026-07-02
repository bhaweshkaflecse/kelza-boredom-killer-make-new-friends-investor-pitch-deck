/**
 * UniverseLayerManager
 * Central registry for all environmental and content layers.
 * Architecture for future layers (Earth, Phone, Marketplace, AI,
 * Infrastructure, Glass UI, Typography) to plug into.
 * Currently only environment layers register.
 */

import { MANAGER_STATES } from '../../config/constants.js';

/**
 * Layer category constants.
 */
export const LAYER_CATEGORIES = Object.freeze({
  ENVIRONMENT: 'environment',
  CONTENT: 'content',
  UI: 'ui'
});

/**
 * Future layer identifiers (architecture only, not implemented).
 */
export const FUTURE_LAYERS = Object.freeze({
  EARTH: 'earth',
  PHONE: 'phone',
  MARKETPLACE: 'marketplace',
  AI: 'ai',
  INFRASTRUCTURE: 'infrastructure',
  GLASS_UI: 'glassUI',
  TYPOGRAPHY: 'typography'
});

export class UniverseLayerManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.layers = new Map();
    this.sortedIds = [];
  }

  /**
   * Initialize the layer manager.
   */
  init() {
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Register a layer with the manager.
   * @param {Object} config - Layer configuration
   * @param {string} config.id - Unique layer identifier
   * @param {number} config.zIndex - Layer z-order
   * @param {string} config.category - Layer category (environment, content, ui)
   * @param {Function|null} config.renderFn - Render function
   * @param {Function|null} config.updateFn - Update function
   * @param {boolean} config.active - Whether layer is active
   */
  registerLayer(config) {
    this.layers.set(config.id, {
      id: config.id,
      zIndex: config.zIndex,
      category: config.category,
      renderFn: config.renderFn || null,
      updateFn: config.updateFn || null,
      active: config.active !== undefined ? config.active : true
    });
    this.rebuildSortOrder();
  }

  /**
   * Unregister a layer by id.
   * @param {string} id - Layer identifier
   */
  unregisterLayer(id) {
    this.layers.delete(id);
    this.rebuildSortOrder();
  }

  /**
   * Set a layer's active state.
   * @param {string} id - Layer identifier
   * @param {boolean} active - Whether layer should be active
   */
  setLayerActive(id, active) {
    const layer = this.layers.get(id);
    if (layer) {
      layer.active = active;
    }
  }

  /**
   * Get all layers belonging to a specific category.
   * @param {string} category - Category to filter by
   * @returns {Object[]} Array of matching layer configurations
   */
  getLayersByCategory(category) {
    const result = [];
    for (const layer of this.layers.values()) {
      if (layer.category === category) {
        result.push(layer);
      }
    }
    return result;
  }

  /**
   * Get a layer by id.
   * @param {string} id - Layer identifier
   * @returns {Object|undefined} Layer configuration
   */
  getLayer(id) {
    return this.layers.get(id);
  }

  /**
   * Get all registered layer ids in z-order.
   * @returns {string[]} Sorted layer ids
   */
  getSortedIds() {
    return this.sortedIds;
  }

  /**
   * Rebuild the sorted id list after any registration change.
   */
  rebuildSortOrder() {
    this.sortedIds = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(l => l.id);
  }

  /**
   * Update all active layers with update functions.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    for (const id of this.sortedIds) {
      const layer = this.layers.get(id);
      if (layer && layer.active && layer.updateFn) {
        layer.updateFn(deltaTime, elapsedTime);
      }
    }
  }

  /**
   * Destroy the layer manager.
   */
  destroy() {
    this.layers.clear();
    this.sortedIds = [];
    this.state = MANAGER_STATES.DESTROYED;
  }
}
