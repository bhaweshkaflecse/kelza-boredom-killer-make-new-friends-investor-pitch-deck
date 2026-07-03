/**
 * Application Entry Point
 * Initializes the Kelza Experience Platform engine.
 */

import { Engine } from './engine/Engine.js';
import { WhySection } from './sections/WhySection.js';
import '../css/main.css';

const engine = new Engine();

document.addEventListener('DOMContentLoaded', () => {
  engine.init();

  const whySection = new WhySection();
  whySection.reveal();
});

export { engine };
