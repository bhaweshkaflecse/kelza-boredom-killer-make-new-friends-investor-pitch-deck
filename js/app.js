/**
 * Application Entry Point
 * Initializes the Kelza Experience Platform engine.
 */

import { Engine } from './engine/Engine.js';
import '../css/main.css';

const engine = new Engine();

document.addEventListener('DOMContentLoaded', () => {
  engine.init();
});

export { engine };
