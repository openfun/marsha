import { videoMockFactory } from '../utils/tests/factories';
import { createPlayer } from './createPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';
import { report } from '../utils/errors/report';

jest.mock('jwt-decode', () => {
  return jest.fn().mockImplementation(() => ({
    locale: 'en',
    session_id: 'abcd',
  }));
});

jest.mock('../data/appData', () => ({
  appData: {
    flags: {},
    jwt: 'foo',
  },
}));

jest.mock('./createPlyrPlayer');
jest.mock('./createVideojsPlayer');
jest.mock('../utils/errors/report');

describe('createPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a plyr instance when type player is plyr', () => {
    const ref = 'ref' as any;
    const dispatchPlayerTimeUpdate = jest.fn();
    const video = videoMockFactory();

    createPlayer('plyr', ref, dispatchPlayerTimeUpdate, video);

    expect(createPlyrPlayer).toHaveBeenCalledWith(
      ref,
      dispatchPlayerTimeUpdate,
      video.urls!,
    );
  });

  it('creates a videojs instance when type player is videojs', () => {
    const ref = 'ref' as any;
    const dispatchPlayerTimeUpdate = jest.fn();
    const video = videoMockFactory();

    createPlayer('videojs', ref, dispatchPlayerTimeUpdate, video);

    expect(createVideojsPlayer).toHaveBeenCalledWith(
      ref,
      dispatchPlayerTimeUpdate,
      video.urls!,
      video.live_state,
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
