import fetchMock from 'fetch-mock';
import { XAPI_ENDPOINT } from 'lib-components';

import { liveMockFactory } from '@lib-components/tests/factories';
import { VerbDefinition } from '@lib-components/types/XAPI';

import { LiveXAPIStatement } from './LiveXapiStatement';

describe('LiveXapiStatement', () => {
  afterEach(() => fetchMock.reset());

  it('post an initialized statement with all extensions', () => {
    const live = liveMockFactory();
    fetchMock.mock(`${XAPI_ENDPOINT}/video/${live.id}/`, 204, {
      overwriteRoutes: true,
    });
    const xapiStatement = new LiveXAPIStatement('jwt', 'abcd', live.id);
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
    const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/video/${live.id}/`);

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
      'https://w3id.org/xapi/video/extensions/frame-rate': 29.97,
      'https://w3id.org/xapi/video/extensions/full-screen': false,
      'https://w3id.org/xapi/video/extensions/quality': '480',
      'https://w3id.org/xapi/video/extensions/screen-size': '1080x960',
      'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
      'https://w3id.org/xapi/video/extensions/speed': '1x',
      'https://w3id.org/xapi/video/extensions/track': 'foo',
      'https://w3id.org/xapi/video/extensions/user-agent': 'Mozilla/5.0',
      'https://w3id.org/xapi/video/extensions/video-playback-size': '1080x960',
      'https://w3id.org/xapi/video/extensions/volume': 1,
    });
    expect(body).toHaveProperty('id');
  });

  it('sends a play statement', () => {
    const live = liveMockFactory();
    fetchMock.mock(`${XAPI_ENDPOINT}/video/${live.id}/`, 204, {
      overwriteRoutes: true,
    });
    const xapiStatement = new LiveXAPIStatement('jwt', 'abcd', live.id);
    xapiStatement.played({
      time: 42.321,
    });
    const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/video/${live.id}/`);

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

  it('sends a pause statement', () => {
    const live = liveMockFactory();
    fetchMock.mock(`${XAPI_ENDPOINT}/video/${live.id}/`, 204, {
      overwriteRoutes: true,
    });
    const xapiStatement = new LiveXAPIStatement('jwt', 'abcd', live.id);
    xapiStatement.played({ time: 0 });
    xapiStatement.paused({ time: 10 });

    const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/video/${live.id}/`);

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
      'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
    });
    expect(body.result.extensions).toEqual({
      'https://w3id.org/xapi/video/extensions/played-segments': '0[.]10',
      'https://w3id.org/xapi/video/extensions/time': 10,
    });
    expect(body).toHaveProperty('id');
  });

  it('sends terminated statement', () => {
    const live = liveMockFactory();
    fetchMock.mock(`${XAPI_ENDPOINT}/video/${live.id}/`, 204, {
      overwriteRoutes: true,
    });
    const xapiStatement = new LiveXAPIStatement('jwt', 'abcd', live.id);
    xapiStatement.terminated({
      time: 50,
    });

    const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/video/${live.id}/`);

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
      'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
    });
    expect(body.result.extensions).toEqual({
      'https://w3id.org/xapi/video/extensions/played-segments': '',
      'https://w3id.org/xapi/video/extensions/time': 50,
    });
    expect(body).toHaveProperty('id');
  });

  it('sends a terminated statement with a segment started and not closed', () => {
    const live = liveMockFactory();
    fetchMock.mock(`${XAPI_ENDPOINT}/video/${live.id}/`, 204, {
      overwriteRoutes: true,
    });
    const xapiStatement = new LiveXAPIStatement('jwt', 'abcd', live.id);
    xapiStatement.played({ time: 0 });
    xapiStatement.terminated({
      time: 50,
    });

    const calls = fetchMock.calls(`${XAPI_ENDPOINT}/video/${live.id}/`);

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
      'https://w3id.org/xapi/video/extensions/session-id': 'abcd',
    });
    expect(body.result.extensions).toEqual({
      'https://w3id.org/xapi/video/extensions/played-segments': '0[.]50',
      'https://w3id.org/xapi/video/extensions/time': 50,
    });
    expect(body).toHaveProperty('id');
  });

  it('sends an interacted event with all context entensions', () => {
    const live = liveMockFactory();
    fetchMock.mock(`${XAPI_ENDPOINT}/video/${live.id}/`, 204, {
      overwriteRoutes: true,
    });
    const xapiStatement = new LiveXAPIStatement('jwt', 'abcd', live.id);
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

    const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/video/${live.id}/`);

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
