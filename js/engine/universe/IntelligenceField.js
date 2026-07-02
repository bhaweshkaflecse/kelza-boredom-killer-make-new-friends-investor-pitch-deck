/**
 * IntelligenceField
 * Invisible noise-driven vector field providing shared gravity-like influence.
 * Particles query the field at their position to receive a subtle force vector.
 * Uses a coarse grid with interpolation for performance.
 * No visual output - purely a force provider.
 */

import { MANAGER_STATES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';
import { Noise } from '../../utils/Noise.js';
import { lerp } from '../../utils/helpers.js';

const SCENE002 = settings.scene002;
const FIELD_CONFIG = SCENE002.intelligenceField;

const NOISE_OFFSET_X = 0;
const NOISE_OFFSET_Y = 200;

export class IntelligenceField {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.noise = null;
    this.gridResolution = FIELD_CONFIG.gridResolution;
    this.strength = FIELD_CONFIG.strength;
    this.noiseSpeed = FIELD_CONFIG.noiseSpeed;
    this.noiseScale = FIELD_CONFIG.noiseScale;

    /** @type {Float32Array} Flattened grid of fx values */
    this.gridFx = null;
    /** @type {Float32Array} Flattened grid of fy values */
    this.gridFy = null;

    this.fieldWidth = 0;
    this.fieldHeight = 0;
    this.cellWidth = 0;
    this.cellHeight = 0;
    this.cols = 0;
    this.rows = 0;

    /** Pre-allocated force result to avoid per-call allocation */
    this.forceResult = { fx: 0, fy: 0 };
  }

  /**
   * Initialize the intelligence field.
   * @param {number} width - Field width in pixels
   * @param {number} height - Field height in pixels
   */
  init(width, height) {
    this.noise = new Noise(FIELD_CONFIG.seed);
    this.resize(width, height);
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Resize the field grid to match new dimensions.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.fieldWidth = width;
    this.fieldHeight = height;
    this.cols = this.gridResolution;
    this.rows = this.gridResolution;
    this.cellWidth = width / this.cols;
    this.cellHeight = height / this.rows;

    const totalCells = (this.cols + 1) * (this.rows + 1);
    this.gridFx = new Float32Array(totalCells);
    this.gridFy = new Float32Array(totalCells);
  }

  /**
   * Update the field by evolving noise over time.
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    if (this.state !== MANAGER_STATES.READY) return;
    this.computeGrid(elapsedTime);
  }

  /**
   * Recompute all grid cell force values from noise.
   * @param {number} elapsedTime - Current elapsed time
   */
  computeGrid(elapsedTime) {
    const timeInput = elapsedTime * this.noiseSpeed;
    const scale = this.noiseScale;
    const cols = this.cols + 1;
    const rows = this.rows + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const nx = col * this.cellWidth * scale;
        const ny = row * this.cellHeight * scale;

        this.gridFx[idx] = this.noise.noise3D(
          nx + NOISE_OFFSET_X, ny, timeInput
        ) * this.strength;
        this.gridFy[idx] = this.noise.noise3D(
          nx + NOISE_OFFSET_Y, ny, timeInput
        ) * this.strength;
      }
    }
  }

  /**
   * Get the force vector at a given position using bilinear interpolation.
   * Returns a pre-allocated object (do not store reference across frames).
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @returns {{fx: number, fy: number}} Force vector
   */
  getForce(x, y) {
    const result = this.forceResult;

    if (this.state !== MANAGER_STATES.READY) {
      result.fx = 0;
      result.fy = 0;
      return result;
    }

    const col = x / this.cellWidth;
    const row = y / this.cellHeight;

    const col0 = Math.max(0, Math.min(this.cols - 1, Math.floor(col)));
    const row0 = Math.max(0, Math.min(this.rows - 1, Math.floor(row)));
    const col1 = col0 + 1;
    const row1 = row0 + 1;

    const tx = col - col0;
    const ty = row - row0;

    const cols = this.cols + 1;
    const i00 = row0 * cols + col0;
    const i10 = row0 * cols + col1;
    const i01 = row1 * cols + col0;
    const i11 = row1 * cols + col1;

    const topFx = lerp(this.gridFx[i00], this.gridFx[i10], tx);
    const botFx = lerp(this.gridFx[i01], this.gridFx[i11], tx);
    result.fx = lerp(topFx, botFx, ty);

    const topFy = lerp(this.gridFy[i00], this.gridFy[i10], tx);
    const botFy = lerp(this.gridFy[i01], this.gridFy[i11], tx);
    result.fy = lerp(topFy, botFy, ty);

    return result;
  }

  /**
   * Destroy the intelligence field and release resources.
   */
  destroy() {
    this.gridFx = null;
    this.gridFy = null;
    this.noise = null;
    this.state = MANAGER_STATES.DESTROYED;
  }
}
