/**
 * DOM Utility Helpers
 * Query helpers, element creation, event management, and viewport utilities.
 */

/**
 * Query a single element from the DOM.
 * @param {string} selector - CSS selector
 * @param {Element|Document} [context=document] - Parent context
 * @returns {Element|null} Found element or null
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Query all matching elements from the DOM.
 * @param {string} selector - CSS selector
 * @param {Element|Document} [context=document] - Parent context
 * @returns {Element[]} Array of found elements
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Create a DOM element with attributes and children.
 * @param {string} tag - Element tag name
 * @param {Object} [attributes={}] - Element attributes
 * @param {(string|Element)[]} [children=[]] - Child nodes
 * @returns {Element} Created element
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Element) {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Add multiple event listeners to an element.
 * @param {Element} element - Target element
 * @param {Object} events - Map of event names to handlers
 * @param {Object} [options={}] - addEventListener options
 * @returns {Function} Cleanup function to remove all listeners
 */
export function addEventListeners(element, events, options = {}) {
  const entries = Object.entries(events);

  entries.forEach(([event, handler]) => {
    element.addEventListener(event, handler, options);
  });

  return () => {
    entries.forEach(([event, handler]) => {
      element.removeEventListener(event, handler, options);
    });
  };
}

/**
 * Remove multiple event listeners from an element.
 * @param {Element} element - Target element
 * @param {Object} events - Map of event names to handlers
 * @param {Object} [options={}] - removeEventListener options
 */
export function removeEventListeners(element, events, options = {}) {
  Object.entries(events).forEach(([event, handler]) => {
    element.removeEventListener(event, handler, options);
  });
}

/**
 * Get the scroll progress of the page (0-1).
 * @returns {number} Scroll progress
 */
export function getScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight <= 0) return 0;
  return Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
}

/**
 * Check if an element is within the viewport.
 * @param {Element} element - Element to check
 * @param {number} [threshold=0] - Visibility threshold (0-1)
 * @returns {boolean} True if element is in viewport
 */
export function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const thresholdPx = windowHeight * threshold;

  return (
    rect.bottom >= thresholdPx &&
    rect.top <= windowHeight - thresholdPx &&
    rect.right >= 0 &&
    rect.left <= windowWidth
  );
}

/**
 * Get all focusable elements within a container.
 * @param {Element} [container=document] - Container element
 * @returns {Element[]} Array of focusable elements
 */
export function getFocusableElements(container = document) {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
  ];

  return $$(selectors.join(', '), container);
}

/**
 * Trap focus within a container element.
 * @param {Element} container - Container to trap focus within
 * @returns {Function} Cleanup function to remove trap
 */
export function trapFocus(container) {
  const focusable = getFocusableElements(container);
  const firstFocusable = focusable[0];
  const lastFocusable = focusable[focusable.length - 1];

  function handleKeyDown(event) {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}
