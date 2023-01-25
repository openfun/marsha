import 'init';
import 'public-path';
import { serviceWorkerRegistration } from 'lib-components';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') as HTMLElement,
);

serviceWorkerRegistration.unregister();
