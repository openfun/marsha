// Jest helpers for testing-library
import '@testing-library/jest-dom';
// Add TextEncoder & TextDecoder to jsdom
import { TextEncoder, TextDecoder } from 'util';

import { toMatchImageSnapshot } from 'jest-image-snapshot';
// Jest helpers for styled-components
import 'jest-styled-components';
import { setLogger } from 'react-query';
import ResizeObserver from 'resize-observer-polyfill';

expect.extend({ toMatchImageSnapshot });

// see https://github.com/jsdom/jsdom/issues/2524
global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextDecoder = TextDecoder;

global.ResizeObserver = ResizeObserver;

// During tests we want queries to be silent
// see https://react-query.tanstack.com/guides/testing#turn-off-network-error-logging
// eslint-disable-next-line @typescript-eslint/no-empty-function
setLogger({ log: console.log, warn: console.warn, error: () => {} });
