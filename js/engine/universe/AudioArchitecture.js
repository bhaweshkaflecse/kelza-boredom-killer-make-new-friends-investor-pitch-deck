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
   * Destroy the audio architecture.
   */
  destroy() {
    this.channels.clear();
    this.state = MANAGER_STATES.DESTROYED;
  }
}
