import fetchMock from 'fetch-mock';
import { report, useJwt, videoMockFactory } from 'lib-components';

import { createPlayer } from './createPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    flags: {},
  }),
  report: jest.fn(),
  decodeJwt: () => ({ locale: 'en', session_id: 'abcd' }),
}));

jest.mock('./createVideojsPlayer');

describe('createPlayer', () => {
  beforeEach(() => {
    useJwt.setState({ jwt: 'foo' });

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fetchMock.restore();
  });

  it('creates a videojs instance when type player is videojs', () => {
    const ref = 'ref' as any;
    const dispatchPlayerTimeUpdate = jest.fn();
    const video = videoMockFactory();

    createPlayer('videojs', ref, dispatchPlayerTimeUpdate, video);

    expect(createVideojsPlayer).toHaveBeenCalledWith(
      ref,
      dispatchPlayerTimeUpdate,
      video,
      undefined,
      undefined,
    );
  });

  it('reports an error if the player is not implemented', () => {
    const ref = 'ref' as any;
    const dispatchPlayerTimeUpdate = jest.fn();
    const video = videoMockFactory();

    expect(() =>
      createPlayer('unknown', ref, dispatchPlayerTimeUpdate, video),
    ).toThrow('player unknown not implemented');

    expect(report).toHaveBeenCalledWith(
      Error('player unknown not implemented'),
    );
  });
});
