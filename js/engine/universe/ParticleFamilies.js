/**
 * ParticleFamilies
 * Configuration definitions for all particle family types.
 * Each family has independent settings for behavior, appearance, and lifecycle.
 * Only ambientDust and stars are active in Scene001.
 */

/**
 * @typedef {Object} ParticleFamilyConfig
 * @property {string} id - Unique family identifier
 * @property {boolean} enabled - Whether this family is active
 * @property {number} count - Target particle count for this family
 * @property {number} speedMin - Minimum velocity
 * @property {number} speedMax - Maximum velocity
 * @property {number} sizeMin - Minimum particle radius
 * @property {number} sizeMax - Maximum particle radius
 * @property {number} opacityMin - Minimum opacity
 * @property {number} opacityMax - Maximum opacity
 * @property {number} lifetimeMin - Minimum lifetime in seconds
 * @property {number} lifetimeMax - Maximum lifetime in seconds
 * @property {number} depthMin - Minimum depth layer
 * @property {number} depthMax - Maximum depth layer
 * @property {number} fadeInDuration - Fade-in as ratio of lifetime (0-1)
 * @property {number} fadeOutStart - Fade-out start as ratio of lifetime (0-1)
 * @property {{r: number, g: number, b: number}} color - Particle RGB color
 * @property {string} behavior - Behavior type identifier
 */

export const PARTICLE_FAMILIES = Object.freeze({
  ambientDust: Object.freeze({
    id: 'ambientDust',
    enabled: true,
    count: 0.6,
    speedMin: -4,
    speedMax: 4,
    sizeMin: 0.2,
    sizeMax: 1.2,
    opacityMin: 0.05,
    opacityMax: 0.35,
    lifetimeMin: 12,
    lifetimeMax: 30,
    depthMin: 0,
    depthMax: 5,
    fadeInDuration: 0.15,
    fadeOutStart: 0.75,
    color: Object.freeze({ r: 220, g: 220, b: 235 }),
    behavior: 'drift'
  }),

  stars: Object.freeze({
    id: 'stars',
    enabled: true,
    count: 0.4,
    speedMin: -1,
    speedMax: 1,
    sizeMin: 0.3,
    sizeMax: 0.8,
    opacityMin: 0.1,
    opacityMax: 0.7,
    lifetimeMin: 15,
    lifetimeMax: 40,
    depthMin: 0,
    depthMax: 5,
    fadeInDuration: 0.2,
    fadeOutStart: 0.8,
    color: Object.freeze({ r: 255, g: 255, b: 255 }),
    behavior: 'twinkle'
  }),

  energy: Object.freeze({
    id: 'energy',
    enabled: false,
    count: 0.3,
    speedMin: -12,
    speedMax: 12,
    sizeMin: 0.4,
    sizeMax: 1.8,
    opacityMin: 0.1,
    opacityMax: 0.5,
    lifetimeMin: 4,
    lifetimeMax: 10,
    depthMin: 1,
    depthMax: 4,
    fadeInDuration: 0.1,
    fadeOutStart: 0.7,
    color: Object.freeze({ r: 100, g: 140, b: 255 }),
    behavior: 'pulse'
  }),

  connections: Object.freeze({
    id: 'connections',
    enabled: false,
    count: 0.2,
    speedMin: -6,
    speedMax: 6,
    sizeMin: 0.3,
    sizeMax: 1.0,
    opacityMin: 0.05,
    opacityMax: 0.4,
    lifetimeMin: 8,
    lifetimeMax: 20,
    depthMin: 1,
    depthMax: 3,
    fadeInDuration: 0.2,
    fadeOutStart: 0.85,
    color: Object.freeze({ r: 120, g: 200, b: 180 }),
    behavior: 'attract'
  }),

  ai: Object.freeze({
    id: 'ai',
    enabled: false,
    count: 0.25,
    speedMin: -10,
    speedMax: 10,
    sizeMin: 0.2,
    sizeMax: 1.4,
    opacityMin: 0.08,
    opacityMax: 0.45,
    lifetimeMin: 5,
    lifetimeMax: 12,
    depthMin: 0,
    depthMax: 4,
    fadeInDuration: 0.08,
    fadeOutStart: 0.65,
    color: Object.freeze({ r: 180, g: 100, b: 255 }),
    behavior: 'swarm'
  }),

  revenue: Object.freeze({
    id: 'revenue',
    enabled: false,
    count: 0.15,
    speedMin: -3,
    speedMax: 3,
    sizeMin: 0.5,
    sizeMax: 1.6,
    opacityMin: 0.1,
    opacityMax: 0.5,
    lifetimeMin: 10,
    lifetimeMax: 25,
    depthMin: 1,
    depthMax: 4,
    fadeInDuration: 0.12,
    fadeOutStart: 0.8,
    color: Object.freeze({ r: 200, g: 180, b: 80 }),
    behavior: 'rise'
  }),

  trust: Object.freeze({
    id: 'trust',
    enabled: false,
    count: 0.2,
    speedMin: -2,
    speedMax: 2,
    sizeMin: 0.4,
    sizeMax: 1.3,
    opacityMin: 0.06,
    opacityMax: 0.4,
    lifetimeMin: 12,
    lifetimeMax: 30,
    depthMin: 0,
    depthMax: 5,
    fadeInDuration: 0.18,
    fadeOutStart: 0.82,
    color: Object.freeze({ r: 100, g: 220, b: 200 }),
    behavior: 'orbit'
  })
});

/**
 * Get only enabled particle families.
 * @returns {Object[]} Array of enabled family configs
 */
export function getEnabledFamilies() {
  return Object.values(PARTICLE_FAMILIES).filter(f => f.enabled);
}
