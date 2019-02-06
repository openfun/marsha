import '../../testSetup';

import { mount, shallow } from 'enzyme';
import * as React from 'react';
import shaka from 'shaka-player';

import { requestStatus } from '../../types/api';
import { timedTextMode, uploadState, Video } from '../../types/tracks';
import { Spinner } from '../Spinner/Spinner';
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
    getTimedTextTrackList: () => {},
    jwt: 'foo',
    timedtexttracks: {
      objects: [],
      status: requestStatus.PENDING,
    },
    video,
  };

  const loadedProps = {
    createPlayer,
    getTimedTextTrackList: () => {},
    jwt: 'foo',
    timedtexttracks: {
      objects: [
        {
          active_stamp: 1549385921,
          id: 'ttt-1',
          is_ready_to_play: true,
          language: 'fr',
          mode: timedTextMode.SUBTITLE,
          upload_state: uploadState.READY,
          url: 'https://example.com//timedtext/ttt-1.vtt',
          video,
        },
        {
          active_stamp: 1549385922,
          id: 'ttt-2',
          is_ready_to_play: false,
          language: 'fr',
          mode: timedTextMode.SUBTITLE,
          upload_state: uploadState.READY,
          url: 'https://example.com//timedtext/ttt-2.vtt',
          video,
        },
        {
          active_stamp: 1549385923,
          id: 'ttt-3',
          is_ready_to_play: true,
          language: 'fr',
          mode: timedTextMode.CLOSED_CAPTIONING,
          upload_state: uploadState.READY,
          url: 'https://example.com//timedtext/ttt-3.vtt',
          video,
        },
        {
          active_stamp: 1549385924,
          id: 'ttt-4',
          is_ready_to_play: true,
          language: 'fr',
          mode: timedTextMode.TRANSCRIPT,
          upload_state: uploadState.READY,
          url: 'https://example.com//timedtext/ttt-4.vtt',
          video,
        },
      ],
      status: requestStatus.SUCCESS,
    },
    video,
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders the video element with all the relevant sources', () => {
    const wrapper = shallow(<VideoPlayer {...loadedProps} />);
    const content = wrapper.html();

    expect(content).toContain(
      '<source src="https://example.com/hls.m3u8" type="application/vnd.apple.mpegURL"/>',
    );
    expect(content).toContain(
      '<source size="144" src="https://example.com/144p.mp4" type="video/mp4"/>',
    );
    expect(content).toContain(
      '<source size="1080" src="https://example.com/1080p.mp4" type="video/mp4"/>',
    );

    expect(content).toContain(
      '<track src="https://example.com//timedtext/ttt-1.vtt" srcLang="fr" kind="subtitles" label="fr"/>',
    );
    expect(content).toContain(
      '<track src="https://example.com//timedtext/ttt-3.vtt" srcLang="fr" kind="captions" label="fr"/>',
    );
  });

  it('starts up the player when Timedtexttracks are loaded', () => {
    // Mount so videojs is called with an element
    const wrapper = mount(<VideoPlayer {...props} />);
    expect(createPlayer).not.toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'foo',
    );

    expect(wrapper.find(Spinner).length).toBe(1);

    wrapper.setProps(loadedProps);
    wrapper.update();
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'foo',
    );
  });

  it('cleans up the player when it unmounts', () => {
    const wrapper = mount(<VideoPlayer {...props} />);
    wrapper.setProps(loadedProps);
    wrapper.update();
    const instance = wrapper.instance() as VideoPlayer;
    instance.componentWillUnmount();
    expect(instance.state.player!.destroy).toHaveBeenCalled();
  });

  describe('in an EME enabled environment', () => {
    beforeEach(() => mockShakaPlayer.isBrowserSupported.mockReturnValue(true));

    it('instantiates shaka Player and loads our dash manifest', () => {
      const wrapper = mount(<VideoPlayer {...props} />);
      wrapper.setProps(loadedProps);
      wrapper.update();

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
      const wrapper = mount(<VideoPlayer {...props} />);
      wrapper.setProps(loadedProps);
      wrapper.update(); // Mount so videojs is called with an element
      expect(mockShakaPlayer.prototype.constructor).not.toHaveBeenCalled();
      expect(mockShakaPlayer.prototype.load).not.toHaveBeenCalled();
    });
  });
});
