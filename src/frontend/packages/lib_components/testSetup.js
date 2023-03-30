// Jest helpers for testing-library
import '@testing-library/jest-dom';
// Add TextEncoder & TextDecoder to jsdom
import { TextEncoder, TextDecoder } from 'util';

import { toMatchImageSnapshot } from 'jest-image-snapshot';
// Jest helpers for styled-components
import 'jest-styled-components';
import { setLogger } from 'react-query';
import ResizeObserver from 'resize-observer-polyfill';
import { TransformStream } from 'web-streams-polyfill/ponyfill';

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

global.Request = require('node-fetch').Request;

const tds = {
  start() {
    this.decoder = new TextDecoder(this.encoding, this.options);
  },
  transform(chunk, controller) {
    controller.enqueue(this.decoder.decode(chunk));
  },
};
const _jstds_wm = new WeakMap(); /* info holder */
class TextDecoderStream extends TransformStream {
  constructor(encoding = 'utf-8', { ...options } = {}) {
    const t = { ...tds, encoding, options };

    super(t);
    _jstds_wm.set(this, t);
  }
  get encoding() {
    return _jstds_wm.get(this).decoder.encoding;
  }
  get fatal() {
    return _jstds_wm.get(this).decoder.fatal;
  }
  get ignoreBOM() {
    return _jstds_wm.get(this).decoder.ignoreBOM;
  }
}
global.TextDecoderStream = global.TextDecoderStream || TextDecoderStream;
