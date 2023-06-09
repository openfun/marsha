import 'init';
import 'public-path';
import { serviceWorkerRegistration } from 'lib-components';
import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './features/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('container not found!');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

serviceWorkerRegistration.unregister();
