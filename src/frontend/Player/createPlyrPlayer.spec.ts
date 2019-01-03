import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('plyr', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  }));
});
jest.mock('jwt-decode', () => {
  return jest.fn().mockImplementation(() => ({
    session_id: 'abcd',
  }));
});

describe('createPlyrPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('creates Plyr player and configure it', () => {
    const player = createPlyrPlayer('ref' as any, 'jwt');

    expect(player.on).toHaveBeenNthCalledWith(
      1,
      'canplay',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      2,
      'playing',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(3, 'pause', expect.any(Function));
    expect(player.on).toHaveBeenNthCalledWith(
      4,
      'timeupdate',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      5,
      'seeking',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      6,
      'seeked',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(7, 'ended', expect.any(Function));
    expect(player.on).toHaveBeenNthCalledWith(
      8,
      'captionsdisabled',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      9,
      'captionsenabled',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      10,
      'enterfullscreen',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      11,
      'exitfullscreen',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      12,
      'languagechange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      13,
      'qualitychange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      14,
      'ratechange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      15,
      'volumechange',
      expect.any(Function),
    );
  });
});
