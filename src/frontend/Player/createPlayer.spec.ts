import { Video } from '../types/tracks';
import { createPlayer } from './createPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('jwt-decode', () => {
  return jest.fn().mockImplementation(() => ({
    locale: 'en',
    session_id: 'abcd',
  }));
});

jest.mock('../data/appData', () => ({
  appData: {
    jwt: 'foo',
  },
}));

jest.mock('./createPlyrPlayer');

describe('createPlayer', () => {
  it('creates a plyr instance when type player is plyr', () => {
    const ref = 'ref' as any;
    const dispatchPlayerTimeUpdate = jest.fn();
    const video = {} as Video;

    createPlayer('plyr', ref, dispatchPlayerTimeUpdate, video);

    expect(createPlyrPlayer).toHaveBeenCalledWith(
      ref,
      dispatchPlayerTimeUpdate,
      video,
    );
  });
});
