import { timedTextMode, uploadState } from '../types/tracks';
import { videoMockFactory } from '../utils/tests/factories';
import { jestMockOf } from '../utils/types';
import { createHlsPlayer } from './createHlsPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('./createHlsPlayer', () => ({
  createHlsPlayer: jest.fn(),
}));

const mockCreateHlsPlayer = createHlsPlayer as jestMockOf<
  typeof createHlsPlayer
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
  const video = videoMockFactory({
    description: 'Some description',
    id: 'video-id',
    is_ready_to_show: true,
    timed_text_tracks: [
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-1.vtt',
        source_url: 'https://example.com/timedtext/ttt-1.vtt',
        video: 'video-id',
        title: 'foo',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_show: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-2.vtt',
        source_url: 'https://example.com/timedtext/ttt-2.vtt',
        video: 'video-id',
        title: 'foo',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_show: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-3.vtt',
        source_url: 'https://example.com/timedtext/ttt-3.vtt',
        video: 'video-id',
        title: 'foo',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-4.vtt',
        source_url: 'https://example.com/timedtext/ttt-4.vtt',
        video: 'video-id',
        title: 'foo',
      },
    ],
    title: 'Some title',
    upload_state: uploadState.READY,
    urls: {
      manifests: {
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
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('creates Plyr player and configure it', () => {
    const player = createPlyrPlayer('ref' as any, jest.fn(), video.urls!);

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
});
