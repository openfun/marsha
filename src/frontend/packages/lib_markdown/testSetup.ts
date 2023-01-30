// Jest helpers for styled-components
import 'jest-styled-components';
// Jest helpers for testing-library
import '@testing-library/jest-dom';
import { setLogger } from 'react-query';
// Add TextEncoder & TextDecoder to jsdom
import { TextEncoder, TextDecoder } from 'util';

import { toMatchImageSnapshot } from 'jest-image-snapshot';
expect.extend({ toMatchImageSnapshot });

// see https://github.com/jsdom/jsdom/issues/2524
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

import ResizeObserver from 'resize-observer-polyfill';
global.ResizeObserver = ResizeObserver;

// During tests we want queries to be silent
// see https://react-query.tanstack.com/guides/testing#turn-off-network-error-logging
setLogger({ log: console.log, warn: console.warn, error: () => {} });
