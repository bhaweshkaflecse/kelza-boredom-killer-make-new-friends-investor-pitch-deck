/**
 * Application Entry Point
 * Initializes the Kelza Experience Platform engine.
 */

import { Engine } from './engine/Engine.js';
import { WhySection } from './sections/WhySection.js';
import { MeetKelzaSection } from './sections/MeetKelzaSection.js';
import { WhatIsKelzaSection } from './sections/WhatIsKelzaSection.js';
import { ProductWalkthrough } from './sections/ProductWalkthrough.js';
import { RetentionSection } from './sections/RetentionSection.js';
import { BusinessSection } from './sections/BusinessSection.js';
import { WhyNowSection } from './sections/WhyNowSection.js';
import { CompetitiveSection } from './sections/CompetitiveSection.js';
import '../css/main.css';

const engine = new Engine();

document.addEventListener('DOMContentLoaded', () => {
  engine.init();

  const whySection = new WhySection();
  whySection.reveal();

  const meetKelzaSection = new MeetKelzaSection();
  meetKelzaSection.reveal();

  const whatIsKelzaSection = new WhatIsKelzaSection();
  whatIsKelzaSection.reveal();

  const productWalkthrough = new ProductWalkthrough();
  productWalkthrough.reveal();

  const retentionSection = new RetentionSection();
  retentionSection.reveal();

  const businessSection = new BusinessSection();
  businessSection.reveal();

  const whyNowSection = new WhyNowSection();
  whyNowSection.reveal();

  const competitiveSection = new CompetitiveSection();
  competitiveSection.reveal();
});

export { engine };
