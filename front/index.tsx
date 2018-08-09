import React from 'react';
import ReactDOM from 'react-dom';
import { RootComponent } from './components/RootComponent/RootComponent';

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  ReactDOM.render(
    <RootComponent />,
    document.querySelector('#marsha-frontend-root'),
  );
});
