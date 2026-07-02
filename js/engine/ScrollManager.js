/**
 * ScrollManager
 * Manages smooth scrolling via Lenis, scroll callbacks, and scroll state.
 */

import Lenis from 'lenis';
import { MANAGER_STATES } from '../config/constants.js';
import { settings } from '../config/settings.js';

export class ScrollManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.lenis = null;
    this.callbacks = new Set();
    this.progress = 0;
    this.velocity = 0;
    this.direction = 0;
    this.isLocked = false;
  }

  /**
   * Initialize the scroll manager with Lenis smooth scroll.
   */
  init() {
    this.lenis = new Lenis({
      lerp: settings.scroll.lerp,
      duration: settings.scroll.duration,
      wheelMultiplier: settings.scroll.wheelMultiplier,
      touchMultiplier: settings.scroll.touchMultiplier,
      infinite: settings.scroll.infinite,
      smoothWheel: settings.scroll.smooth
    });

    this.lenis.on('scroll', (event) => {
      this.progress = event.progress || 0;
      this.velocity = event.velocity || 0;
      this.direction = event.direction || 0;

      this.callbacks.forEach(callback => {
        callback({
          progress: this.progress,
          velocity: this.velocity,
          direction: this.direction,
          scroll: event.scroll || 0
        });
      });
    });

    this.state = MANAGER_STATES.READY;
  }

  /**
   * Register a scroll callback.
   * @param {Function} callback - Function called on scroll events
   * @returns {Function} Unsubscribe function
   */
  onScroll(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Get current scroll progress (0-1).
   * @returns {number} Scroll progress
   */
  getProgress() {
    return this.progress;
  }

  /**
   * Scroll to a target position or element.
   * @param {number|string|Element} target - Scroll target
   * @param {Object} [options={}] - Scroll options
   */
  scrollTo(target, options = {}) {
    if (this.isLocked || !this.lenis) return;
    this.lenis.scrollTo(target, options);
  }

  /**
   * Lock scroll interaction.
   */
  lock() {
    this.isLocked = true;
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  /**
   * Unlock scroll interaction.
   */
  unlock() {
    this.isLocked = false;
    if (this.lenis) {
      this.lenis.start();
    }
  }

  /**
   * Update Lenis - must be called in the animation frame loop.
   * @param {number} time - Current time from requestAnimationFrame
   */
  update(time) {
    if (this.lenis && !this.isLocked) {
      this.lenis.raf(time);
    }
  }

  /**
   * Destroy the scroll manager and clean up Lenis instance.
   */
  destroy() {
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    this.callbacks.clear();
    this.state = MANAGER_STATES.DESTROYED;
  }
}
