/**
 * BehaviorSystem
 * Plug-and-play particle behavior module system.
 * Manages a registry of named behaviors that apply forces to particles.
 * Only enabled behaviors are applied during update. Zero allocations in apply loops.
 */

import { MANAGER_STATES, BEHAVIOR_IDS } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';

const SCENE002 = settings.scene002;

// --- Behavior Modules ---

/**
 * WanderBehavior - Noise-driven random movement.
 * Applies gentle, organic forces using simplex noise.
 */
class WanderBehavior {
  constructor(config) {
    this.strength = config.strength;
    this.noiseScale = config.noiseScale;
    this.noiseSpeed = config.noiseSpeed;
    this.noise = new Noise(config.seed);
  }

  /**
   * Apply wander force to a particle.
   * @param {Object} particle - Particle from pool
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   */
  apply(particle, deltaTime, elapsedTime) {
    const nx = particle.x * this.noiseScale;
    const ny = particle.y * this.noiseScale;
    const nt = elapsedTime * this.noiseSpeed;

    const fx = this.noise.noise3D(nx, ny, nt);
    const fy = this.noise.noise3D(nx + 100, ny + 100, nt);

    particle.ax += fx * this.strength;
    particle.ay += fy * this.strength;
  }
}

/**
 * DriftBehavior - Slow directional float with slight variation.
 * Applies a constant directional force with minor noise variation.
 */
class DriftBehavior {
  constructor(config) {
    this.strength = config.strength;
    this.directionX = config.directionX;
    this.directionY = config.directionY;
    this.variation = config.variation;
  }

  /**
   * Apply drift force to a particle.
   * @param {Object} particle - Particle from pool
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   */
  apply(particle, deltaTime, elapsedTime) {
    const varX = Math.sin(particle.x * 0.01 + elapsedTime) * this.variation;
    const varY = Math.cos(particle.y * 0.01 + elapsedTime) * this.variation;

    particle.ax += (this.directionX + varX) * this.strength;
    particle.ay += (this.directionY + varY) * this.strength;
  }
}

/**
 * OrganizeBehavior - Particles gently pull toward cluster centers.
 * Requires cluster data from ClusterDetection context.
 */
class OrganizeBehavior {
  constructor(config) {
    this.strength = config.strength;
    this.pullFactor = config.pullFactor;
    this.dampening = config.dampening;
  }

  /**
   * Apply organize force to a particle.
   * @param {Object} particle - Particle from pool
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   * @param {Object} context - External context with clusters array
   */
  apply(particle, deltaTime, elapsedTime, context) {
    const clusters = context.clusters;
    const count = context.count || 0;
    if (!clusters || count === 0) return;

    let nearestDx = 0;
    let nearestDy = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < count; i++) {
      const cluster = clusters[i];
      const dx = cluster.centerX - particle.x;
      const dy = cluster.centerY - particle.y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestDx = dx;
        nearestDy = dy;
      }
    }

    if (nearestDist < Infinity) {
      const dist = Math.sqrt(nearestDist);
      if (dist > 1) {
        const force = this.pullFactor / dist;
        particle.ax += nearestDx * force * this.strength;
        particle.ay += nearestDy * force * this.strength;
        particle.vx *= this.dampening;
        particle.vy *= this.dampening;
      }
    }
  }
}

/** AttractBehavior - Placeholder for future use. */
class AttractBehavior {
  constructor() { this.strength = 0; }
  /** @param {Object} _particle */
  apply(_particle) { /* unused in Scene002 */ }
}

/** OrbitBehavior - Placeholder for future use. */
class OrbitBehavior {
  constructor() { this.strength = 0; }
  /** @param {Object} _particle */
  apply(_particle) { /* unused in Scene002 */ }
}

/** RepelBehavior - Placeholder for future use. */
class RepelBehavior {
  constructor() { this.strength = 0; }
  /** @param {Object} _particle */
  apply(_particle) { /* unused in Scene002 */ }
}

