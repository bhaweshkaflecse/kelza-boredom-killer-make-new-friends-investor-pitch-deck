/**
 * ConversationDirector
 * Lightweight, scene-specific director for Scene011_FirstConversation.
 * NOT a generic conversation engine. Exists only for this cinematic scene.
 *
 * Responsibilities:
 * - Advance filament from abstract connection breathing to heartbeat-like
 *   rhythm via noise-driven timing modulation
 * - Coordinate witness particles: subtle opacity lift for nearby particles
 *   oriented toward the connection, not attraction or clustering
 * - Manage camera stillness: locks camera drift to near-zero
 * - Manage presence state: the feeling of aliveness
 *
 * Zero per-frame allocations. All state pre-allocated in constructor.
 */

const STATE_IDLE = 'idle';
const STATE_ACTIVE = 'active';
const STATE_COMPLETE = 'complete';

export class ConversationDirector {
  constructor() {
    this.state = STATE_IDLE;
    this.canvasW = 0;
    this.canvasH = 0;
    this.connectionMidX = 0;
    this.connectionMidY = 0;

    // Rhythm state - drives heartbeat-like modulation
    this.rhythmTime = 0;
    this.rhythmLevel = 0;
    this.rhythmSpeed = 0.8;
    this.rhythmDepth = 0.4;
    this.pauseDuration = 0.6;

    // Witness awareness state
    this.witnessRadius = 200;
    this.witnessRadiusSq = 40000;
    this.witnessOpacityLift = 0.04;
    this.witnessLevel = 0;

    // Camera stillness state
    this.stillnessLevel = 0;
    this.driftStart = 0.01;
    this.driftEnd = 0.005;

    // Reduced motion
    this.reducedMotion = false;
    this.reducedMotionFactor = 0.2;

    // Elapsed time
    this.elapsedTime = 0;
  }

  /**
   * Initialize the conversation director.
   * @param {number} w - Canvas width
   * @param {number} h - Canvas height
   * @param {number} midX - Connection midpoint X
   * @param {number} midY - Connection midpoint Y
   * @param {Object} config - Configuration from settings.scene011.conversation
   */
  init(w, h, midX, midY, config) {
    this.canvasW = w;
    this.canvasH = h;
    this.connectionMidX = midX;
    this.connectionMidY = midY;
    this.rhythmTime = 0;
    this.rhythmLevel = 0;
    this.witnessLevel = 0;
    this.stillnessLevel = 0;
    this.elapsedTime = 0;

    this.rhythmSpeed = config.rhythmSpeed || 0.8;
    this.rhythmDepth = config.rhythmDepth || 0.4;
    this.pauseDuration = config.pauseDuration || 0.6;
    this.witnessRadius = config.witnessRadius || 200;
    this.witnessRadiusSq = this.witnessRadius * this.witnessRadius;
    this.witnessOpacityLift = config.witnessOpacityLift || 0.04;

    this.state = STATE_ACTIVE;
  }

  /**
   * Set reduced motion preference.
   * @param {boolean} enabled - Whether reduced motion is active
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
  }

  /**
   * Main update called each frame.
   * @param {number} dt - Delta time in seconds
   * @param {Object[]} pool - Particle pool array
   * @param {number} activeCount - Number of active particles
   * @param {Object} cam - Camera controller reference
   */
  update(dt, pool, activeCount, cam) {
    if (this.state !== STATE_ACTIVE) return;

    this.elapsedTime += dt;
    this.applyRhythm(dt);
    this.applyWitnessAwareness(pool, activeCount, dt);
    this.applyCameraStillness(cam);
  }

