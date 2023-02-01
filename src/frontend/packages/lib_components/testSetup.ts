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

global.Request = require('node-fetch').Request;

import { TransformStream } from 'web-streams-polyfill/ponyfill';
const tds = {
  start() {
    this.decoder = new TextDecoder(this.encoding, this.options);
  },
  transform(chunk, controller) {
    controller.enqueue(this.decoder.decode(chunk));
  },
};
let _jstds_wm = new WeakMap(); /* info holder */
class TextDecoderStream extends TransformStream {
  constructor(encoding = 'utf-8', { ...options } = {}) {
    let t = { ...tds, encoding, options };

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
