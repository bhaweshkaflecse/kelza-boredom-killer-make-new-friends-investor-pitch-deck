/**
 * Math Utility Functions
 * Mathematical operations for animations, physics, and visual effects.
 */

/**
 * Map a value from one range to another.
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Calculate 2D distance between two points.
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export function distance2D(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate 3D distance between two points.
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} z1 - First point Z
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @param {number} z2 - Second point Z
 * @returns {number} Distance
 */
export function distance3D(x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalize a value within a range to 0-1.
 * @param {number} value - Value to normalize
 * @param {number} min - Range minimum
 * @param {number} max - Range maximum
 * @returns {number} Normalized value (0-1)
 */
export function normalize(value, min, max) {
  if (max - min === 0) return 0;
  return (value - min) / (max - min);
}

/**
 * Convert degrees to radians.
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees.
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Ease in-out quadratic function.
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value
 */
export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Ease out exponential function.
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value
 */
export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Smooth step interpolation (Hermite).
 * @param {number} edge0 - Lower edge
 * @param {number} edge1 - Upper edge
 * @param {number} x - Input value
 * @returns {number} Smoothly interpolated value
 */
export function smoothStep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Inverse linear interpolation - find t for a value between start and end.
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} value - Value to find t for
 * @returns {number} t value (0-1)
 */
export function inverseLerp(start, end, value) {
  if (end - start === 0) return 0;
  return (value - start) / (end - start);
}

/**
 * Smoother step interpolation (quintic Hermite).
 * @param {number} edge0 - Lower edge
 * @param {number} edge1 - Upper edge
 * @param {number} x - Input value
 * @returns {number} Smoothly interpolated value
 */
export function smootherStep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Calculate angle between two 2D points in radians.
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Angle in radians
 */
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Wrap a value within a range.
 * @param {number} value - Value to wrap
 * @param {number} min - Range minimum
 * @param {number} max - Range maximum
 * @returns {number} Wrapped value
 */
export function wrap(value, min, max) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}
