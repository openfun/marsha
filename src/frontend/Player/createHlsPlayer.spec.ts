import { createHlsPlayer } from './createHlsPlayer';

import { VideoUrls } from '../types/tracks';

jest.mock('hls.js', () => {
  return jest.fn(() => ({
    attachMedia: jest.fn(),
    loadSource: jest.fn(),
  }));
});

describe('createHlsPlayer', () => {
  const video = {
    id: 'video-id',
    urls: {
      manifests: {
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {},
      thumbnails: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates and configure hls.js player', () => {
    const player = createHlsPlayer(video.urls as VideoUrls, 'ref' as any);
    expect(player.attachMedia).toHaveBeenCalledWith('ref');
    expect(player.loadSource).toHaveBeenCalledWith(
      'https://example.com/hls.m3u8',
    );
  });
});
