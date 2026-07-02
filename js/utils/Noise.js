/**
 * Noise Utility
 * Simplex noise implementation for procedural generation.
 * Used by lighting, particles, fog, camera, and background movement.
 */

const GRAD3 = Object.freeze([
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
]);

const GRAD4 = Object.freeze([
  [0, 1, 1, 1], [0, 1, 1, -1], [0, 1, -1, 1], [0, 1, -1, -1],
  [0, -1, 1, 1], [0, -1, 1, -1], [0, -1, -1, 1], [0, -1, -1, -1],
  [1, 0, 1, 1], [1, 0, 1, -1], [1, 0, -1, 1], [1, 0, -1, -1],
  [-1, 0, 1, 1], [-1, 0, 1, -1], [-1, 0, -1, 1], [-1, 0, -1, -1],
  [1, 1, 0, 1], [1, 1, 0, -1], [1, -1, 0, 1], [1, -1, 0, -1],
  [-1, 1, 0, 1], [-1, 1, 0, -1], [-1, -1, 0, 1], [-1, -1, 0, -1],
  [1, 1, 1, 0], [1, 1, -1, 0], [1, -1, 1, 0], [1, -1, -1, 0],
  [-1, 1, 1, 0], [-1, 1, -1, 0], [-1, -1, 1, 0], [-1, -1, -1, 0]
]);

const PERMUTATION_SIZE = 256;
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const F3 = 1 / 3;
const G3 = 1 / 6;
const F4 = (Math.sqrt(5) - 1) / 4;
const G4 = (5 - Math.sqrt(5)) / 20;

/**
 * Build a permutation table from a seed.
 * @param {number} seed - Random seed
 * @returns {Uint8Array} Permutation table (512 entries)
 */
function buildPermTable(seed) {
  const perm = new Uint8Array(PERMUTATION_SIZE * 2);
  const source = new Uint8Array(PERMUTATION_SIZE);

  for (let i = 0; i < PERMUTATION_SIZE; i++) {
    source[i] = i;
  }

  let s = seed;
  for (let i = PERMUTATION_SIZE - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const r = (s + 31) % (i + 1);
    const tmp = source[i];
    source[i] = source[r];
    source[r] = tmp;
  }

  for (let i = 0; i < PERMUTATION_SIZE; i++) {
    perm[i] = source[i];
    perm[i + PERMUTATION_SIZE] = source[i];
  }

  return perm;
}

/**
 * Dot product of gradient and distance vector (2D).
 * @param {number[]} g - Gradient vector
 * @param {number} x - X distance
 * @param {number} y - Y distance
 * @returns {number} Dot product
 */
function dot2(g, x, y) {
  return g[0] * x + g[1] * y;
}

/**
 * Dot product of gradient and distance vector (3D).
 * @param {number[]} g - Gradient vector
 * @param {number} x - X distance
 * @param {number} y - Y distance
 * @param {number} z - Z distance
 * @returns {number} Dot product
 */
function dot3(g, x, y, z) {
  return g[0] * x + g[1] * y + g[2] * z;
}

/**
 * Dot product of gradient and distance vector (4D).
 * @param {number[]} g - Gradient vector
 * @param {number} x - X distance
 * @param {number} y - Y distance
 * @param {number} z - Z distance
 * @param {number} w - W distance
 * @returns {number} Dot product
 */
function dot4(g, x, y, z, w) {
  return g[0] * x + g[1] * y + g[2] * z + g[3] * w;
}

export class Noise {
  /**
   * Create a new Noise instance.
   * @param {number} [seed=0] - Random seed for permutation table
   */
  constructor(seed = 0) {
    this.perm = buildPermTable(seed);
  }

  /**
   * Set a new seed and rebuild the permutation table.
   * @param {number} seed - New random seed
   */
  setSeed(seed) {
    this.perm = buildPermTable(seed);
  }

