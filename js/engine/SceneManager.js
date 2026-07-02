/**
 * SceneManager
 * Manages scene lifecycle, transitions, and registry.
 *
 * Scene Lifecycle States:
 * 1. LOADING    - Scene assets and dependencies are being fetched
 * 2. PRELOADING - Scene is preparing internal state and preloading resources
 * 3. ENTERING   - Scene is transitioning in (intro animations)
 * 4. ACTIVE     - Scene is fully visible and running
 * 5. INTERACTIVE - Scene is active and responding to user input
 * 6. LEAVING    - Scene is transitioning out (outro animations)
 * 7. CLEANUP    - Scene is releasing non-essential resources
 * 8. DESTROYED  - Scene has been fully disposed
 */

import { SCENE_STATES, MANAGER_STATES } from '../config/constants.js';

export class SceneManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.scenes = new Map();
    this.currentScene = null;
    this.previousScene = null;
    this.isTransitioning = false;
  }

  /**
   * Initialize the scene manager.
   */
  init() {
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Register a scene with a unique identifier.
   * @param {string} id - Unique scene identifier
   * @param {Object} scene - Scene instance with lifecycle methods
   */
  registerScene(id, scene) {
    this.scenes.set(id, {
      instance: scene,
      state: SCENE_STATES.IDLE
    });
  }

  /**
   * Unregister a scene by identifier.
   * @param {string} id - Scene identifier to remove
   */
  unregisterScene(id) {
    const sceneEntry = this.scenes.get(id);
    if (sceneEntry && sceneEntry.state !== SCENE_STATES.DESTROYED) {
      this.destroyScene(id);
    }
    this.scenes.delete(id);
  }

  /**
   * Load a scene - fetch assets and dependencies.
   * @param {string} id - Scene identifier
   * @returns {Promise<void>}
   */
  async loadScene(id) {
    const sceneEntry = this.scenes.get(id);
    if (!sceneEntry) return;

    sceneEntry.state = SCENE_STATES.LOADING;
    if (sceneEntry.instance.load) {
      await sceneEntry.instance.load();
    }
  }

  /**
   * Preload a scene - prepare internal state.
   * @param {string} id - Scene identifier
   * @returns {Promise<void>}
   */
  async preloadScene(id) {
    const sceneEntry = this.scenes.get(id);
    if (!sceneEntry) return;

    sceneEntry.state = SCENE_STATES.PRELOADING;
    if (sceneEntry.instance.preload) {
      await sceneEntry.instance.preload();
    }
  }

  /**
   * Enter a scene - run intro transitions.
   * @param {string} id - Scene identifier
   * @returns {Promise<void>}
   */
  async enterScene(id) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const sceneEntry = this.scenes.get(id);
    if (!sceneEntry) {
      this.isTransitioning = false;
      return;
    }

    if (this.currentScene) {
      await this.leaveScene(this.currentScene);
    }

    sceneEntry.state = SCENE_STATES.ENTERING;
    if (sceneEntry.instance.enter) {
      await sceneEntry.instance.enter();
    }

    sceneEntry.state = SCENE_STATES.ACTIVE;
    this.previousScene = this.currentScene;
    this.currentScene = id;
    this.isTransitioning = false;
  }

  /**
   * Activate a scene for interactivity.
   * @param {string} id - Scene identifier
   */
  activateScene(id) {
    const sceneEntry = this.scenes.get(id);
    if (!sceneEntry) return;

    sceneEntry.state = SCENE_STATES.INTERACTIVE;
    if (sceneEntry.instance.activate) {
      sceneEntry.instance.activate();
    }
  }

  /**
   * Leave a scene - run outro transitions.
   * @param {string} id - Scene identifier
   * @returns {Promise<void>}
   */
  async leaveScene(id) {
    const sceneEntry = this.scenes.get(id);
    if (!sceneEntry) return;

    sceneEntry.state = SCENE_STATES.LEAVING;
    if (sceneEntry.instance.leave) {
      await sceneEntry.instance.leave();
    }
  }

  /**
   * Cleanup a scene - release non-essential resources.
   * @param {string} id - Scene identifier
   */
  cleanupScene(id) {
    const sceneEntry = this.scenes.get(id);
    if (!sceneEntry) return;

    sceneEntry.state = SCENE_STATES.CLEANUP;
    if (sceneEntry.instance.cleanup) {
      sceneEntry.instance.cleanup();
    }
  }

  /**
   * Destroy a scene - fully dispose all resources.
   * @param {string} id - Scene identifier
   */
  destroyScene(id) {
    const sceneEntry = this.scenes.get(id);
    if (!sceneEntry) return;

    sceneEntry.state = SCENE_STATES.DESTROYED;
    if (sceneEntry.instance.destroy) {
      sceneEntry.instance.destroy();
    }
  }

  /**
   * Get the state of a specific scene.
   * @param {string} id - Scene identifier
   * @returns {string|null} Scene state
   */
  getSceneState(id) {
    const sceneEntry = this.scenes.get(id);
    return sceneEntry ? sceneEntry.state : null;
  }

  /**
   * Update the current active scene.
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime) {
    if (!this.currentScene) return;
    const sceneEntry = this.scenes.get(this.currentScene);
    if (sceneEntry && sceneEntry.instance.update) {
      sceneEntry.instance.update(deltaTime);
    }
  }

  /**
   * Destroy the scene manager and all registered scenes.
   */
  destroy() {
    this.scenes.forEach((_, id) => {
      this.destroyScene(id);
    });
    this.scenes.clear();
    this.currentScene = null;
    this.previousScene = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
