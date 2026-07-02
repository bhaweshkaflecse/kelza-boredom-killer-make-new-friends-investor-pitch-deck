/**
 * Scene007MemoryUpdater
 * Handles memory system updates for Scene007 to keep the main
 * scene class under size limits. Zero per-frame allocations.
 *
 * Separated from Scene007_Memory.js following the project pattern
 * of splitting scene logic into subdirectory modules.
 */

import { INFLUENCE_TYPES } from '../../config/constants.js';
import { settings } from '../../config/settings.js';

const SCENE007 = settings.scene007;
const REINFORCE_DISTANCE = 100;
const MEMORY_CREATION_COOLDOWN = 2.5; // seconds between memory creations
const PATTERN_RECORD_COOLDOWN = 3.0; // seconds between pattern recordings

// Module-level timers to avoid per-frame allocations
let _memoryCreationTimer = 0;
let _patternRecordTimer = 0;

/**
 * Update all memory subsystems for the frame.
 * Memory creation and pattern recording are throttled via cooldown timers
 * to prevent per-frame flooding of the pools.
 * @param {Object} scene - Scene007_Memory instance
 * @param {number} deltaTime - Frame delta in seconds
 * @param {Object[]} pool - Particle pool
 * @param {number} activeCount - Active particle count
 */
export function updateMemorySystems(scene, deltaTime, pool, activeCount) {
  if (!scene.memoryFormationActive) return;

  scene.memoryEngine.update(deltaTime);
  scene.patternMemory.update(deltaTime);

  if (scene.echoSystemActive) {
    scene.echoSystem.update(deltaTime, scene.elapsedTime);
  }

  // Throttle memory creation with cooldown (issue: was called every frame)
  if (scene.constellationMemoryActive && scene.constellationHints) {
    _memoryCreationTimer += deltaTime;
    if (_memoryCreationTimer >= MEMORY_CREATION_COOLDOWN) {
      _memoryCreationTimer = 0;
      createMemoriesFromHints(scene, pool);
    }
  }

  // Throttle pattern recording with cooldown (issue: was called every frame)
  if (scene.patternRecordingActive && scene.connectionIndexA >= 0) {
    _patternRecordTimer += deltaTime;
    if (_patternRecordTimer >= PATTERN_RECORD_COOLDOWN) {
      _patternRecordTimer = 0;
      scene.patternMemory.recordPattern(
        pool, scene.connectionIndexA, scene.connectionIndexB
      );
    }
  }
}

/**
 * Create memories at constellation hint spawn positions.
 * @param {Object} scene - Scene007_Memory instance
 * @param {Object[]} pool - Particle pool
 */
function createMemoriesFromHints(scene, pool) {
  const idxA = scene.connectionIndexA;
  const idxB = scene.connectionIndexB;
  if (idxA < 0 || idxB < 0) return;

  const pA = pool[idxA];
  const pB = pool[idxB];
  if (!pA || !pB) return;

  const mx = (pA.x + pB.x) * 0.5;
  const my = (pA.y + pB.y) * 0.5;
  const sig = Math.floor(mx * 0.01 + my * 0.01) & 0xFFFF;

  const reinforced = tryReinforceNearby(scene, mx, my);
  if (!reinforced) {
    scene.memoryEngine.createMemory(mx, my, sig);
  }
}

/**
 * Try to reinforce a memory near the given position.
 * @param {Object} scene - Scene007_Memory instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {boolean} Whether a memory was reinforced
 */
function tryReinforceNearby(scene, x, y) {
  const threshold = REINFORCE_DISTANCE * REINFORCE_DISTANCE;
  for (let i = 0; i < scene.memoryEngine.maxMemories; i++) {
    const mem = scene.memoryEngine.pool[i];
    if (!mem.active) continue;
    const dx = mem.x - x;
    const dy = mem.y - y;
    if (dx * dx + dy * dy < threshold) {
      scene.memoryEngine.reinforceMemory(i);
      return true;
    }
  }
  return false;
}

/**
 * Bias constellation hints toward echo targets when echo is active.
 * Uses pattern recall from PatternMemory to bias echo targets based
 * on pattern geometry, connecting the recall pipeline to the echo mechanism.
 * @param {Object} scene - Scene007_Memory instance
 */
export function updateEchoInfluence(scene) {
  if (!scene.echoSystemActive || !scene.echoSystem) return;
  const echo = scene.echoSystem.getActiveEcho();
  if (!echo || !echo.active) return;

  // Use pattern recall to bias echo target position via pattern geometry
  let patternBiasX = 0;
  let patternBiasY = 0;

  if (scene.patternMemory && scene.connectionIndexA >= 0) {
    const particles = scene.universe ? scene.universe.particleEngine.pool : [];
    const match = scene.patternMemory.findSimilarPattern(
      particles,
      scene.connectionIndexA,
      scene.connectionIndexB
    );

    if (match.pattern) {
      const recall = scene.patternMemory.getApproximateRecall(match.pattern);
      patternBiasX = recall.dx * 0.3;
      patternBiasY = recall.dy * 0.3;
    }
  }

  const modX = echo.targetX + echo.patternDx * 50 + patternBiasX;
  const modY = echo.targetY + echo.patternDy * 50 + patternBiasY;
  scene.influenceEngine.addSource(
    modX, modY, INFLUENCE_TYPES.CONNECTION, echo.strength * 0.3
  );
}

/**
 * Apply pattern suggestion and negative space forces to particles.
 * @param {Object} scene - Scene007_Memory instance
 * @param {Object[]} pool - Particle pool
 * @param {number} activeCount - Active particle count
 * @param {number} deltaTime - Frame delta in seconds
 */
export function applySubsystemForces(scene, pool, activeCount, deltaTime) {
  const bias = settings.scene006.patternSuggestion.velocityBias;
  const repulse = settings.scene006.negativeSpace.repulsionScale;
  const motionReduce = scene.environmentalConfidenceActive
    ? SCENE007.environment.motionReduction : 0;

  for (let i = 0; i < activeCount; i++) {
    const p = pool[i];
    if (!p || !p.active) continue;

    const inf = scene.patternSuggestion.getInfluenceAt(p.x, p.y);
    p.vx += inf.density * bias * deltaTime;
    p.vy += inf.alignment * bias * deltaTime;

    const rep = scene.negativeSpaceDirector.getRepulsionAt(p.x, p.y);
    if (rep.strength > 0.001) {
      p.x += rep.directionX * rep.strength * repulse * deltaTime;
      p.y += rep.directionY * rep.strength * repulse * deltaTime;
    }

    if (motionReduce > 0) {
      p.vx *= (1 - motionReduce * deltaTime);
      p.vy *= (1 - motionReduce * deltaTime);
    }
  }
}

/**
 * Find the pool index of a memory object reference.
 * @param {Object} scene - Scene007_Memory instance
 * @param {Object} memRef - Memory reference to find
 * @returns {number} Pool index or -1
 */
export function findMemoryIndex(scene, memRef) {
  if (!scene.memoryEngine || !scene.memoryEngine.pool) return -1;
  for (let i = 0; i < scene.memoryEngine.maxMemories; i++) {
    if (scene.memoryEngine.pool[i] === memRef) return i;
  }
  return -1;
}

/**
 * Reset module-level cooldown timers. Call on scene enter.
 */
export function resetMemoryTimers() {
  _memoryCreationTimer = 0;
  _patternRecordTimer = 0;
}
