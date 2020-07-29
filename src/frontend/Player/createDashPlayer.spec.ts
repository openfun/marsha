import { Video } from '../types/tracks';
import { createDashPlayer } from './createDashPlayer';

const mockInitialize = jest.fn();
const mockUpdateSettings = jest.fn();

jest.mock('dashjs', () => ({
  MediaPlayer: () => ({
    create: () => ({
      initialize: mockInitialize,
      updateSettings: mockUpdateSettings,
    }),
  }),
}));

describe('createDashPlayer', () => {
  afterEach(jest.clearAllMocks);

  it('instantiate, configure and return a dash instance', () => {
    const video = {
      urls: {
        manifests: {
          dash: 'https://example.com/manifest/dash.mpd',
        },
      },
    } as Video;

    createDashPlayer(video, 'ref' as any);

    expect(mockInitialize).toHaveBeenCalledWith(
      'ref',
      'https://example.com/manifest/dash.mpd',
      false,
    );
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      streaming: {
        abr: {
          initialBitrate: {
            video: 1600,
          },
          maxBitrate: {
            video: 2400,
          },
        },
        fastSwitchEnabled: true,
      },
    });
  });
});
