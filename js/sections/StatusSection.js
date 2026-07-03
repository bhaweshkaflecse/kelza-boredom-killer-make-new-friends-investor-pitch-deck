/**
 * StatusSection
 * Manages the "What Exists Today" section lifecycle.
 * Uses IntersectionObserver to progressively reveal child elements
 * as they scroll into the viewport.
 */

export class StatusSection {
  constructor() {
    this.element = document.getElementById('status-section');
    this.visible = false;
    this.observer = null;
    this.revealTargets = [];
  }

  /**
   * Set up the IntersectionObserver for progressive child reveals.
   * Observes each element with [data-reveal] within the section.
   */
  _setupObserver() {
    if (!this.element) return;

    this.revealTargets = Array.from(
      this.element.querySelectorAll('[data-reveal]')
    );

    if (this.revealTargets.length === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        this._handleIntersections(entries);
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: [0, 0.15, 0.25]
      }
    );

    this.revealTargets.forEach((target) => {
      this.observer.observe(target);
    });
  }

  /**
   * Handle intersection entries and add reveal class
   * when elements enter the viewport at sufficient threshold.
   */
  _handleIntersections(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
        entry.target.classList.add('status__element--revealed');
        this.observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Reveal the status section by adding the visible modifier class.
   * Removes aria-hidden so assistive technology can perceive the content.
   */
  reveal() {
    if (!this.element) return;
    this.element.removeAttribute('aria-hidden');
    this.element.classList.add('status--visible');
    this.visible = true;
    this._setupObserver();
  }

  /**
   * Hide the status section by removing the visible modifier class.
   * Re-adds aria-hidden so assistive technology skips the content.
   * Disconnects the observer and resets revealed state.
   */
  hide() {
    if (!this.element) return;
    this.element.setAttribute('aria-hidden', 'true');
    this.element.classList.remove('status--visible');

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.revealTargets.forEach((el) =>
      el.classList.remove('status__element--revealed')
    );

    this.visible = false;
  }

  /**
   * Check whether the status section is currently visible.
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Destroy the section controller, disconnect observer,
   * and release all references.
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.revealTargets = [];
    this.element = null;
    this.visible = false;
  }
}
