import 'iframe-resizer/js/iframeResizer.contentWindow';

import { serviceWorkerRegistration } from 'lib-components';
import { createRoot } from 'react-dom/client';

import { App } from 'components/App';

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('#marsha-frontend-root');
  if (!container) {
    throw new Error('container not found!');
  }

  const root = createRoot(container);
  root.render(<App />);
});

serviceWorkerRegistration.unregister();
