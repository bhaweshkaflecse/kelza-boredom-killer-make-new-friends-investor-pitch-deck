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
    this._timelineSteps = [];
    this._timelineConnectors = [];
    this._stagesRevealed = 0;
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

    this._timelineSteps = Array.from(
      this.element.querySelectorAll('.retention__timeline-step')
    );
    this._timelineConnectors = Array.from(
      this.element.querySelectorAll('.retention__timeline-connector')
    );
    this._stagesRevealed = 0;

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
   * Updates timeline indicator when a stage element is revealed.
   */
  _handleIntersections(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
        entry.target.classList.add('retention__element--revealed');
        this.observer.unobserve(entry.target);

        if (entry.target.classList.contains('retention__stage')) {
          this._advanceTimeline();
        }
      }
    });
  }

  /**
   * Advance the timeline indicator to reflect the next revealed stage.
   * Marks the current step as active and prior steps as completed.
   */
  _advanceTimeline() {
    const index = this._stagesRevealed;
    this._stagesRevealed += 1;

    // Mark all previous steps as completed
    for (let i = 0; i < index; i++) {
      this._timelineSteps[i].classList.remove('retention__timeline-step--active');
      this._timelineSteps[i].classList.add('retention__timeline-step--completed');
      if (this._timelineConnectors[i]) {
        this._timelineConnectors[i].classList.add('retention__timeline-connector--active');
      }
    }

    // Mark current step as active
    if (this._timelineSteps[index]) {
      this._timelineSteps[index].classList.add('retention__timeline-step--active');
    }
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
   * Disconnects the observer and resets revealed state for clean re-reveal.
   */
  hide() {
    if (!this.element) return;
    this.element.setAttribute('aria-hidden', 'true');
    this.element.classList.remove('retention--visible');

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.revealTargets.forEach((el) =>
      el.classList.remove('retention__element--revealed')
    );

    this._resetTimeline();
    this.visible = false;
  }

  /**
   * Reset timeline indicator classes to their initial state.
   */
  _resetTimeline() {
    this._timelineSteps.forEach((step) => {
      step.classList.remove(
        'retention__timeline-step--completed',
        'retention__timeline-step--active'
      );
    });
    this._timelineConnectors.forEach((connector) => {
      connector.classList.remove('retention__timeline-connector--active');
    });
    this._stagesRevealed = 0;
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
    this._timelineSteps = null;
    this._timelineConnectors = null;
    this.element = null;
    this.visible = false;
  }
}
