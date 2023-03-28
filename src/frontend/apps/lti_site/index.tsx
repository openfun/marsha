import 'iframe-resizer/js/iframeResizer.contentWindow';

import { serviceWorkerRegistration } from 'lib-components';
import React from 'react';
import ReactDOM from 'react-dom';

import { App } from 'components/App';

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', async () => {
  ReactDOM.render(<App />, document.querySelector('#marsha-frontend-root'));
});

serviceWorkerRegistration.unregister();
