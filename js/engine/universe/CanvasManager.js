/**
 * CanvasManager
 * Creates and manages the fullscreen rendering canvas for the universe.
 * Handles resize, pixel ratio awareness, and GPU-friendly rendering setup.
 * Resize is driven externally by UniverseEngine (via Engine.js).
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const MAX_PIXEL_RATIO = 2;

export class CanvasManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.pixelRatio = 1;
    this.container = null;
  }

  /**
   * Initialize the canvas manager and create the rendering surface.
   * @param {HTMLElement} container - DOM element to append canvas to
   */
  init(container) {
    this.container = container;
    this.pixelRatio = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      MAX_PIXEL_RATIO
    );

    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('universe-canvas');
    this.ctx = this.canvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    });

    this.container.appendChild(this.canvas);
    this.updateSize();

    this.state = MANAGER_STATES.READY;
  }

  /**
   * Update canvas dimensions to match the viewport.
   */
  updateSize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  /**
   * Handle external resize event.
   * @param {number} width - New viewport width
   * @param {number} height - New viewport height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;

    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  /**
   * Get the 2D rendering context.
   * @returns {CanvasRenderingContext2D} Canvas context
   */
  getContext() {
    return this.ctx;
  }

  /**
   * Get the canvas element.
   * @returns {HTMLCanvasElement} Canvas element
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Get the current canvas dimensions.
   * @returns {{width: number, height: number, pixelRatio: number}} Dimensions
   */
  getDimensions() {
    return {
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio
    };
  }

  /**
   * Clear the entire canvas.
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Destroy the canvas manager and clean up resources.
   */
  destroy() {
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }

    this.canvas = null;
    this.ctx = null;
    this.container = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
