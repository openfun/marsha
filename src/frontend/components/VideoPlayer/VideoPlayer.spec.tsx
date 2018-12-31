import '../../testSetup';

import { mount, shallow } from 'enzyme';
import * as React from 'react';
import shaka from 'shaka-player';

import { Video } from '../../types/tracks';
import { VideoPlayer } from './VideoPlayer';

const mockShakaPlayer: jest.Mocked<typeof shaka.Player> = shaka.Player as any;
const mockShakaPolyfill: jest.Mocked<
  typeof shaka.polyfill
> = shaka.polyfill as any;

const createPlayer = jest.fn(() => ({
  destroy: jest.fn(),
}));

describe('VideoPlayer', () => {
  const video = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_play: true,
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
    },
  } as Video;

  const props = {
    createPlayer,
    jwt: 'foo',
    video,
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders the video element with all the relevant sources', () => {
    const wrapper = shallow(<VideoPlayer {...props} />);

    expect(wrapper.html()).toContain(
      '<source src="https://example.com/hls.m3u8" type="application/vnd.apple.mpegURL"/>',
    );
    expect(wrapper.html()).toContain(
      '<source size="144" src="https://example.com/144p.mp4" type="video/mp4"/>',
    );
    expect(wrapper.html()).toContain(
      '<source size="1080" src="https://example.com/1080p.mp4" type="video/mp4"/>',
    );
  });

  it('starts up the player when it mounts', () => {
    // Mount so videojs is called with an element
    mount(<VideoPlayer {...props} />);
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'foo',
    );
  });

  it('cleans up the player when it unmounts', () => {
    const instance = shallow(
      <VideoPlayer {...props} />,
    ).instance() as VideoPlayer;
    instance.componentWillUnmount();
    expect(instance.state.player!.destroy).toHaveBeenCalled();
  });

  describe('in an EME enabled environment', () => {
    beforeEach(() => mockShakaPlayer.isBrowserSupported.mockReturnValue(true));

    it('instantiates shaka Player and loads our dash manifest', () => {
      mount(<VideoPlayer {...props} />);

      expect(mockShakaPlayer.prototype.constructor).toHaveBeenCalledWith(
        expect.any(HTMLMediaElement),
      );
      expect(mockShakaPolyfill.installAll).toHaveBeenCalled();
      expect(mockShakaPlayer.prototype.configure).toHaveBeenCalled();
      expect(mockShakaPlayer.prototype.load).toHaveBeenCalledWith(
        'https://example.com/dash.mpd',
      );
    });
  });

  describe('in an environment without EME', () => {
    beforeEach(() => mockShakaPlayer.isBrowserSupported.mockReturnValue(false));

    it('never instantiates shaka', () => {
      mount(<VideoPlayer {...props} />); // Mount so videojs is called with an element
      expect(mockShakaPlayer.prototype.constructor).not.toHaveBeenCalled();
      expect(mockShakaPlayer.prototype.load).not.toHaveBeenCalled();
    });
  });
});
