import 'marsha-config/jest/testSetup';
import { TransformStream } from 'web-streams-polyfill/ponyfill';

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
