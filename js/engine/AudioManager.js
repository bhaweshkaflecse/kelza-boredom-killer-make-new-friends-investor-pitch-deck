/**
 * AudioManager
 * Manages audio playback, volume control, and crossfading.
 * Initialized in muted state by default per user preference requirements.
 */

import { MANAGER_STATES } from '../config/constants.js';
import { settings } from '../config/settings.js';

export class AudioManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.context = null;
    this.masterGain = null;
    this.sounds = new Map();
    this.isMuted = true;
    this.masterVolume = settings.audio.masterVolume;
  }

  /**
   * Initialize the audio manager. Muted by default.
   */
  init() {
    this.isMuted = settings.audio.muted;
    this.masterVolume = settings.audio.masterVolume;
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Create the AudioContext (must be triggered by user interaction).
   */
  createContext() {
    if (this.context) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
  }

  /**
   * Load a sound file and register it.
   * @param {string} id - Sound identifier
   * @param {string} url - Sound file URL
   * @param {Object} [options={}] - Sound options
   * @param {boolean} [options.loop=false] - Whether to loop
   * @param {number} [options.volume=1] - Volume level (0-1)
   * @returns {Promise<void>}
   */
  async loadSound(id, url, options = {}) {
    this.sounds.set(id, {
      url,
      buffer: null,
      source: null,
      gainNode: null,
      loop: options.loop || false,
      volume: options.volume !== undefined ? options.volume : 1,
      playing: false
    });
  }

  /**
   * Play a loaded sound.
   * @param {string} id - Sound identifier
   * @param {Object} [options={}] - Playback options
   */
  play(id, options = {}) {
    const sound = this.sounds.get(id);
    if (!sound || !this.context) return;

    if (sound.source) {
      sound.source.stop();
    }

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = sound.buffer;
    source.loop = options.loop !== undefined ? options.loop : sound.loop;
    gainNode.gain.value = sound.volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(0);

    sound.source = source;
    sound.gainNode = gainNode;
    sound.playing = true;

    source.onended = () => {
      sound.playing = false;
    };
  }

  /**
   * Pause a playing sound.
   * @param {string} id - Sound identifier
   */
  pause(id) {
    const sound = this.sounds.get(id);
    if (!sound || !sound.source || !sound.playing) return;

    sound.source.stop();
    sound.playing = false;
  }

  /**
   * Set volume for a specific sound.
   * @param {string} id - Sound identifier
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(id, volume) {
    const sound = this.sounds.get(id);
    if (!sound) return;

    sound.volume = Math.max(0, Math.min(1, volume));
    if (sound.gainNode) {
      sound.gainNode.gain.value = sound.volume;
    }
  }

  /**
   * Mute all audio.
   */
  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  /**
   * Unmute all audio.
   */
  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  /**
   * Crossfade between two sounds.
   * @param {string} fromId - Sound to fade out
   * @param {string} toId - Sound to fade in
   * @param {number} [duration] - Crossfade duration in seconds
   */
  crossfade(fromId, toId, duration = settings.audio.crossfadeDuration) {
    const fromSound = this.sounds.get(fromId);
    const toSound = this.sounds.get(toId);

    if (!fromSound || !toSound || !this.context) return;

    const now = this.context.currentTime;

    if (fromSound.gainNode) {
      fromSound.gainNode.gain.linearRampToValueAtTime(0, now + duration);
    }

    this.play(toId);
    if (toSound.gainNode) {
      toSound.gainNode.gain.setValueAtTime(0, now);
      toSound.gainNode.gain.linearRampToValueAtTime(toSound.volume, now + duration);
    }
  }

  /**
   * Destroy the audio manager and release all resources.
   */
  destroy() {
    this.sounds.forEach(sound => {
      if (sound.source && sound.playing) {
        sound.source.stop();
      }
    });
    this.sounds.clear();

    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }

    this.context = null;
    this.masterGain = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
