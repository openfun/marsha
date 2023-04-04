// Jest helpers for styled-components
import 'jest-styled-components';
// Jest helpers for testing-library
import '@testing-library/jest-dom';
// Add TextEncoder & TextDecoder to jsdom
import { TextEncoder, TextDecoder } from 'util';

import { toMatchImageSnapshot } from 'jest-image-snapshot';
import React from 'react';
import { setLogger } from 'react-query';
import ResizeObserver from 'resize-observer-polyfill';

expect.extend({ toMatchImageSnapshot });

// see https://github.com/jsdom/jsdom/issues/2524
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ResizeObserver = ResizeObserver;

// During tests we want queries to be silent
// see https://react-query.tanstack.com/guides/testing#turn-off-network-error-logging
setLogger({ log: console.log, warn: console.warn, error: () => {} });
global.Request = require('node-fetch').Request;

// To be able to not use the `import React from 'react'` in every tsx file
global.React = React;
