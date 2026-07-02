/**
 * ConnectionEvents
 * Frozen constant object of event name strings for the connection lifecycle.
 * Used by ConnectionManager, audio hooks, and camera response systems.
 */

/**
 * @typedef {Object} ConnectionEventMap
 * @property {string} CONNECTION_DISCOVERED - Two particles identified as candidates
 * @property {string} CONNECTION_PENDING - Particles approaching each other
 * @property {string} CONNECTION_CREATED - Filament drawn between particles
 * @property {string} CONNECTION_DORMANT - Connection enters dormant state
 * @property {string} CONNECTION_BROKEN - Connection severed
 * @property {string} PULSE_STARTED - Pulse begins traveling along filament
 * @property {string} PULSE_FINISHED - Pulse completed its journey
 */

/** @type {ConnectionEventMap} */
export const CONNECTION_EVENTS = Object.freeze({
  CONNECTION_DISCOVERED: 'connection:discovered',
  CONNECTION_PENDING: 'connection:pending',
  CONNECTION_CREATED: 'connection:created',
  CONNECTION_DORMANT: 'connection:dormant',
  CONNECTION_BROKEN: 'connection:broken',
  PULSE_STARTED: 'pulse:started',
  PULSE_FINISHED: 'pulse:finished'
});
