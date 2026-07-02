/**
 * CursorManager
 * Architecture for custom cursor interactions and magnetic targets.
 * Visual implementation will be added in a future task.
 */

import { MANAGER_STATES } from '../config/constants.js';
import { settings } from '../config/settings.js';

export class CursorManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.targets = new Map();
    this.position = { x: 0, y: 0 };
    this.smoothPosition = { x: 0, y: 0 };
    this.cursorState = 'default';
    this.isVisible = false;
    this.isEnabled = false;
  }

  /**
   * Initialize the cursor manager.
   */
  init() {
    this.isEnabled = settings.cursor.enabled && !this.isTouchDevice();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Register an element as a cursor interaction target.
   * @param {Element} element - Target element
   * @param {Object} [options={}] - Interaction options
   * @param {string} [options.state='pointer'] - Cursor state when hovering
   * @param {number} [options.magnetic=0] - Magnetic strength (0-1)
   * @returns {string} Target registration ID
   */
  registerTarget(element, options = {}) {
    const id = `target-${this.targets.size}`;
    this.targets.set(id, {
      element,
      state: options.state || 'pointer',
      magnetic: options.magnetic || 0,
      active: true
    });
    return id;
  }

  /**
   * Unregister a cursor target.
   * @param {string} id - Target registration ID
   */
  unregisterTarget(id) {
    this.targets.delete(id);
  }

  /**
   * Set the current cursor visual state.
   * @param {string} newState - New cursor state identifier
   */
  setState(newState) {
    this.cursorState = newState;
  }

  /**
   * Check if the current device supports hover/pointer.
   * @returns {boolean} True if touch device
   */
  isTouchDevice() {
    if (typeof window === 'undefined') return true;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Update cursor position and state.
   * @param {number} _deltaTime - Time since last frame in seconds
   */
  update(_deltaTime) {
    if (!this.isEnabled) return;

    this.smoothPosition.x += (this.position.x - this.smoothPosition.x) * settings.cursor.smoothing;
    this.smoothPosition.y += (this.position.y - this.smoothPosition.y) * settings.cursor.smoothing;
  }

  /**
   * Destroy the cursor manager and release all targets.
   */
  destroy() {
    this.targets.clear();
    this.isEnabled = false;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
