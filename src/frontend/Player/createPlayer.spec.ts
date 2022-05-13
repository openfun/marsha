import fetchMock from 'fetch-mock';

import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';

import { createPlayer } from './createPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';

jest.mock('jwt-decode', () => {
  return jest.fn().mockImplementation(() => ({
    locale: 'en',
    session_id: 'abcd',
  }));
});

jest.mock('data/appData', () => ({
  appData: {
    flags: {},
    jwt: 'foo',
  },
}));

jest.mock('./createVideojsPlayer');
jest.mock('utils/errors/report');

describe('createPlayer', () => {
  beforeEach(() => {
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

    createPlayer('unknown', ref, dispatchPlayerTimeUpdate, video);

    expect(report).toHaveBeenCalledWith(
      Error('player unknown not implemented'),
    );
  });
});
