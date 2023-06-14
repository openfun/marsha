import 'init';
import { serviceWorkerRegistration } from 'lib-components';
import 'public-path';
import { createRoot } from 'react-dom/client';

import { App } from './features/App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('container not found!');
}

const root = createRoot(container);
root.render(<App />);

serviceWorkerRegistration.unregister();
