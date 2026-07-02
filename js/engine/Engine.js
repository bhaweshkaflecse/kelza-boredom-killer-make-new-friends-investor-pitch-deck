/**
 * Engine
 * Core application orchestrator for the Kelza Experience Platform.
 * Manages the lifecycle of all subsystem managers and the main animation loop.
 */

import { MANAGER_STATES } from '../config/constants.js';
import { settings } from '../config/settings.js';
import { isReducedMotion, debounce } from '../utils/helpers.js';
import { SceneManager } from './SceneManager.js';
import { AnimationManager } from './AnimationManager.js';
import { ScrollManager } from './ScrollManager.js';
import { CursorManager } from './CursorManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { LightingManager } from './LightingManager.js';
import { PerformanceManager } from './PerformanceManager.js';
import { AudioManager } from './AudioManager.js';
import { UniverseEngine } from './universe/UniverseEngine.js';
import { Scene001_FirstBreath } from '../scenes/Scene001_FirstBreath.js';
import { Scene002_Awakening } from '../scenes/Scene002_Awakening.js';
import { Scene003_FirstConnection } from '../scenes/Scene003_FirstConnection.js';
import { Scene004_Ripple } from '../scenes/Scene004_Ripple.js';

export class Engine {
  constructor() {
    this.state = MANAGER_STATES.UNINITIALIZED;
    this.managers = new Map();
    this.universe = new UniverseEngine();
    this.rafId = null;
    this.lastTime = 0;
    this.isRunning = false;
    this.reducedMotion = false;
    this.scene001Duration = 10;
    this.scene001Elapsed = 0;
    this.scene002Registered = false;
    this.scene002Instance = null;
    this.scene002Elapsed = 0;
    this.scene003Registered = false;
    this.scene003Instance = null;
    this.scene004Registered = false;
    this.scene004Instance = null;
    this.connectionDataForScene004 = null;
  }

  /**
   * Initialize the engine and all managers.
   * @returns {Promise<void>}
   */
  async init() {
    this.state = MANAGER_STATES.INITIALIZING;
    this.reducedMotion = isReducedMotion();

    this.managers.set('performance', new PerformanceManager());
    this.managers.set('scene', new SceneManager());
    this.managers.set('animation', new AnimationManager());
    this.managers.set('scroll', new ScrollManager());
    this.managers.set('cursor', new CursorManager());
    this.managers.set('physics', new PhysicsManager());
    this.managers.set('lighting', new LightingManager());
    this.managers.set('audio', new AudioManager());

    this.managers.forEach(manager => {
      manager.init();
    });

    this.initUniverse();
    this.setupEventListeners();
    this.start();

    await this.initScene001();
    this.initScene002();
    this.initScene003();
    this.initScene004();
    this.state = MANAGER_STATES.READY;
  }