  /**
   * 2D Simplex noise.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Noise value in range [-1, 1]
   */
  noise2D(x, y) {
    const perm = this.perm;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;

    const x0 = x - (i - t);
    const y0 = y - (j - t);

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      const gi0 = perm[ii + perm[jj]] % 12;
      n0 = t0 * t0 * dot2(GRAD3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
      n1 = t1 * t1 * dot2(GRAD3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;
      n2 = t2 * t2 * dot2(GRAD3[gi2], x2, y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  /**
   * 3D Simplex noise.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {number} Noise value in range [-1, 1]
   */
  noise3D(x, y, z) {
    const perm = this.perm;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;

    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);

    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
      t0 *= t0;
      const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
      n0 = t0 * t0 * dot3(GRAD3[gi0], x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
      t1 *= t1;
      const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
      n1 = t1 * t1 * dot3(GRAD3[gi1], x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
      t2 *= t2;
      const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
      n2 = t2 * t2 * dot3(GRAD3[gi2], x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
      t3 *= t3;
      const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
      n3 = t3 * t3 * dot3(GRAD3[gi3], x3, y3, z3);
    }

    return 32 * (n0 + n1 + n2 + n3);
  }

  /**
   * 4D Simplex noise.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} w - W coordinate
   * @returns {number} Noise value in range [-1, 1]
   */
  noise4D(x, y, z, w) {
    const perm = this.perm;
    const s = (x + y + z + w) * F4;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const l = Math.floor(w + s);
    const t = (i + j + k + l) * G4;

    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);
    const w0 = w - (l - t);

    const rankX = (x0 > y0 ? 1 : 0) + (x0 > z0 ? 1 : 0) + (x0 > w0 ? 1 : 0);
    const rankY = (y0 > x0 ? 1 : 0) + (y0 > z0 ? 1 : 0) + (y0 > w0 ? 1 : 0);
    const rankZ = (z0 > x0 ? 1 : 0) + (z0 > y0 ? 1 : 0) + (z0 > w0 ? 1 : 0);
    const rankW = (w0 > x0 ? 1 : 0) + (w0 > y0 ? 1 : 0) + (w0 > z0 ? 1 : 0);

    const i1 = rankX >= 3 ? 1 : 0;
    const j1 = rankY >= 3 ? 1 : 0;
    const k1 = rankZ >= 3 ? 1 : 0;
    const l1 = rankW >= 3 ? 1 : 0;

    const i2 = rankX >= 2 ? 1 : 0;
    const j2 = rankY >= 2 ? 1 : 0;
    const k2 = rankZ >= 2 ? 1 : 0;
    const l2 = rankW >= 2 ? 1 : 0;

    const i3 = rankX >= 1 ? 1 : 0;
    const j3 = rankY >= 1 ? 1 : 0;
    const k3 = rankZ >= 1 ? 1 : 0;
    const l3 = rankW >= 1 ? 1 : 0;

    const x1 = x0 - i1 + G4;
    const y1 = y0 - j1 + G4;
    const z1 = z0 - k1 + G4;
    const w1 = w0 - l1 + G4;
    const x2 = x0 - i2 + 2 * G4;
    const y2 = y0 - j2 + 2 * G4;
    const z2 = z0 - k2 + 2 * G4;
    const w2 = w0 - l2 + 2 * G4;
    const x3 = x0 - i3 + 3 * G4;
    const y3 = y0 - j3 + 3 * G4;
    const z3 = z0 - k3 + 3 * G4;
    const w3 = w0 - l3 + 3 * G4;
    const x4 = x0 - 1 + 4 * G4;
    const y4 = y0 - 1 + 4 * G4;
    const z4 = z0 - 1 + 4 * G4;
    const w4 = w0 - 1 + 4 * G4;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const ll = l & 255;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0, n4 = 0;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
    if (t0 >= 0) {
      t0 *= t0;
      const gi0 = perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32;
      n0 = t0 * t0 * dot4(GRAD4[gi0], x0, y0, z0, w0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
    if (t1 >= 0) {
      t1 *= t1;
      const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32;
      n1 = t1 * t1 * dot4(GRAD4[gi1], x1, y1, z1, w1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
    if (t2 >= 0) {
      t2 *= t2;
      const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32;
      n2 = t2 * t2 * dot4(GRAD4[gi2], x2, y2, z2, w2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
    if (t3 >= 0) {
      t3 *= t3;
      const gi3 = perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32;
      n3 = t3 * t3 * dot4(GRAD4[gi3], x3, y3, z3, w3);
    }

    let t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
    if (t4 >= 0) {
      t4 *= t4;
      const gi4 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32;
      n4 = t4 * t4 * dot4(GRAD4[gi4], x4, y4, z4, w4);
    }

    return 27 * (n0 + n1 + n2 + n3 + n4);
  }
}
