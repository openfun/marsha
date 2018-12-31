import fetchMock from 'fetch-mock';
import { XAPI_ENDPOINT } from '../settings';
import { verbDefinition, XAPIStatement } from './XAPIStatement';

describe('XAPIStatement', () => {
  afterEach(() => fetchMock.reset());
  describe('XAPIStatement.initialized', () => {
    it('post an initialized statement with only required extensions', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204);
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.initialized({
        length: 1,
      });
      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(verbDefinition.initialized);
      expect(body.verb.display).toEqual({
        'en-US': 'initialized',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/length': 1,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });

    it('post an initialized statement with all extensions', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.initialized({
        ccSubtitleEnabled: true,
        ccSubtitleLanguage: 'en-US',
        completionTreshold: 1,
        frameRate: 29.97,
        fullScreen: false,
        length: 1,
        quality: '480',
        screenSize: '1080x960',
        speed: '1x',
        track: 'foo',
        userAgent: 'Mozilla/5.0',
        videoPlaybackSize: '1080x960',
        volume: 1,
      });
      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(verbDefinition.initialized);
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
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });
  });

  describe('XAPIStatement.played', () => {
    it('sends a played statement', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.played({
        time: 42.321,
      });
      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(verbDefinition.played);
      expect(body.verb.display).toEqual({
        'en-US': 'played',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/time': 42.321,
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });
  });
});
