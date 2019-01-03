import fetchMock from 'fetch-mock';

import { XAPI_ENDPOINT } from '../settings';
import { VerbDefinition } from '../types/XAPI';
import { XAPIStatement } from './XAPIStatement';

describe('XAPIStatement', () => {
  afterEach(() => fetchMock.reset());
  describe('XAPIStatement.toFixed', () => {
    it('should keeps 3 digits number', () => {
      expect(XAPIStatement.toFixed(1.123456789)).toBe(1.123);
    });

    it('should keeps indicated digits number', () => {
      expect(XAPIStatement.toFixed(1.123456789, 1)).toBe(1.1);
    });

    it('should not pad with 0 if there is not enought digit numbers', () => {
      expect(XAPIStatement.toFixed(1.12)).toBe(1.12);
    });
  });

  describe('XAPIStatement.duration', () => {
    it('does not accept negative or 0 value', () => {
      const xapiStatement = new XAPIStatement('jwt', 'abcd');

      expect(() => {
        xapiStatement.duration = -1;
      }).toThrowError('duration must be strictly positive');

      expect(() => {
        xapiStatement.duration = 0;
      }).toThrowError('duration must be strictly positive');
    });

    it('accept only one modification', () => {
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.duration = 20;

      expect(() => {
        xapiStatement.duration = 10;
      }).toThrowError('duration is already set. You can not modify it anymore');
    });
  });

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

      expect(body.verb.id).toEqual(VerbDefinition.initialized);
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

      expect(body.verb.id).toEqual(VerbDefinition.initialized);
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

      expect(body.verb.id).toEqual(VerbDefinition.played);
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

  describe('XAPIStatement.paused', () => {
    it('sends a paused statement without completion threshold', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.duration = 100;
      xapiStatement.played({ time: 0 });
      xapiStatement.paused({}, { time: 10 });

      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.paused);
      expect(body.verb.display).toEqual({
        'en-US': 'paused',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]10',
        'https://w3id.org/xapi/video/extensions/progress': 0.1,
        'https://w3id.org/xapi/video/extensions/time': 10,
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });

    it('sends a paused statement with completion threshold', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.duration = 100;
      xapiStatement.played({ time: 0 });
      xapiStatement.paused({ completionTreshold: 0.5 }, { time: 10 });

      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.paused);
      expect(body.verb.display).toEqual({
        'en-US': 'paused',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold': 0.5,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]10',
        'https://w3id.org/xapi/video/extensions/progress': 0.1,
        'https://w3id.org/xapi/video/extensions/time': 10,
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });
  });

  describe('XAPIStatement.seeked', () => {
    it('sends a seeked statement', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.duration = 100;
      xapiStatement.seeked({
        timeFrom: 0,
        timeTo: 10,
      });

      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.seeked);
      expect(body.verb.display).toEqual({
        'en-US': 'seeked',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/length': 100,
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]10',
        'https://w3id.org/xapi/video/extensions/progress': 0.1,
        'https://w3id.org/xapi/video/extensions/time-from': 0,
        'https://w3id.org/xapi/video/extensions/time-to': 10,
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });
  });

  describe('XAPIStatement.completed', () => {
    it('sends a completed statement without completion threshold', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.initialized({ length: 100 });
      xapiStatement.played({ time: 0 });
      // completed is delayed to have a realistic duration
      setTimeout(() => {
        xapiStatement.completed({});

        const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

        const requestParameters = lastCall[1];

        expect(requestParameters.headers).toEqual({
          Authorization: 'Bearer jwt',
          'Content-Type': 'application/json',
        });

        const body = JSON.parse(requestParameters.body as string);

        expect(body.verb.id).toEqual(VerbDefinition.completed);
        expect(body.verb.display).toEqual({
          'en-US': 'completed',
        });
        expect(body.context.extensions).toEqual({
          'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
        });
        expect(body.result.extensions).toEqual({
          'https://w3id.org/xapi/video/extensions/played-segments': '0[.]100',
          'https://w3id.org/xapi/video/extensions/progress': 1,
          'https://w3id.org/xapi/video/extensions/time': 100,
        });
        expect(body.result.completion).toBe(true);
        expect(body.result.duration).toMatch(/^PT[0-9]*.?[0-9]*S$/);
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('timestamp');
      }, 500);
    });

    it('sends a completed statement with completion threshold', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.initialized({ length: 100 });
      xapiStatement.played({ time: 0 });
      // completed is delayed to have a realistic duration
      setTimeout(() => {
        xapiStatement.completed({ completionTreshold: 0.5 });

        const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

        const requestParameters = lastCall[1];

        expect(requestParameters.headers).toEqual({
          Authorization: 'Bearer jwt',
          'Content-Type': 'application/json',
        });

        const body = JSON.parse(requestParameters.body as string);

        expect(body.verb.id).toEqual(VerbDefinition.completed);
        expect(body.verb.display).toEqual({
          'en-US': 'completed',
        });
        expect(body.context.extensions).toEqual({
          'https://w3id.org/xapi/video/extensions/completion-threshold': 0.5,
          'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
        });
        expect(body.result.extensions).toEqual({
          'https://w3id.org/xapi/video/extensions/played-segments': '0[.]100',
          'https://w3id.org/xapi/video/extensions/progress': 1,
          'https://w3id.org/xapi/video/extensions/time': 100,
        });
        expect(body.result.completion).toBe(true);
        expect(body.result.duration).toMatch(/^PT[0-9]*.?[0-9]*S$/);
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('timestamp');
      }, 500);
    });
  });

  describe('XAPIStatement.terminated', () => {
    it('sends terminated statement without completion threshold', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.duration = 100;
      xapiStatement.terminated(
        {},
        {
          time: 50,
        },
      );

      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.terminated);
      expect(body.verb.display).toEqual({
        'en-US': 'terminated',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]50',
        'https://w3id.org/xapi/video/extensions/progress': 0.5,
        'https://w3id.org/xapi/video/extensions/time': 50,
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });

    it('sends terminated statement with completion threshold', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.duration = 100;
      xapiStatement.terminated(
        {
          completionTreshold: 0.2,
        },
        {
          time: 50,
        },
      );

      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.terminated);
      expect(body.verb.display).toEqual({
        'en-US': 'terminated',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold': 0.2,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]50',
        'https://w3id.org/xapi/video/extensions/progress': 0.5,
        'https://w3id.org/xapi/video/extensions/time': 50,
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });
  });
  describe('XAPIStatement.interacted', () => {
    it('sends an interacted event with all context entensions', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.interacted({
        ccSubtitleEnabled: true,
        ccSubtitleLanguage: 'en',
        completionTreshold: 0.2,
        frameRate: 29.97,
        fullScreen: true,
        quality: '480',
        speed: '1x',
        track: 'foo',
        videoPlaybackSize: '640x480',
        volume: 1,
      });

      const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/`);

      const requestParameters = lastCall[1];

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.interacted);
      expect(body.verb.display).toEqual({
        'en-US': 'interacted',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/cc-subtitle-enabled': true,
        'https://w3id.org/xapi/video/extensions/cc-subtitle-lang': 'en',
        'https://w3id.org/xapi/video/extensions/completion-threshold': 0.2,
        'https://w3id.org/xapi/video/extensions/frame-rate': 29.97,
        'https://w3id.org/xapi/video/extensions/full-screen': true,
        'https://w3id.org/xapi/video/extensions/quality': '480',
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
        'https://w3id.org/xapi/video/extensions/speed': '1x',
        'https://w3id.org/xapi/video/extensions/track': 'foo',
        'https://w3id.org/xapi/video/extensions/video-playback-size': '640x480',
        'https://w3id.org/xapi/video/extensions/volume': 1,
      });
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('timestamp');
    });
  });
  describe('XAPIStatement played segment', () => {
    it('computes played segment', () => {
      fetchMock.mock(`${XAPI_ENDPOINT}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new XAPIStatement('jwt', 'abcd');
      xapiStatement.initialized({
        length: 100,
      });
      expect(xapiStatement.playedSegment).toBe('');
      xapiStatement.played({ time: 0 });
      expect(xapiStatement.playedSegment).toBe('0');
      xapiStatement.seeked({
        timeFrom: 5,
        timeTo: 12,
      });
      expect(xapiStatement.playedSegment).toBe('0[.]5[,]5[.]12');
      xapiStatement.paused({}, { time: 22 });
      expect(xapiStatement.playedSegment).toBe('0[.]5[,]5[.]12[,]12[.]22');
      xapiStatement.seeked({
        timeFrom: 22,
        timeTo: 15,
      });
      expect(xapiStatement.playedSegment).toBe(
        '0[.]5[,]5[.]12[,]12[.]22[,]22[.]15',
      );
      xapiStatement.played({ time: 15 });
      expect(xapiStatement.playedSegment).toBe(
        '0[.]5[,]5[.]12[,]12[.]22[,]22[.]15[,]15',
      );
      xapiStatement.paused({}, { time: 55 });
      expect(xapiStatement.playedSegment).toBe(
        '0[.]5[,]5[.]12[,]12[.]22[,]22[.]15[,]15[.]55',
      );
      xapiStatement.played({ time: 55 });
      expect(xapiStatement.playedSegment).toBe(
        '0[.]5[,]5[.]12[,]12[.]22[,]22[.]15[,]15[.]55[,]55',
      );
      xapiStatement.paused({}, { time: 99.33 });
      expect(xapiStatement.playedSegment).toBe(
        '0[.]5[,]5[.]12[,]12[.]22[,]22[.]15[,]15[.]55[,]55[.]99.33',
      );
      xapiStatement.completed({});
      expect(xapiStatement.playedSegment).toBe(
        '0[.]5[,]5[.]12[,]12[.]22[,]22[.]15[,]15[.]55[,]55[.]99.33[,]99.33[.]100',
      );
    });
  });
});
