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
import { Scene005_LivingNetwork } from '../scenes/Scene005_LivingNetwork.js';
import { Scene006_Recognition } from '../scenes/Scene006_Recognition.js';
import { Scene007_Memory } from '../scenes/Scene007_Memory.js';
import { Scene008_Revelation } from '../scenes/Scene008_Revelation.js';
import { Scene009_Descent } from '../scenes/Scene009_Descent.js';
import { Scene010_Arrival } from '../scenes/Scene010_Arrival.js';
import { Scene011_FirstConversation } from '../scenes/Scene011_FirstConversation.js';
import { InsightTransition } from '../sections/InsightTransition.js';

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
    this.scene005Registered = false;
    this.scene005Instance = null;
    this.scene006Registered = false;
    this.scene006Instance = null;
    this.scene007Registered = false;
    this.scene007Instance = null;
    this.scene008Registered = false;
    this.scene008Instance = null;
    this.scene009Registered = false;
    this.scene009Instance = null;
    this.scene010Registered = false;
    this.scene010Instance = null;
    this.scene011Registered = false;
    this.scene011Instance = null;
    this.connectionDataForScene004 = null;
    this.insightTransition = null;
    this.insightTriggered = false;
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
    this.initScene005();
    this.initScene006();
    this.initScene007();
    this.initScene008();
    this.initScene009();
    this.initScene010();
    this.initScene011();
    this.managers.get('scroll').lock();
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

    // Scene004 -> Scene005 transition (completion-based)
    if (this.scene005Registered && sceneManager.currentScene === 'scene004_ripple') {
      if (this.scene004Instance && this.scene004Instance.isCompleted()) {
        this.transitionToScene005();
      }
    }

    // Scene005 -> Scene006 transition (completion-based)
    if (this.scene006Registered && sceneManager.currentScene === 'scene005_livingNetwork') {
      if (this.scene005Instance && this.scene005Instance.isCompleted()) {
        this.transitionToScene006();
      }
    }

    // Scene006 -> Scene007 transition (completion-based)
    if (this.scene007Registered && sceneManager.currentScene === 'scene006_recognition') {
      if (this.scene006Instance && this.scene006Instance.isCompleted()) {
        this.transitionToScene007();
      }
    }

    // Scene007 -> Scene008 transition (completion-based)
    if (this.scene008Registered && sceneManager.currentScene === 'scene007_memory') {
      if (this.scene007Instance && this.scene007Instance.isCompleted()) {
        this.transitionToScene008();
      }
    }

    // Scene008 -> Scene009 transition (completion-based)
    if (this.scene009Registered && sceneManager.currentScene === 'scene008_revelation') {
      if (this.scene008Instance && this.scene008Instance.isCompleted()) {
        this.transitionToScene009();
      }
    }

    // Scene009 -> Scene010 transition (completion-based)
    if (this.scene010Registered && sceneManager.currentScene === 'scene009_descent') {
      if (this.scene009Instance && this.scene009Instance.isCompleted()) {
        this.transitionToScene010();
      }
    }

    // Scene010 -> Scene011 transition (completion-based)
    if (this.scene011Registered && sceneManager.currentScene === 'scene010_arrival') {
      if (this.scene010Instance && this.scene010Instance.isCompleted()) {
        this.transitionToScene011();
      }
    }

    // Scene011 -> Insight transition (completion-based)
    if (!this.insightTriggered && sceneManager.currentScene === 'scene011_firstConversation') {
      if (this.scene011Instance && this.scene011Instance.isCompleted()) {
        this.insightTriggered = true;
        this.triggerInsightTransition();
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
   * Register Scene005_LivingNetwork for later transition.
   */
  initScene005() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene005_LivingNetwork();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene005Instance = scene;
    this.scene005Registered = true;
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

    // Prevent frame-gap flash: tell Scene003 to skip environment teardown
    // since Scene004 will immediately re-enable the same environment state
    if (this.scene003Instance) {
      this.scene003Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene004_ripple');
    await sceneManager.enterScene('scene004_ripple');
  }

  /**
   * Transition from Scene004 to Scene005.
   * Passes the persistent connection data forward.
   */
  async transitionToScene005() {
    this.scene005Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection data to Scene005 (same persistent connection)
    if (this.connectionDataForScene004 && this.scene005Instance) {
      const cd = this.connectionDataForScene004;
      this.scene005Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    // Prevent frame-gap flash: tell Scene004 to skip environment teardown
    if (this.scene004Instance) {
      this.scene004Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene005_livingNetwork');
    await sceneManager.enterScene('scene005_livingNetwork');
  }

  /**
   * Register Scene006_Recognition for later transition.
   */
  initScene006() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene006_Recognition();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene006Instance = scene;
    this.scene006Registered = true;
  }

  /**
   * Transition from Scene005 to Scene006.
   * Passes the persistent connection data forward.
   */
  async transitionToScene006() {
    this.scene006Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection data to Scene006 (same persistent connection)
    if (this.connectionDataForScene004 && this.scene006Instance) {
      const cd = this.connectionDataForScene004;
      this.scene006Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    // Prevent frame-gap flash: tell Scene005 to skip environment teardown
    if (this.scene005Instance) {
      this.scene005Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene006_recognition');
    await sceneManager.enterScene('scene006_recognition');
  }

  /**
   * Register Scene007_Memory for later transition.
   */
  initScene007() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene007_Memory();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene007Instance = scene;
    this.scene007Registered = true;
  }

  /**
   * Transition from Scene006 to Scene007.
   * Passes the persistent connection data forward.
   */
  async transitionToScene007() {
    this.scene007Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection data to Scene007 (same persistent connection)
    if (this.connectionDataForScene004 && this.scene007Instance) {
      const cd = this.connectionDataForScene004;
      this.scene007Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    // Prevent frame-gap flash: tell Scene006 to skip environment teardown
    if (this.scene006Instance) {
      this.scene006Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene007_memory');
    await sceneManager.enterScene('scene007_memory');
  }

  /**
   * Register Scene008_Revelation for later transition.
   */
  initScene008() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene008_Revelation();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene008Instance = scene;
    this.scene008Registered = true;
  }

  /**
   * Transition from Scene007 to Scene008.
   * Passes the persistent connection data forward.
   */
  async transitionToScene008() {
    this.scene008Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection data to Scene008 (same persistent connection)
    if (this.connectionDataForScene004 && this.scene008Instance) {
      const cd = this.connectionDataForScene004;
      this.scene008Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    // Prevent frame-gap flash: tell Scene007 to skip environment teardown
    if (this.scene007Instance) {
      this.scene007Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene008_revelation');
    await sceneManager.enterScene('scene008_revelation');
  }

  /**
   * Register Scene009_Descent for later transition.
   */
  initScene009() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene009_Descent();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene009Instance = scene;
    this.scene009Registered = true;
  }

  /**
   * Transition from Scene008 to Scene009.
   * Passes the persistent connection data forward.
   */
  async transitionToScene009() {
    this.scene009Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection data to Scene009 (same persistent connection)
    if (this.connectionDataForScene004 && this.scene009Instance) {
      const cd = this.connectionDataForScene004;
      this.scene009Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    // Prevent frame-gap flash: tell Scene008 to skip environment teardown
    if (this.scene008Instance) {
      this.scene008Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene009_descent');
    await sceneManager.enterScene('scene009_descent');
  }

  /**
   * Register Scene010_Arrival for later transition.
   */
  initScene010() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene010_Arrival();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene010Instance = scene;
    this.scene010Registered = true;
  }

  /**
   * Transition from Scene009 to Scene010.
   * Passes the persistent connection data forward.
   */
  async transitionToScene010() {
    this.scene010Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection data to Scene010 (same persistent connection)
    if (this.connectionDataForScene004 && this.scene010Instance) {
      const cd = this.connectionDataForScene004;
      this.scene010Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    // Prevent frame-gap flash: tell Scene009 to skip environment teardown
    if (this.scene009Instance) {
      this.scene009Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene010_arrival');
    await sceneManager.enterScene('scene010_arrival');
  }

  /**
   * Register Scene011_FirstConversation for later transition.
   */
  initScene011() {
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    const scene = new Scene011_FirstConversation();
    scene.setUniverse(this.universe);
    sceneManager.registerScene(scene.getId(), scene);
    this.scene011Instance = scene;
    this.scene011Registered = true;
  }

  /**
   * Transition from Scene010 to Scene011.
   * Passes the persistent connection data forward.
   */
  async transitionToScene011() {
    this.scene011Registered = false;
    const sceneManager = this.managers.get('scene');
    if (!sceneManager) return;

    // Pass connection data to Scene011 (same persistent connection)
    if (this.connectionDataForScene004 && this.scene011Instance) {
      const cd = this.connectionDataForScene004;
      this.scene011Instance.setConnectionData(cd.midX, cd.midY, cd.indexA, cd.indexB);
    }

    // Prevent frame-gap flash: tell Scene010 to skip environment teardown
    if (this.scene010Instance) {
      this.scene010Instance.skipEnvironmentTeardown = true;
    }

    await sceneManager.loadScene('scene011_firstConversation');
    await sceneManager.enterScene('scene011_firstConversation');
  }

  /**
   * Trigger the Insight transition after Scene011 completes.
   * Creates InsightTransition and starts the cinematic bridge to the product experience.
   * The universe canvas stays active as a quiet backdrop.
   */
  triggerInsightTransition() {
    // Keep the universe canvas alive - prevent Scene011 from tearing down environment
    if (this.scene011Instance) {
      this.scene011Instance.skipEnvironmentTeardown = true;
    }

    this.insightTransition = new InsightTransition({
      engine: this,
      universe: this.universe,
      scrollManager: this.managers.get('scroll')
    });

    this.insightTransition.start();
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

    if (this.insightTransition) {
      this.insightTransition.destroy();
      this.insightTransition = null;
    }

    this.managers.forEach(manager => {
      if (manager.destroy) {
        manager.destroy();
      }
    });
    this.managers.clear();

    this.state = MANAGER_STATES.DESTROYED;
  }
}
