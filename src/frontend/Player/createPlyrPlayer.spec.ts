import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('plyr', () => {
  return jest.fn().mockImplementation(() => ({
    elements: {
      buttons: {
        play: [
          {
            classList: {
              contains: jest.fn().mockReturnValue(true),
            },
            setAttribute: jest.fn(),
            tabIndex: 0,
          },
          {
            classList: {
              contains: jest.fn().mockReturnValue(false),
            },
            setAttribute: jest.fn(),
            tabIndex: 0,
          },
        ],
      },
    },
    on: jest.fn(),
  }));
});
jest.mock('../index', () => ({
  intl: {
    formatMessage: jest.fn(),
  },
}));

jest.mock('../data/appData', () => ({
  appData: { jwt: 'foo' },
  getDecodedJwt: jest.fn().mockImplementation(() => ({
    locale: 'en',
    session_id: 'abcd',
  })),
}));

describe('createPlyrPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('creates Plyr player and configure it', async () => {
    const player = await createPlyrPlayer('ref' as any, jest.fn());

    const playButton = player.elements.buttons.play! as HTMLButtonElement[];
    expect(playButton[0].tabIndex).toEqual(-1);
    expect(playButton[0].setAttribute).toHaveBeenCalledWith(
      'aria-hidden',
      'true',
    );
    expect(playButton[1].tabIndex).toEqual(0);
    expect(playButton[1].setAttribute).not.toHaveBeenCalled();

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
    expect(player.on).toHaveBeenNthCalledWith(
      7,
      'captionsdisabled',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      8,
      'captionsenabled',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      9,
      'enterfullscreen',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      10,
      'exitfullscreen',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      11,
      'languagechange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      12,
      'qualitychange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      13,
      'ratechange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      14,
      'volumechange',
      expect.any(Function),
    );
  });
});
