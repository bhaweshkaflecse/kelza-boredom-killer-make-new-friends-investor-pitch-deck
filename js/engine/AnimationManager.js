/**
 * AnimationManager
 * Integrates GSAP, manages timelines, and provides animation creation utilities.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MANAGER_STATES } from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion } from '../utils/helpers.js';

export class AnimationManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.masterTimeline = null;
    this.timelines = new Map();
    this.reducedMotion = false;
  }

  /**
   * Initialize the animation manager, register GSAP plugins.
   */
  init() {
    gsap.registerPlugin(ScrollTrigger);

    this.reducedMotion = isReducedMotion();
    this.masterTimeline = gsap.timeline({ paused: true });

    gsap.defaults({
      duration: settings.animation.defaultDuration,
      ease: settings.animation.defaultEase
    });

    if (this.reducedMotion && settings.animation.respectReducedMotion) {
      gsap.globalTimeline.timeScale(20);
    }

    this.state = MANAGER_STATES.READY;
  }

  /**
   * Create a new GSAP timeline.
   * @param {Object} [options={}] - Timeline options
   * @param {string} [id] - Optional identifier for the timeline
   * @returns {gsap.core.Timeline} New timeline
   */
  createTimeline(options = {}, id) {
    const timeline = gsap.timeline(options);

    if (id) {
      this.timelines.set(id, timeline);
    }

    return timeline;
  }

  /**
   * Create a scroll-triggered animation.
   * @param {Element|string} trigger - Trigger element or selector
   * @param {Object} [options={}] - ScrollTrigger options
   * @returns {gsap.core.Timeline} Scroll-linked timeline
   */
  createScrollAnimation(trigger, options = {}) {
    const defaults = {
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        toggleActions: 'play none none reverse',
        ...options
      }
    };

    return gsap.timeline(defaults);
  }

  /**
   * Kill a specific timeline by ID.
   * @param {string} id - Timeline identifier
   */
  kill(id) {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.kill();
      this.timelines.delete(id);
    }
  }

  /**
   * Kill all managed timelines.
   */
  killAll() {
    this.timelines.forEach(timeline => {
      timeline.kill();
    });
    this.timelines.clear();
  }

  /**
   * Pause all animations.
   */
  pause() {
    this.masterTimeline.pause();
    this.timelines.forEach(timeline => {
      timeline.pause();
    });
    this.state = MANAGER_STATES.PAUSED;
  }

  /**
   * Resume all animations.
   */
  resume() {
    this.masterTimeline.resume();
    this.timelines.forEach(timeline => {
      timeline.resume();
    });
    this.state = MANAGER_STATES.RUNNING;
  }

  /**
   * Update method called each frame.
   * @param {number} _deltaTime - Time since last frame in seconds
   */
  update(_deltaTime) {
    /* Frame-dependent animation logic would go here */
  }

  /**
   * Destroy the animation manager and clean up all timelines.
   */
  destroy() {
    this.killAll();
    if (this.masterTimeline) {
      this.masterTimeline.kill();
      this.masterTimeline = null;
    }
    ScrollTrigger.killAll();
    this.state = MANAGER_STATES.DESTROYED;
  }
}
