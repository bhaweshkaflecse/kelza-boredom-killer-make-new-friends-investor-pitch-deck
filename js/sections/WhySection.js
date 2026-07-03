/**
 * WhySection
 * Manages the "Why the world needs Kelza" section lifecycle.
 * Uses IntersectionObserver to progressively reveal child elements
 * as they scroll into the viewport.
 */

export class WhySection {
  constructor() {
    this.element = document.getElementById('why-section');
    this.visible = false;
    this.observer = null;
    this.revealTargets = [];
  }

  /**
   * Set up the IntersectionObserver for progressive child reveals.
   * Observes each direct content block within the section.
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
        threshold: [0, 0.1, 0.2, 0.3]
      }
    );

    this.revealTargets.forEach((target) => {
      this.observer.observe(target);
    });
  }

  /**
   * Handle intersection entries and add reveal class
   * when elements enter the viewport.
   */
  _handleIntersections(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
        entry.target.classList.add('why-section__element--revealed');
        this.observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Reveal the why section by adding the visible modifier class.
   * Removes aria-hidden so assistive technology can perceive the content.
   */
  reveal() {
    if (!this.element) return;
    this.element.removeAttribute('aria-hidden');
    this.element.classList.add('why-section--visible');
    this.visible = true;
    this._setupObserver();
  }

  /**
   * Hide the why section by removing the visible modifier class.
   * Re-adds aria-hidden so assistive technology skips the content.
   */
  hide() {
    if (!this.element) return;
    this.element.setAttribute('aria-hidden', 'true');
    this.element.classList.remove('why-section--visible');
    this.visible = false;
  }

  /**
   * Check whether the why section is currently visible.
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
