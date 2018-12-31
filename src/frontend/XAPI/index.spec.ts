import fetchMock from 'fetch-mock';
import * as xAPI from '.';
import { XAPI_ENDPOINT } from '../settings';

describe('XAPI', () => {
  afterEach(() => fetchMock.reset());
  describe('XAPI.initialized', () => {
    it('post an initialized statement with only required extensions', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}`, 204);
      xAPI.initialized('jwt', {
        length: 1,
        sessionId: 'abcd',
      });
      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(xAPI.verbDefinition.initialized);
      expect(body.verb.display).toEqual({
        'en-US': 'initialized',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/length': 1,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
    });

    it('post an initialized statement with all extensions', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}`, 204, {
        overwriteRoutes: true,
      });
      xAPI.initialized('jwt', {
        ccSubtitleEnabled: true,
        ccSubtitleLanguage: 'en-US',
        completionTreshold: 1,
        frameRate: 29.97,
        fullScreen: false,
        length: 1,
        quality: '480',
        screenSize: '1080x960',
        sessionId: 'abcd',
        speed: '1x',
        track: 'foo',
        userAgent: 'Mozilla/5.0',
        videoPlaybackSize: '1080x960',
        volume: 1,
      });
      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(xAPI.verbDefinition.initialized);
      expect(body.verb.display).toEqual({
        'en-US': 'initialized',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/cc-subtitle-enabled': true,
        'https://w3id.org/xapi/video/extensions/cc-subtitle-lang': 'en-US',
        'https://w3id.org/xapi/video/extensions/completion-threshold': 1,
        'https://w3id.org/xapi/video/extensions/frame-rate': 29.97,
        'https://w3id.org/xapi/video/extensions/full-screen': false,
        'https://w3id.org/xapi/video/extensions/length': 1,
        'https://w3id.org/xapi/video/extensions/quality': '480',
        'https://w3id.org/xapi/video/extensions/screen-size': '1080x960',
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
        'https://w3id.org/xapi/video/extensions/speed': '1x',
        'https://w3id.org/xapi/video/extensions/track': 'foo',
        'https://w3id.org/xapi/video/extensions/user-agent': 'Mozilla/5.0',
        'https://w3id.org/xapi/video/extensions/video-playback-size':
          '1080x960',
        'https://w3id.org/xapi/video/extensions/volume': 1,
      });
    });
  });
});
