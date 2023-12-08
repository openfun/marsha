import 'init';
import 'lib-common/cunningham-style';
import 'public-path';
import { createRoot } from 'react-dom/client';

import { App } from './features/App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('container not found!');
}

createRoot(container).render(<App />);
