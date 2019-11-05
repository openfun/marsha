import { Video } from '../types/tracks';
import { isHlsSupported, isMSESupported } from '../utils/isAbrSupported';
import { jestMockOf } from '../utils/types';
import { createDashPlayer } from './createDashPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('../utils/isAbrSupported', () => ({
  isHlsSupported: jest.fn(),
  isMSESupported: jest.fn(),
}));
const mockIsMSESupported = isMSESupported as jestMockOf<typeof isMSESupported>;
const mockIsHlsSupported = isHlsSupported as jestMockOf<typeof isHlsSupported>;

jest.mock('./createDashPlayer', () => ({
  createDashPlayer: jest.fn(),
}));

const mockCreateDashPlayer = createDashPlayer as jestMockOf<
  typeof createDashPlayer
>;

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
  appData: {
    jwt: 'foo',
    static: {
      svg: {
        plyr: '/static/svg/plyr.svg',
      },
    },
  },
  getDecodedJwt: jest.fn().mockImplementation(() => ({
    locale: 'en',
    session_id: 'abcd',
  })),
}));

describe('createPlyrPlayer', () => {
  const video = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_show: true,
    show_download: false,
    thumbnail: null,
    timed_text_tracks: [
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_show: false,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_show: true,
        language: 'en',
        mode: 'cc',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_show: true,
        language: 'fr',
        mode: 'ts',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-4.vtt',
      },
    ],
    title: 'Some title',
    upload_state: 'ready',
    urls: {
      manifests: {
        dash: 'https://example.com/dash.mpd',
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        144: 'https://example.com/144p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        720: 'https://example.com/144p.jpg',
      },
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('creates Plyr player and configure it', () => {
    mockIsMSESupported.mockReturnValue(false);
    mockIsHlsSupported.mockReturnValue(false);
    const player = createPlyrPlayer('ref' as any, jest.fn(), video as Video);

    expect(mockCreateDashPlayer).not.toHaveBeenCalled();

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
      'loadedmetadata',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      3,
      'loadeddata',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      4,
      'playing',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(5, 'pause', expect.any(Function));
    expect(player.on).toHaveBeenNthCalledWith(
      6,
      'timeupdate',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      7,
      'seeking',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      8,
      'seeked',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      9,
      'captionsdisabled',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      10,
      'captionsenabled',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      11,
      'enterfullscreen',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      12,
      'exitfullscreen',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      13,
      'languagechange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      14,
      'qualitychange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      15,
      'ratechange',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      16,
      'volumechange',
      expect.any(Function),
    );
  });
  it('creates Plyr player with DashJS', () => {
    mockIsMSESupported.mockReturnValue(true);

    const ref = 'ref' as any;
    createPlyrPlayer(ref, jest.fn(), video as Video);

    expect(mockCreateDashPlayer).toHaveBeenCalledWith(video, ref);
  });
  it('overrides sources when ABR and HLS is not available', () => {
    mockIsMSESupported.mockReturnValue(false);
    mockIsHlsSupported.mockReturnValue(false);

    const ref = 'ref' as any;
    const player = createPlyrPlayer(ref, jest.fn(), video as Video);

    expect(player.source).toEqual({
      sources: [
        { size: '144', src: 'https://example.com/144p.mp4', type: 'video/mp4' },
        {
          size: '1080',
          src: 'https://example.com/1080p.mp4',
          type: 'video/mp4',
        },
      ],
      tracks: [],
      type: 'video',
    });
  });
});