  /**
   * Initialize and enter Scene001_FirstBreath.
   * @returns {Promise<void>}
   */
  async initScene001() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene001_FirstBreath();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    await sceneManager.loadScene(scene.getId());
    await sceneManager.enterScene(scene.getId());
  }

  /**
   * Register Scene002_Awakening for later transition.
   */
  initScene002() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene002_Awakening();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene002Instance = scene;
    this.scene002Registered = true;
  }

  /**
   * Register Scene003_FirstConnection for later transition.
   */
  initScene003() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene003_FirstConnection();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene003Instance = scene;
    this.scene003Registered = true;
  }

  /**
   * Initialize the universe engine with required references.
   */
  initUniverse() {
    const container = document.getElementById('universe-container');
    if (!container) return;

    this.universe.init({
      container,
      performanceManager: this.managers.get('performance'),
      cursorManager: this.managers.get('cursor')
    });
  }

  /**
   * Get a manager by name.
   * @param {string} name - Manager identifier
   * @returns {Object|undefined} Manager instance
   */
  getManager(name) {
    return this.managers.get(name);
  }

  /**
   * Set up global event listeners.
   */
  setupEventListeners() {
    this.handleResize = debounce(this.resize.bind(this), 150);
    this.handleVisibilityChange = this.onVisibilityChange.bind(this);
    this.handleReducedMotionChange = this.onReducedMotionChange.bind(this);

    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionQuery.addEventListener('change', this.handleReducedMotionChange);
  }

  /**
   * Start the animation loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Stop the animation loop.
   */
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main animation frame loop.
   * @param {number} time - Current timestamp from requestAnimationFrame
   */
  tick(time) {
    if (!this.isRunning) return;

    const deltaTime = Math.min((time - this.lastTime) / 1000, settings.performance.maxDeltaTime);
    this.lastTime = time;

    const scroll = this.managers.get('scroll');
    if (scroll) scroll.update(time);

    const performance = this.managers.get('performance');
    if (performance) performance.update(deltaTime);

    const animation = this.managers.get('animation');
    if (animation) animation.update(deltaTime);

    const scene = this.managers.get('scene');
    if (scene) scene.update(deltaTime);

    const cursor = this.managers.get('cursor');
    if (cursor) cursor.update(deltaTime);

    const physics = this.managers.get('physics');
    if (physics) physics.update(deltaTime);

    const lighting = this.managers.get('lighting');
    if (lighting) lighting.update(deltaTime);

    this.universe.update(deltaTime);
    this.checkSceneTransition(deltaTime);

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Check scene transitions and advance when conditions are met.
   * @param {number} deltaTime - Frame delta in seconds
   */
  checkSceneTransition(deltaTime) {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Scene001 -> Scene002 transition (time-based)
    if (this.scene002Registered && sceneManager.currentScene === 'scene001_firstBreath') {
      this.scene001Elapsed += deltaTime;
      if (this.scene001Elapsed >= this.scene001Duration) {
        this.transitionToScene002();
      }
      return;
    }

    // Scene002 -> Scene003 transition (completion-based)
    if (this.scene003Registered && sceneManager.currentScene === 'scene002_awakening') {
      if (this.scene002Instance && this.scene002Instance.isCompleted()) {
        this.transitionToScene003();
      }
    }

    // Scene003 -> Scene004 transition (completion-based)
    if (this.scene004Registered && sceneManager.currentScene === 'scene003_firstConnection') {
      if (this.scene003Instance && this.scene003Instance.isCompleted()) {
        this.captureConnectionData();
        this.transitionToScene004();
      }
    }
  }

  /**
   * Transition from Scene001 to Scene002.
   */
  async transitionToScene002() {
    this.scene002Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    await sceneManager.loadScene('scene002_awakening');
    await sceneManager.enterScene('scene002_awakening');
  }

  /**
   * Transition from Scene002 to Scene003.
   */
  async transitionToScene003() {
    this.scene003Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    await sceneManager.loadScene('scene003_firstConnection');
    await sceneManager.enterScene('scene003_firstConnection');
  }

  /**
   * Register Scene004_Ripple for later transition.
   */
  initScene004() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene004_Ripple();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene004Instance = scene;
    this.scene004Registered = true;
  }

  /**
   * Transition from Scene003 to Scene004.
   * Captures connection data before Scene003 leaves.
   */
  async transitionToScene004() {
    this.scene004Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection midpoint data to Scene004
    if (this.connectionDataForScene004 && this.scene004Instance) {
      const cd = this.connectionDataForScene004;
      this.scene004Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    await sceneManager.loadScene('scene004_ripple');
    await sceneManager.enterScene('scene004_ripple');
  }

  /**
   * Capture connection data from Scene003 before transition.
   * Stores midpoint and particle indices for Scene004.
   */
  captureConnectionData() {
    if (!this.scene003Instance || !this.scene003Instance.connectionManager) {
      this.connectionDataForScene004 = { midX: 0, midY: 0, indexA: -1, indexB: -1 };
      return;
    }

    const conn = this.scene003Instance.connectionManager.getConnectedParticles();
    if (conn.particleA && conn.particleB) {
      const midX = (conn.particleA.x + conn.particleB.x) * 0.5;
      const midY = (conn.particleA.y + conn.particleB.y) * 0.5;
      this.connectionDataForScene004 = {
        midX, midY, indexA: conn.indexA, indexB: conn.indexB
      };
    } else {
      this.connectionDataForScene004 = { midX: 0, midY: 0, indexA: -1, indexB: -1 };
    }
  }

  /**
   * Handle window resize.
   */
  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.managers.forEach(manager => {
      if (manager.resize) {
        manager.resize(width, height);
      }
    });

    this.universe.resize(width, height);
  }

  /**
   * Handle document visibility change (tab focus/blur).
   */
  onVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Handle reduced motion preference change.
   */
  onReducedMotionChange(event) {
    this.reducedMotion = event.matches;
    this.universe.setReducedMotion(event.matches);
  }

  /**
   * Destroy the engine and all managers. Release all resources.
   */
  destroy() {
    this.stop();

    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.reducedMotionQuery) {
      this.reducedMotionQuery.removeEventListener('change', this.handleReducedMotionChange);
    }

    this.universe.destroy();

    this.managers.forEach(manager => {
      if (manager.destroy) {
        manager.destroy();
      }
    });
    this.managers.clear();

    this.state = MANAGER_STATES.DESTROYED;
  }
}
