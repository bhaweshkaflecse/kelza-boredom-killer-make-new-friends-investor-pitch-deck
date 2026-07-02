/**
 * AudioArchitecture
 * Audio support stub for future ambient audio implementation.
 * Defines channel types and muting state. No actual audio playback.
 * Future tasks will implement loading and playback.
 */

import { MANAGER_STATES } from '../../config/constants.js';

/**
 * Audio channel type identifiers.
 */
export const AUDIO_CHANNELS = Object.freeze({
  AMBIENT_DRONES: 'ambientDrones',
  PARTICLE_WHISPERS: 'particleWhispers',
  GLASS_INTERACTIONS: 'glassInteractions',
  ENVIRONMENTAL_SOUNDS: 'environmentalSounds'
});

export class AudioArchitecture {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.muted = true;
    this.channels = new Map();
    /** @type {Map<string, boolean>} Registered event types */
    this.registeredEvents = new Map();
    /** @type {Function[]} Event listeners keyed by event name */
    this.eventListeners = new Map();
  }

  /**
   * Initialize the audio architecture.
   */
  init() {
    this.setupChannels();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Set up default audio channels (no actual audio loaded).
   */
  setupChannels() {
    const channelIds = Object.values(AUDIO_CHANNELS);
    for (let i = 0; i < channelIds.length; i++) {
      this.channels.set(channelIds[i], {
        id: channelIds[i],
        volume: 0,
        muted: true,
        active: false
      });
    }
  }

  /**
   * Get a channel by name.
   * @param {string} name - Channel identifier
   * @returns {Object|undefined} Channel state object
   */
  getChannel(name) {
    return this.channels.get(name);
  }

  /**
   * Set global muted state.
   * @param {boolean} muted - Whether audio is muted
   */
  setMuted(muted) {
    this.muted = muted;
    for (const channel of this.channels.values()) {
      channel.muted = muted;
    }
  }

  /**
   * Check if audio is globally muted.
   * @returns {boolean} Muted state
   */
  isMuted() {
    return this.muted;
  }

  /**
   * Get all channel identifiers.
   * @returns {string[]} Array of channel ids
   */
  getChannelIds() {
    return Array.from(this.channels.keys());
  }

  /**
   * Register an event type for future audio triggers.
   * @param {string} eventName - Event name identifier
   */
  registerEvent(eventName) {
    this.registeredEvents.set(eventName, true);
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
  }

  /**
   * Emit a registered event. When muted, events are tracked but no playback occurs.
   * @param {string} eventName - Event name to emit
   * @param {Object} [data] - Optional data associated with the event
   * @returns {boolean} True if event was registered and emitted
   */
  emit(eventName, data) {
    if (!this.registeredEvents.has(eventName)) return false;
    if (this.muted) return true;

    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        listeners[i](data);
      }
    }
    return true;
  }

  /**
   * Add a listener for a specific audio event.
   * @param {string} eventName - Event name
   * @param {Function} callback - Listener function
   */
  onEvent(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  /**
   * Check if an event is registered.
   * @param {string} eventName - Event name
   * @returns {boolean} True if registered
   */
  isEventRegistered(eventName) {
    return this.registeredEvents.has(eventName);
  }

  /**
   * Destroy the audio architecture.
   */
  destroy() {
    this.channels.clear();
    this.registeredEvents.clear();
    this.eventListeners.clear();
    this.state = MANAGER_STATES.DESTROYED;
  }
}
