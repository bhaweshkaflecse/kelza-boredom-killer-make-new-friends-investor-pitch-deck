/**
 * Scene001_FirstBreath
 * The opening cinematic scene - atmosphere only, no product content.
 * Activates: ambient dust particles, stars, fog, gradients, vignette,
 * camera drift, and dark lighting theme.
 * Registers with SceneManager as 'scene001_firstBreath'.
 */

import { SCENE_STATES } from '../config/constants.js';
import { PARTICLE_FAMILIES } from '../engine/universe/ParticleFamilies.js';

const SCENE_ID = 'scene001_firstBreath';
const LIGHTING_THEME = 'dark';

export class Scene001_FirstBreath {
  constructor() {
    this.id = SCENE_ID;
    this.state = SCENE_STATES.IDLE;
    this.universe = null;
  }

  /**
   * Get the scene identifier.
   * @returns {string} Scene id
   */
  getId() {
    return this.id;
  }

  /**
   * Set reference to the universe engine for environment control.
   * @param {Object} universe - UniverseEngine instance
   */
  setUniverse(universe) {
    this.universe = universe;
  }

  /**
   * Load scene assets (none for this scene).
   * @returns {Promise<void>}
   */
  async load() {
    this.state = SCENE_STATES.LOADING;
  }

  /**
   * Enter the scene - activate environment systems.
   * @returns {Promise<void>}
   */
  async enter() {
    this.state = SCENE_STATES.ENTERING;

    if (this.universe) {
      this.activateEnvironment();
    }

    this.state = SCENE_STATES.ACTIVE;
  }

  /**
   * Activate all environment layers for the first breath.
   */
  activateEnvironment() {
    const activeFamilies = [
      PARTICLE_FAMILIES.ambientDust,
      PARTICLE_FAMILIES.stars
    ];
    this.universe.setParticleFamilies(activeFamilies);
    this.universe.setTheme(LIGHTING_THEME);
    this.universe.setFogActive(true);
    this.universe.setGradientsActive(true);
    this.universe.setVignetteActive(true);
    this.universe.setCameraDriftActive(true);
  }

  /**
   * Update the scene each frame (environment is self-updating).
   * @param {number} deltaTime - Frame delta in seconds
   */
  update(deltaTime) {
    // Environment systems are updated by UniverseEngine.
    // Scene001 has no additional per-frame logic.
  }

  /**
   * Leave the scene - deactivate environment systems.
   * Note: Particle families persist across scene transitions as they form the
   * base environment. The next scene is responsible for setting its own families.
   * @returns {Promise<void>}
   */
  async leave() {
    this.state = SCENE_STATES.LEAVING;

    if (this.universe) {
      this.universe.setFogActive(false);
      this.universe.setVignetteActive(false);
      this.universe.setGradientsActive(false);
      this.universe.setCameraDriftActive(false);
    }

    this.state = SCENE_STATES.CLEANUP;
  }

  /**
   * Destroy the scene and release references.
   */
  destroy() {
    this.universe = null;
    this.state = SCENE_STATES.DESTROYED;
  }
}
