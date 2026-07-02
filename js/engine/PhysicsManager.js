/**
 * PhysicsManager
 * Lightweight physics system for UI interactions, spring animations, and particle systems.
 */

import { MANAGER_STATES } from '../config/constants.js';

export class PhysicsManager {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.bodies = new Map();
    this.gravity = { x: 0, y: 9.81 };
    this.friction = 0.98;
    this.bodyCount = 0;
  }

  /**
   * Initialize the physics manager.
   */
  init() {
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Add a physics body to the simulation.
   * @param {Object} options - Body configuration
   * @param {number} [options.x=0] - X position
   * @param {number} [options.y=0] - Y position
   * @param {number} [options.vx=0] - X velocity
   * @param {number} [options.vy=0] - Y velocity
   * @param {number} [options.mass=1] - Body mass
   * @param {boolean} [options.static=false] - Whether body is static
   * @returns {string} Body identifier
   */
  addBody(options = {}) {
    const id = `body-${this.bodyCount++}`;
    this.bodies.set(id, {
      x: options.x || 0,
      y: options.y || 0,
      vx: options.vx || 0,
      vy: options.vy || 0,
      ax: 0,
      ay: 0,
      mass: options.mass || 1,
      isStatic: options.static || false,
      active: true
    });
    return id;
  }

  /**
   * Remove a physics body from the simulation.
   * @param {string} id - Body identifier
   */
  removeBody(id) {
    this.bodies.delete(id);
  }

  /**
   * Apply a force to a body.
   * @param {string} id - Body identifier
   * @param {number} fx - Force X component
   * @param {number} fy - Force Y component
   */
  applyForce(id, fx, fy) {
    const body = this.bodies.get(id);
    if (!body || body.isStatic) return;

    body.ax += fx / body.mass;
    body.ay += fy / body.mass;
  }

  /**
   * Get a body's current state.
   * @param {string} id - Body identifier
   * @returns {Object|null} Body state
   */
  getBody(id) {
    return this.bodies.get(id) || null;
  }

  /**
   * Set gravity for the simulation.
   * @param {number} x - Gravity X component
   * @param {number} y - Gravity Y component
   */
  setGravity(x, y) {
    this.gravity.x = x;
    this.gravity.y = y;
  }

  /**
   * Update physics simulation.
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (this.state !== MANAGER_STATES.READY) return;

    this.bodies.forEach(body => {
      if (body.isStatic || !body.active) return;

      body.ax += this.gravity.x;
      body.ay += this.gravity.y;

      body.vx += body.ax * deltaTime;
      body.vy += body.ay * deltaTime;

      body.vx *= this.friction;
      body.vy *= this.friction;

      body.x += body.vx * deltaTime;
      body.y += body.vy * deltaTime;

      body.ax = 0;
      body.ay = 0;
    });
  }

  /**
   * Destroy the physics manager and release all bodies.
   */
  destroy() {
    this.bodies.clear();
    this.bodyCount = 0;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