/** IdleBehavior - Placeholder for future use. */
class IdleBehavior {
  constructor() { this.strength = 0; }
  /** @param {Object} _particle */
  apply(_particle) { /* unused in Scene002 */ }
}

/** FollowBehavior - Placeholder for future use. */
class FollowBehavior {
  constructor() { this.strength = 0; }
  /** @param {Object} _particle */
  apply(_particle) { /* unused in Scene002 */ }
}

// --- Main BehaviorSystem ---

export class BehaviorSystem {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    /** @type {Map<string, Object>} */
    this.registry = new Map();
    /** @type {string[]} */
    this.enabledList = [];
    /** @type {Object[]} Pre-resolved enabled behavior references */
    this.activeBehaviors = [];
    /** @type {Object} Shared context passed to behaviors each frame */
    this.context = { clusters: [] };
  }

  /**
   * Initialize the behavior system and register all behaviors.
   */
  init() {
    this.registerDefaults();
    const enabled = SCENE002.behaviors.enabled;
    for (let i = 0; i < enabled.length; i++) {
      this.enable(enabled[i]);
    }
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Register all default behavior modules.
   */
  registerDefaults() {
    const cfg = SCENE002.behaviors;
    this.register(BEHAVIOR_IDS.WANDER, new WanderBehavior(cfg.wander));
    this.register(BEHAVIOR_IDS.DRIFT, new DriftBehavior(cfg.drift));
    this.register(BEHAVIOR_IDS.ORGANIZE, new OrganizeBehavior(cfg.organize));
    this.register(BEHAVIOR_IDS.ATTRACT, new AttractBehavior());
    this.register(BEHAVIOR_IDS.ORBIT, new OrbitBehavior());
    this.register(BEHAVIOR_IDS.REPEL, new RepelBehavior());
    this.register(BEHAVIOR_IDS.IDLE, new IdleBehavior());
    this.register(BEHAVIOR_IDS.FOLLOW, new FollowBehavior());
  }

  /**
   * Register a behavior module by name.
   * @param {string} name - Behavior identifier
   * @param {Object} behavior - Behavior module with apply() method
   */
  register(name, behavior) {
    this.registry.set(name, behavior);
  }

  /**
   * Enable a registered behavior by name.
   * @param {string} name - Behavior identifier
   */
  enable(name) {
    if (!this.registry.has(name)) return;
    if (this.enabledList.indexOf(name) !== -1) return;
    this.enabledList.push(name);
    this.rebuildActiveList();
  }

  /**
   * Disable an active behavior by name.
   * @param {string} name - Behavior identifier
   */
  disable(name) {
    const idx = this.enabledList.indexOf(name);
    if (idx === -1) return;
    this.enabledList.splice(idx, 1);
    this.rebuildActiveList();
  }

  /**
   * Rebuild the pre-resolved active behaviors array.
   */
  rebuildActiveList() {
    this.activeBehaviors.length = 0;
    for (let i = 0; i < this.enabledList.length; i++) {
      this.activeBehaviors.push(this.registry.get(this.enabledList[i]));
    }
  }

  /**
   * Set the shared context for behaviors (e.g., cluster data).
   * @param {Object} context - Context object
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * Update all active particles with enabled behaviors.
   * @param {Object[]} particles - Particle pool array
   * @param {number} activeCount - Number of active particles
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time
   */
  update(particles, activeCount, deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    const behaviors = this.activeBehaviors;
    const behaviorCount = behaviors.length;
    const ctx = this.context;

    for (let i = 0; i < activeCount; i++) {
      const particle = particles[i];
      if (!particle.active) continue;

      for (let b = 0; b < behaviorCount; b++) {
        behaviors[b].apply(particle, deltaTime, elapsedTime, ctx);
      }
    }
  }

  /**
   * Destroy the behavior system and release resources.
   */
  destroy() {
    this.registry.clear();
    this.enabledList.length = 0;
    this.activeBehaviors.length = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
