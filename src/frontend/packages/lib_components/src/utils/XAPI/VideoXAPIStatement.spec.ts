import fetchMock from 'fetch-mock';
import { XAPI_ENDPOINT } from 'lib-components';

import { videoMockFactory } from '@lib-components/tests/factories';
import { VerbDefinition } from '@lib-components/types/XAPI';
import { truncateDecimalDigits } from '@lib-components/utils/truncateDecimalDigits';

import { VideoXAPIStatement } from './VideoXAPIStatement';

describe('VideoXAPIStatement', () => {
  afterEach(() => fetchMock.reset());

  describe('VideoXAPIStatement.setDuration', () => {
    it('does not accept negative or 0 value', () => {
      const video = videoMockFactory();
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);

      expect(() => {
        xapiStatement.setDuration(-1);
      }).toThrow('duration must be strictly positive');

      expect(() => {
        xapiStatement.setDuration(0);
      }).toThrow('duration must be strictly positive');
    });

    it('accept only one modification', () => {
      const video = videoMockFactory();
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(20);

      expect(() => {
        xapiStatement.setDuration(10);
      }).toThrow('duration is already set. You can not modify it anymore');
    });
  });

  describe('VideoXAPIStatement.mergeSegments', () => {
    it('merges overlapping time segments', () => {
      const video = videoMockFactory();
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);

      expect(xapiStatement.mergeSegments(['0[.]5', '10[.]22'])).toBe(
        '0[.]5[,]10[.]22',
      );
      expect(xapiStatement.mergeSegments(['0[.]5', '4[.]22'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['0[.]5', '3[.]4'])).toBe('0[.]5');
      expect(xapiStatement.mergeSegments(['0[.]5', '22[.]10'])).toBe(
        '0[.]5[,]10[.]22',
      );
      expect(xapiStatement.mergeSegments(['0[.]5', '22[.]4'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['0[.]5', '4[.]3'])).toBe('0[.]5');
      expect(xapiStatement.mergeSegments(['5[.]0', '10[.]22'])).toBe(
        '0[.]5[,]10[.]22',
      );
      expect(xapiStatement.mergeSegments(['5[.]0', '4[.]22'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['5[.]0', '3[.]4'])).toBe('0[.]5');
      expect(xapiStatement.mergeSegments(['5[.]0', '22[.]10'])).toBe(
        '0[.]5[,]10[.]22',
      );
      expect(xapiStatement.mergeSegments(['5[.]0', '22[.]4'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['5[.]0', '4[.]3'])).toBe('0[.]5');

      // edge case tests (when start and end bounds are identical on adjacent segments)
      expect(xapiStatement.mergeSegments(['0[.]5', '5[.]22'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['0[.]5', '22[.]5'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['0[.]5', '3[.]5'])).toBe('0[.]5');
      expect(xapiStatement.mergeSegments(['0[.]5', '5[.]3'])).toBe('0[.]5');
      expect(xapiStatement.mergeSegments(['5[.]0', '5[.]22'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['5[.]0', '22[.]5'])).toBe('0[.]22');
      expect(xapiStatement.mergeSegments(['5[.]0', '3[.]5'])).toBe('0[.]5');
      expect(xapiStatement.mergeSegments(['5[.]0', '5[.]3'])).toBe('0[.]5');

      // merge identical segments
      expect(xapiStatement.mergeSegments(['0[.]5', '0[.]5'])).toBe('0[.]5');

      // merge overlapping segments and continue with new segments
      expect(
        xapiStatement.mergeSegments([
          '0[.]3.067',
          '3.092[.]77.944',
          '81.245[.]81.245',
          '86.036[.]86.036',
          '87.833[.]31.721',
        ]),
      ).toBe('0[.]3.067[,]3.092[.]87.833');
      expect(
        xapiStatement.mergeSegments([
          '0[.]1.065',
          '1.257[.]515.048',
          '0[.]515.048',
        ]),
      ).toBe('0[.]515.048');
      expect(
        xapiStatement.mergeSegments([
          '0[.]14.352',
          '14.532[.]119.96',
          '0[.]119.96',
        ]),
      ).toBe('0[.]119.96');
      expect(
        xapiStatement.mergeSegments([
          '0[.]1.333',
          '1.337[.]36.429',
          '36.585[.]250.757',
          '250.762[.]277.599',
          '250.714[.]250.714',
        ]),
      ).toBe(
        '0[.]1.333[,]1.337[.]36.429[,]36.585[.]250.757[,]250.762[.]277.599',
      );
    });
  });

  describe('VideoXAPIStatement.initialized', () => {
    it('post an initialized statement with only required extensions', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204);
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({
        length: 1,
      });
      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.initialized);
      expect(body.verb.display).toEqual({
        'en-US': 'initialized',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold':
          truncateDecimalDigits(xapiStatement.getCompletionThreshold()),
        'https://w3id.org/xapi/video/extensions/length': 1,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body).toHaveProperty('id');
    });

    it('post an initialized statement with all extensions', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({
        ccSubtitleEnabled: true,
        ccSubtitleLanguage: 'en-US',
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
      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.initialized);
      expect(body.verb.display).toEqual({
        'en-US': 'initialized',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/cc-subtitle-enabled': true,
        'https://w3id.org/xapi/video/extensions/cc-subtitle-lang': 'en-US',
        'https://w3id.org/xapi/video/extensions/completion-threshold':
          truncateDecimalDigits(xapiStatement.getCompletionThreshold()),
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
    });
  });

  describe('XAPIStatement.played', () => {
    it('sends a played statement', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(1);
      xapiStatement.played({
        time: 42.321,
      });
      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
    });
  });

  describe('VideoXAPIStatement.paused', () => {
    it('sends a paused statement without completion threshold', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(100);
      xapiStatement.played({ time: 0 });
      xapiStatement.paused({ time: 10 });

      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.paused);
      expect(body.verb.display).toEqual({
        'en-US': 'paused',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold':
          truncateDecimalDigits(xapiStatement.getCompletionThreshold()),
        'https://w3id.org/xapi/video/extensions/length': 100,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]10',
        'https://w3id.org/xapi/video/extensions/progress': 0.1,
        'https://w3id.org/xapi/video/extensions/time': 10,
      });
      expect(body).toHaveProperty('id');
    });
  });

  describe('XAPIStatement.seeked', () => {
    it('sends a seeked statement', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(100);
      xapiStatement.seeked({
        timeFrom: 0,
        timeTo: 10,
      });

      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
        'https://w3id.org/xapi/video/extensions/played-segments': '10',
        'https://w3id.org/xapi/video/extensions/progress': 0,
        'https://w3id.org/xapi/video/extensions/time-from': 0,
        'https://w3id.org/xapi/video/extensions/time-to': 10,
      });
      expect(body).toHaveProperty('id');
    });
  });

  describe('XAPIStatement.completed', () => {
    it('sends a completed statement when progress reaches 100%', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({ length: 100 });
      xapiStatement.played({ time: 0 });
      xapiStatement.paused({ time: 100 });
      // completed is delayed to have a realistic duration

      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.completed);
      expect(body.verb.display).toEqual({
        'en-US': 'completed',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold':
          truncateDecimalDigits(xapiStatement.getCompletionThreshold()),
        'https://w3id.org/xapi/video/extensions/length': 100,
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
    });

    it('sends a completed statement even if progress is higher 100%', () => {
      // This test is here to reproduce a scenario found in the plyr player.
      // In some cases the time code sent in the last paused event, when the video
      // ended, can be higher than the duration sent by plyr itself. In this case
      // the progression is higher than 100% and if we return it the completed event
      // is not sent because the progression is not strictly equal to 100%.
      // We are not using plyr anymore but keep this test to prevent similar behavior
      // in other players.

      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({ length: 74.582 });
      xapiStatement.played({ time: 0 });
      xapiStatement.paused({ time: 74.608 });

      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.completed);
      expect(body.verb.display).toEqual({
        'en-US': 'completed',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold':
          truncateDecimalDigits(xapiStatement.getCompletionThreshold()),
        'https://w3id.org/xapi/video/extensions/length': 74.582,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]74.608',
        'https://w3id.org/xapi/video/extensions/progress': 1,
        'https://w3id.org/xapi/video/extensions/time': 74.608,
      });
      expect(body.result.completion).toBe(true);
      expect(body.result.duration).toMatch(/^PT[0-9]*.?[0-9]*S$/);
      expect(body).toHaveProperty('id');
    });
  });

  describe('XAPIStatement.terminated', () => {
    it('sends terminated statement', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(100);
      xapiStatement.terminated({
        time: 50,
      });

      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.terminated);
      expect(body.verb.display).toEqual({
        'en-US': 'terminated',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold':
          truncateDecimalDigits(xapiStatement.getCompletionThreshold()),
        'https://w3id.org/xapi/video/extensions/length': 100,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '',
        'https://w3id.org/xapi/video/extensions/progress': 0,
        'https://w3id.org/xapi/video/extensions/time': 50,
      });
      expect(body).toHaveProperty('id');
    });

    it('sends a terminated statement with a segment started and not closed', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(100);
      xapiStatement.played({ time: 0 });
      xapiStatement.terminated({
        time: 50,
      });

      const calls = fetchMock.calls(`${XAPI_ENDPOINT}/video/${video.id}/`);

      const pausedCall = calls[1];

      const pausedRequestParameters = pausedCall[1]!;

      const pausedBody = JSON.parse(pausedRequestParameters.body as string);

      expect(pausedBody.verb.id).toEqual(VerbDefinition.paused);
      expect(pausedBody.verb.display).toEqual({
        'en-US': 'paused',
      });

      const terminatedCall = calls[2];
      const requestParameters = terminatedCall[1]!;
      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.terminated);
      expect(body.verb.display).toEqual({
        'en-US': 'terminated',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/completion-threshold':
          truncateDecimalDigits(xapiStatement.getCompletionThreshold()),
        'https://w3id.org/xapi/video/extensions/length': 100,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/played-segments': '0[.]50',
        'https://w3id.org/xapi/video/extensions/progress': 0.5,
        'https://w3id.org/xapi/video/extensions/time': 50,
      });
      expect(body).toHaveProperty('id');
    });
  });
  describe('XAPIStatement.interacted', () => {
    it('sends an interacted event with all context entensions', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(1);
      xapiStatement.interacted(
        {
          time: 50,
        },
        {
          ccSubtitleEnabled: true,
          ccSubtitleLanguage: 'en',
          frameRate: 29.97,
          fullScreen: true,
          quality: '480',
          speed: '1x',
          track: 'foo',
          videoPlaybackSize: '640x480',
          volume: 1,
        },
      );

      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.interacted);
      expect(body.verb.display).toEqual({
        'en-US': 'interacted',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/cc-subtitle-enabled': true,
        'https://w3id.org/xapi/video/extensions/cc-subtitle-lang': 'en',
        'https://w3id.org/xapi/video/extensions/frame-rate': 29.97,
        'https://w3id.org/xapi/video/extensions/full-screen': true,
        'https://w3id.org/xapi/video/extensions/quality': '480',
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
        'https://w3id.org/xapi/video/extensions/speed': '1x',
        'https://w3id.org/xapi/video/extensions/track': 'foo',
        'https://w3id.org/xapi/video/extensions/video-playback-size': '640x480',
        'https://w3id.org/xapi/video/extensions/volume': 1,
      });
      expect(body.result.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/time': 50,
      });
      expect(body).toHaveProperty('id');
    });
  });
  describe('VideoXAPIStatement played segment', () => {
    it('computes played segment', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({
        length: 100,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('');
      xapiStatement.played({ time: 0 });
      expect(xapiStatement.getPlayedSegment()).toBe('0');
      xapiStatement.seeked({
        timeFrom: 5,
        timeTo: 12,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12');
      xapiStatement.paused({ time: 22 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]22');
      xapiStatement.seeked({
        timeFrom: 22,
        timeTo: 15,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]22[,]15');
      xapiStatement.paused({ time: 55 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]55');
      xapiStatement.played({ time: 55 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]55[,]55');
      xapiStatement.paused({ time: 99.33 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]99.33');
      xapiStatement.played({ time: 99.33 });
      expect(xapiStatement.getPlayedSegment()).toBe(
        '0[.]5[,]12[.]99.33[,]99.33',
      );
      xapiStatement.paused({ time: 100 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]100');
    });
  });

  describe('VideoXAPIStatement.getProgress', () => {
    it('compute progress at random time', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({
        length: 100,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('');
      xapiStatement.played({ time: 0 });
      expect(xapiStatement.getPlayedSegment()).toBe('0');
      xapiStatement.seeked({
        timeFrom: 5,
        timeTo: 12,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12');
      xapiStatement.paused({ time: 22 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]22');
      xapiStatement.seeked({
        timeFrom: 22,
        timeTo: 15,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]22[,]15');
      xapiStatement.paused({ time: 55 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]55');
      xapiStatement.played({ time: 55 });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]5[,]12[.]55[,]55');

      expect(xapiStatement.getProgress()).toEqual(0.48);
    });

    it('compute progress when not started', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({
        length: 100,
      });
      expect(xapiStatement.getProgress()).toEqual(0);
    });

    it('compute progress with everything watched', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.initialized({
        length: 100,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('');
      xapiStatement.played({ time: 0 });
      expect(xapiStatement.getPlayedSegment()).toBe('0');
      xapiStatement.seeked({
        timeFrom: 12,
        timeTo: 5,
      });
      expect(xapiStatement.getPlayedSegment()).toBe('0[.]12[,]5');
      xapiStatement.paused({ time: 100 });
      expect(xapiStatement.getProgress()).toEqual(1);
    });
  });

  describe('VideoXAPIStatement.computeThreshold', () => {
    it('return a completion thresold equal to 0.95 when time is 600', () => {
      const video = videoMockFactory();
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(600);
      xapiStatement.computeCompletionThreshold();
      expect(xapiStatement.getCompletionThreshold()).toEqual(0.95);
    });
    it('return a completion threshold equal to 0.95 when duration is higher than 600', () => {
      const video = videoMockFactory();
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(600 * (Math.random() + 1));
      xapiStatement.computeCompletionThreshold();
      expect(xapiStatement.getCompletionThreshold()).toEqual(0.95);
    });
    it('return a completion closed to 0.70 when duration is less than 1 minute', () => {
      const video = videoMockFactory();
      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(1);
      xapiStatement.computeCompletionThreshold();
      expect(xapiStatement.getCompletionThreshold()).toBeCloseTo(0.7, 3);
    });
  });
  describe('VideoXAPIStatement.downloaded', () => {
    it('sends downloaded segment', () => {
      const video = videoMockFactory();
      fetchMock.mock(`${XAPI_ENDPOINT}/video/${video.id}/`, 204, {
        overwriteRoutes: true,
      });

      const xapiStatement = new VideoXAPIStatement('jwt', 'abcd', video.id);
      xapiStatement.setDuration(600);
      xapiStatement.downloaded(720);

      const lastCall = fetchMock.lastCall(
        `${XAPI_ENDPOINT}/video/${video.id}/`,
      );

      const requestParameters = lastCall![1]!;

      expect(requestParameters.headers).toEqual({
        Authorization: 'Bearer jwt',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });

      const body = JSON.parse(requestParameters.body as string);

      expect(body.verb.id).toEqual(VerbDefinition.downloaded);
      expect(body.verb.display).toEqual({
        'en-US': 'downloaded',
      });
      expect(body.context.extensions).toEqual({
        'https://w3id.org/xapi/video/extensions/length': 600,
        'https://w3id.org/xapi/video/extensions/quality': 720,
        'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      });
      expect(body).toHaveProperty('id');
    });
  });
});
