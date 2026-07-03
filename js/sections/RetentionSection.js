/**
 * RetentionSection
 * Manages the retention section lifecycle.
 * Uses IntersectionObserver to progressively reveal child elements
 * as they scroll into the viewport, with slightly higher thresholds
 * for a calmer, less animated feel.
 */

export class RetentionSection {
  constructor() {
    this.element = document.getElementById('retention-section');
    this.visible = false;
    this.observer = null;
    this.revealTargets = [];
  }

  /**
   * Set up the IntersectionObserver for progressive child reveals.
   * Observes each element with [data-reveal] within the section.
   * Uses higher thresholds for a subtler reveal experience.
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
   * when elements enter the viewport at higher threshold.
   */
  _handleIntersections(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
        entry.target.classList.add('retention__element--revealed');
        this.observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Reveal the retention section by adding the visible modifier class.
   * Removes aria-hidden so assistive technology can perceive the content.
   */
  reveal() {
    if (!this.element) return;
    this.element.removeAttribute('aria-hidden');
    this.element.classList.add('retention--visible');
    this.visible = true;
    this._setupObserver();
  }

  /**
   * Hide the retention section by removing the visible modifier class.
   * Re-adds aria-hidden so assistive technology skips the content.
   */
  hide() {
    if (!this.element) return;
    this.element.setAttribute('aria-hidden', 'true');
    this.element.classList.remove('retention--visible');
    this.visible = false;
  }

  /**
   * Check whether the retention section is currently visible.
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
    this.revealTargets = null;
    this.element = null;
    this.visible = false;
  }
}
