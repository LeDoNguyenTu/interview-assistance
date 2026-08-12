import '@candorlens/ui/styles/tokens.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DesktopApp } from './app.js';

const rootElement = document.querySelector('#root');

if (rootElement === null) {
  throw new Error('CandorLens desktop root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <DesktopApp />
  </StrictMode>,
);
