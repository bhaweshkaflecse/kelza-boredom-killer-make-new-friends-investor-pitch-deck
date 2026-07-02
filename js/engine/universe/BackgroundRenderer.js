/**
 * BackgroundRenderer
 * Multi-layer background composition system.
 * Manages independent layers (deepSpace, gradients, ambientLighting,
 * particleField, depthFog, constellations, sceneOverlays) and
 * composites them in z-order.
 */

import { MANAGER_STATES, UNIVERSE_LAYERS } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

export class BackgroundRenderer {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.layers = new Map();
    this.sortedLayers = [];
    this.width = 0;
    this.height = 0;
  }

  /**
   * Initialize the background renderer with canvas dimensions.
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  init(width, height) {
    this.width = width;
    this.height = height;
    this.setupDefaultLayers();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Set up default layer slots based on UNIVERSE_LAYERS constants.
   */
  setupDefaultLayers() {
    this.addLayer({
      id: UNIVERSE_LAYERS.DEEP_SPACE,
      zIndex: 0,
      opacity: 1,
      active: true,
      render: this.renderDeepSpace.bind(this)
    });

    this.addLayer({
      id: UNIVERSE_LAYERS.GRADIENTS,
      zIndex: 1,
      opacity: 1,
      active: true,
      render: null
    });

    this.addLayer({
      id: UNIVERSE_LAYERS.AMBIENT_LIGHTING,
      zIndex: 2,
      opacity: 1,
      active: true,
      render: null
    });

    this.addLayer({
      id: UNIVERSE_LAYERS.PARTICLE_FIELD,
      zIndex: 3,
      opacity: 1,
      active: true,
      render: null
    });

    this.addLayer({
      id: UNIVERSE_LAYERS.DEPTH_FOG,
      zIndex: 4,
      opacity: 1,
      active: false,
      render: null
    });

    this.addLayer({
      id: UNIVERSE_LAYERS.CONSTELLATIONS,
      zIndex: 5,
      opacity: 1,
      active: false,
      render: null
    });

    this.addLayer({
      id: UNIVERSE_LAYERS.SCENE_OVERLAYS,
      zIndex: 6,
      opacity: 1,
      active: false,
      render: null
    });
  }

  /**
   * Add a layer to the renderer.
   * @param {Object} layerConfig - Layer configuration
   * @param {string} layerConfig.id - Unique layer identifier
   * @param {number} layerConfig.zIndex - Layer z-order (lower = further back)
   * @param {number} layerConfig.opacity - Layer opacity (0 to 1)
   * @param {boolean} layerConfig.active - Whether layer is rendered
   * @param {Function|null} layerConfig.render - Render function(ctx, time, deltaTime)
   */
  addLayer(layerConfig) {
    this.layers.set(layerConfig.id, { ...layerConfig });
    this.sortLayers();
  }

  /**
   * Remove a layer by id.
   * @param {string} id - Layer identifier to remove
   */
  removeLayer(id) {
    this.layers.delete(id);
    this.sortLayers();
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
   * Set a layer's render function.
   * @param {string} id - Layer identifier
   * @param {Function} renderFn - Render function(ctx, time, deltaTime)
   */
  setLayerRenderer(id, renderFn) {
    const layer = this.layers.get(id);
    if (layer) {
      layer.render = renderFn;
    }
  }

  /**
   * Set a layer's active state.
   * @param {string} id - Layer identifier
   * @param {boolean} active - Whether the layer should render
   */
  setLayerActive(id, active) {
    const layer = this.layers.get(id);
    if (layer) {
      layer.active = active;
    }
  }

  /**
   * Sort layers by z-index for correct rendering order.
   */
  sortLayers() {
    this.sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Render all active layers in z-order.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} time - Elapsed time in seconds
   * @param {number} deltaTime - Frame delta in seconds
   */
  render(ctx, time, deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    for (let i = 0; i < this.sortedLayers.length; i++) {
      const layer = this.sortedLayers[i];
      if (!layer.active || !layer.render) continue;

      ctx.globalAlpha = layer.opacity;
      layer.render(ctx, time, deltaTime);
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Render the deep space base layer (solid dark background).
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderDeepSpace(ctx) {
    ctx.fillStyle = settings.universe.background.baseColor;
    ctx.fillRect(0, 0, this.width, this.height);
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
   * Destroy the background renderer and release layer data.
   */
  destroy() {
    this.layers.clear();
    this.sortedLayers = [];
    this.state = MANAGER_STATES.DESTROYED;
  }
}
