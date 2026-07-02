/**
 * General Utility Helpers
 * Reusable functions for throttling, debouncing, math operations, and common patterns.
 */

/**
 * Throttle function execution to at most once per specified interval.
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Minimum milliseconds between invocations
 * @returns {Function} Throttled function
 */
export function throttle(fn, delay) {
  let lastCall = 0;
  let timeoutId = null;

  return function throttled(...args) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce function execution until after specified delay since last call.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Milliseconds to wait after last call
 * @param {boolean} [immediate=false] - Execute on leading edge
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay, immediate = false) {
  let timeoutId = null;

  return function debounced(...args) {
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, delay);

    if (callNow) {
      fn.apply(this, args);
    }
  };
}

/**
 * Clamp a value between a minimum and maximum.
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values.
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Progress (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Generate a random number within a range.
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random number in range
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer within a range.
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer in range
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Interpolate between values using various easing functions.
 * @param {number} t - Progress (0-1)
 * @param {string} [type='linear'] - Interpolation type
 * @returns {number} Eased value
 */
export function interpolate(t, type = 'linear') {
  const clamped = clamp(t, 0, 1);

  switch (type) {
    case 'easeIn':
      return clamped * clamped;
    case 'easeOut':
      return 1 - (1 - clamped) * (1 - clamped);
    case 'easeInOut':
      return clamped < 0.5
        ? 2 * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
    case 'linear':
    default:
      return clamped;
  }
}

/**
 * Generate a unique identifier.
 * @param {string} [prefix=''] - Optional prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = '') {
  const id = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Wait for a specified duration.
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} Resolves after delay
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detect if the user prefers reduced motion.
 * @returns {boolean} True if reduced motion is preferred
 */
export function isReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if the current device is a touch device.
 * @returns {boolean} True if touch device
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get the current viewport dimensions.
 * @returns {{width: number, height: number}} Viewport size
 */
export function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Create a promise that resolves on the next animation frame.
 * @returns {Promise<number>} Resolves with the timestamp
 */
export function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}
