import 'iframe-resizer/js/iframeResizer.contentWindow';
import 'lib-video/lib/index.css';

import { serviceWorkerRegistration } from 'lib-components';
import React from 'react';
import ReactDOM from 'react-dom';

import { App } from 'components/App';

window.lti_context = true;

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', async () => {
  ReactDOM.render(<App />, document.querySelector('#marsha-frontend-root'));
});

serviceWorkerRegistration.register({
  swId: 'marsha-lti',
});
