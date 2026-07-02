/**
 * CinematicTimeline
 * Master internal timeline system for the cinematic experience.
 * Tracks chapters that advance based on time (or future scroll).
 * Not GSAP-dependent - purely an internal data structure.
 */

import { MANAGER_STATES, TIMELINE_CHAPTERS } from '../config/constants.js';

/**
 * @typedef {Object} Chapter
 * @property {string} id - Chapter identifier from TIMELINE_CHAPTERS
 * @property {number} duration - Duration in seconds
 * @property {number} startTime - Computed start time relative to timeline start
 * @property {Function} [onEnter] - Called when chapter begins
 * @property {Function} [onUpdate] - Called each frame with progress (0-1)
 * @property {Function} [onLeave] - Called when chapter ends
 */

const MAX_CHAPTERS = 16;

export class CinematicTimeline {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    /** @type {Chapter[]} */
    this.chapters = [];
    this.chapterCount = 0;
    this.currentChapterIndex = -1;
    this.elapsedTime = 0;
    this.totalDuration = 0;
    this.isRunning = false;
  }

  /**
   * Initialize the cinematic timeline.
   */
  init() {
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Add a chapter to the timeline. Chapters play sequentially.
   * @param {Object} chapterDef - Chapter definition
   * @param {string} chapterDef.id - Chapter identifier
   * @param {number} chapterDef.duration - Duration in seconds
   * @param {Function} [chapterDef.onEnter] - Enter callback
   * @param {Function} [chapterDef.onUpdate] - Update callback (progress 0-1)
   * @param {Function} [chapterDef.onLeave] - Leave callback
   */
  addChapter(chapterDef) {
    if (this.chapterCount >= MAX_CHAPTERS) return;

    const chapter = {
      id: chapterDef.id,
      duration: chapterDef.duration,
      startTime: this.totalDuration,
      onEnter: chapterDef.onEnter || null,
      onUpdate: chapterDef.onUpdate || null,
      onLeave: chapterDef.onLeave || null
    };

    this.chapters.push(chapter);
    this.chapterCount++;
    this.totalDuration += chapter.duration;
  }

  /**
   * Start the timeline from the beginning.
   */
  start() {
    this.isRunning = true;
    this.elapsedTime = 0;
    this.currentChapterIndex = -1;
  }

  /**
   * Update the timeline. Advances chapters based on elapsed time.
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;
    if (!this.isRunning) return;
    if (this.chapterCount === 0) return;

    this.elapsedTime += deltaTime;
    this.evaluateChapter();
  }

  /**
   * Determine the active chapter and fire lifecycle callbacks.
   */
  evaluateChapter() {
    const targetIndex = this.findChapterIndex();

    if (targetIndex !== this.currentChapterIndex) {
      this.transitionToChapter(targetIndex);
    } else if (targetIndex >= 0) {
      this.updateCurrentChapter();
    }
  }

  /**
   * Find the chapter index for the current elapsed time.
   * @returns {number} Chapter index or -1
   */
  findChapterIndex() {
    for (let i = 0; i < this.chapterCount; i++) {
      const chapter = this.chapters[i];
      const end = chapter.startTime + chapter.duration;
      if (this.elapsedTime >= chapter.startTime && this.elapsedTime < end) {
        return i;
      }
    }
    // Past all chapters - stay on last
    if (this.elapsedTime >= this.totalDuration && this.chapterCount > 0) {
      return this.chapterCount - 1;
    }
    return -1;
  }

  /**
   * Transition between chapters with lifecycle callbacks.
   * @param {number} newIndex - Target chapter index
   */
  transitionToChapter(newIndex) {
    if (this.currentChapterIndex >= 0 && this.currentChapterIndex < this.chapterCount) {
      const leaving = this.chapters[this.currentChapterIndex];
      if (leaving.onLeave) leaving.onLeave();
    }

    this.currentChapterIndex = newIndex;

    if (newIndex >= 0 && newIndex < this.chapterCount) {
      const entering = this.chapters[newIndex];
      if (entering.onEnter) entering.onEnter();
    }
  }

  /**
   * Call onUpdate on the current active chapter with progress.
   */
  updateCurrentChapter() {
    const chapter = this.chapters[this.currentChapterIndex];
    if (!chapter || !chapter.onUpdate) return;

    const localTime = this.elapsedTime - chapter.startTime;
    const progress = Math.min(1, localTime / chapter.duration);
    chapter.onUpdate(progress);
  }

  /**
   * Get the currently active chapter object.
   * @returns {Chapter|null} Current chapter or null
   */
  getCurrentChapter() {
    if (this.currentChapterIndex < 0 || this.currentChapterIndex >= this.chapterCount) {
      return null;
    }
    return this.chapters[this.currentChapterIndex];
  }

  /**
   * Get the overall progress of the timeline (0-1).
   * @returns {number} Progress value
   */
  getProgress() {
    if (this.totalDuration <= 0) return 0;
    return Math.min(1, this.elapsedTime / this.totalDuration);
  }

  /**
   * Get elapsed time.
   * @returns {number} Elapsed time in seconds
   */
  getElapsedTime() {
    return this.elapsedTime;
  }

  /**
   * Stop the timeline.
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Destroy the timeline and release resources.
   */
  destroy() {
    this.stop();
    this.chapters = [];
    this.chapterCount = 0;
    this.currentChapterIndex = -1;
    this.totalDuration = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
