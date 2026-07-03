/**
 * InsightSection
 * Manages the Insight DOM element lifecycle.
 * Lightweight controller for the core insight statement display.
 */

export class InsightSection {
  constructor() {
    this.element = document.getElementById('insight-section');
    this.visible = false;
  }

  /**
   * Reveal the insight section by adding the visible modifier class.
   * Triggers CSS transition for the statement.
   */
  reveal() {
    if (!this.element) return;
    this.element.classList.add('insight-section--visible');
    this.visible = true;
  }

  /**
   * Hide the insight section by removing the visible modifier class.
   */
  hide() {
    if (!this.element) return;
    this.element.classList.remove('insight-section--visible');
    this.visible = false;
  }

  /**
   * Check whether the insight section is currently visible.
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Destroy the section controller and release references.
   */
  destroy() {
    this.element = null;
    this.visible = false;
  }
}