  /**
   * Modulate connection breath timing toward heartbeat-like rhythm.
   * Uses sine-based pattern with pause intervals for organic feel.
   * @param {number} dt - Delta time in seconds
   */
  applyRhythm(dt) {
    this.rhythmTime += dt * this.rhythmSpeed;

    // Heartbeat-like double-beat with pause:
    // beat-beat-pause pattern via sine modulation
    const cyclePosition = this.rhythmTime % (Math.PI * 2 + this.pauseDuration);
    let rhythmValue = 0;

    if (cyclePosition < Math.PI * 2) {
      // Active beat region: double-pulse via sin^2 shifted
      const t = cyclePosition;
      const firstBeat = Math.sin(t);
      const secondBeat = Math.sin(t * 2) * 0.6;
      rhythmValue = (firstBeat * firstBeat + secondBeat * secondBeat) * 0.5;
    }
    // else: pause region, rhythmValue stays 0

    this.rhythmLevel = rhythmValue * this.rhythmDepth;
  }

  /**
   * Apply subtle opacity lift to particles within witness radius.
   * Not attraction, not clustering - just awareness.
   * @param {Object[]} pool - Particle pool
   * @param {number} activeCount - Active particle count
   * @param {number} dt - Delta time in seconds
   */
  applyWitnessAwareness(pool, activeCount, dt) {
    if (this.witnessLevel < 0.001) return;

    const midX = this.connectionMidX;
    const midY = this.connectionMidY;
    const radiusSq = this.witnessRadiusSq;
    const lift = this.witnessOpacityLift * this.witnessLevel;
    const limit = Math.min(activeCount, pool.length);
    const lerpRate = 2.0 * dt;

    for (let i = 0; i < limit; i++) {
      const p = pool[i];
      if (!p || p.opacity <= 0) continue;

      const dx = p.x - midX;
      const dy = p.y - midY;
      const distSq = dx * dx + dy * dy;

      if (distSq < radiusSq && distSq > 100) {
        // Proximity factor: closer = more aware
        const proximity = 1 - distSq / radiusSq;
        const targetLift = proximity * lift;
        // Gentle lerp toward target, no snap
        const baseOpacity = p.baseTargetOpacity !== undefined
          ? p.baseTargetOpacity
          : p.targetOpacity || p.opacity;
        const goal = baseOpacity + targetLift;
        p.targetOpacity = p.targetOpacity + (goal - p.targetOpacity) * lerpRate;
      }
    }
  }

  /**
   * Lock camera drift to near-zero based on stillness level.
   * @param {Object} cam - Camera controller reference
   */
  applyCameraStillness(cam) {
    if (!cam || !cam.setDriftMultiplier) return;
    if (this.reducedMotion) return;

    const drift = this.driftStart + (this.driftEnd - this.driftStart) * this.stillnessLevel;
    cam.setDriftMultiplier(drift);
  }

  /**
   * Set rhythm level from phase callbacks.
   * @param {number} level - Rhythm intensity 0 to 1
   */
  setRhythmLevel(level) {
    this.rhythmDepth = 0.2 + level * 0.4;
  }

  /**
   * Set witness awareness level from phase callbacks.
   * @param {number} level - Witness awareness 0 to 1
   */
  setWitnessLevel(level) {
    this.witnessLevel = level;
  }

  /**
   * Set camera stillness level from phase callbacks.
   * @param {number} level - Stillness 0 to 1
   */
  setStillnessLevel(level) {
    this.stillnessLevel = level;
  }

  /**
   * Get current rhythm modulation value.
   * @returns {number} Rhythm level for connection breathing modulation
   */
  getRhythmLevel() {
    return this.rhythmLevel;
  }

  /**
   * Reset to idle state.
   */
  reset() {
    this.state = STATE_IDLE;
    this.rhythmTime = 0;
    this.rhythmLevel = 0;
    this.witnessLevel = 0;
    this.stillnessLevel = 0;
    this.elapsedTime = 0;
  }

  /**
   * Destroy and release all state.
   */
  destroy() {
    this.state = STATE_IDLE;
    this.rhythmTime = 0;
    this.rhythmLevel = 0;
    this.witnessLevel = 0;
    this.stillnessLevel = 0;
    this.elapsedTime = 0;
  }
}
