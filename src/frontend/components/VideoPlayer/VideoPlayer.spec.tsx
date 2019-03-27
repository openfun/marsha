import '../../testSetup';

import { mount, shallow } from 'enzyme';
import React from 'react';

import { requestStatus } from '../../types/api';
import { timedTextMode, uploadState, Video } from '../../types/tracks';
import { isMSESupported } from '../../utils/isAbrSupported';
import { jestMockOf } from '../../utils/types';
import { VideoPlayer } from './VideoPlayer';

const mockInitialize = jest.fn();
const mockSetInitialBitrateFor = jest.fn();
jest.mock('dashjs', () => ({
  MediaPlayer: () => ({
    create: () => ({
      initialize: mockInitialize,
      setInitialBitrateFor: mockSetInitialBitrateFor,
    }),
  }),
}));

jest.mock('../../utils/isAbrSupported', () => ({
  isMSESupported: jest.fn(),
}));
const mockIsMSESupported = isMSESupported as jestMockOf<typeof isMSESupported>;

jest.mock('../TranscriptsConnected/TranscriptsConnected', () => ({
  TranscriptsConnected: () => <div>TranscriptsConnected</div>,
}));

describe('VideoPlayer', () => {
  const video = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_play: true,
    show_download: false,
    thumbnail: null,
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
  } as Video;

  const createPlayer = jest.fn(() => ({
    destroy: jest.fn(),
  }));
  const mockGetTimedTextTrackLanguageChoices = jest.fn();
  const props = {
    createPlayer,
    dispatch: jest.fn(),
    getTimedTextTrackLanguageChoices: mockGetTimedTextTrackLanguageChoices,
    jwt: 'foo',
    languageChoices: [{ label: 'French', value: 'fr' }],
    thumbnail: null,
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
          language: 'en',
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

  beforeEach(jest.clearAllMocks);

  it('starts up the player with DashJS and renders all the relevant sources', () => {
    // Simulate a browser that supports MSE and will use DashJS
    mockIsMSESupported.mockReturnValue(true);
    const wrapper = mount(<VideoPlayer {...props} />);

    // Sources for basic MP4 are not rendered as they are not useful when DashJS is active
    expect(wrapper.html()).not.toContain(
      '<source size="144" src="https://example.com/144p.mp4" type="video/mp4">',
    );
    expect(wrapper.html()).not.toContain(
      '<source size="1080" src="https://example.com/1080p.mp4" type="video/mp4">',
    );

    // Timed text tracks are rendered
    expect(mockGetTimedTextTrackLanguageChoices).toHaveBeenCalledWith('foo');
    expect(wrapper.html()).toContain(
      '<track src="https://example.com//timedtext/ttt-1.vtt" srclang="fr" kind="subtitles" label="French">',
    );
    expect(wrapper.html()).toContain(
      '<track src="https://example.com//timedtext/ttt-3.vtt" srclang="en" kind="captions" label="en">',
    );

    // The player is created and initialized with DashJS for adaptive bitrate
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'foo',
      props.dispatch,
    );
    expect(mockInitialize).toHaveBeenCalledWith(
      expect.any(Element),
      'https://example.com/dash.mpd',
      false,
    );
    expect(mockSetInitialBitrateFor).toHaveBeenCalledWith('video', 1600000);

    // `video.show_download` is `false`, so we do not offer downloads
    expect(wrapper.html()).not.toContain('Download this video');
  });

  it('allows video download when the video object specifies it', () => {
    const videoDownloableProps = {
      ...props,
      video: {
        ...props.video,
        show_download: true,
      },
    };
    const wrapper = mount(<VideoPlayer {...videoDownloableProps} />);
    expect(wrapper.html()).toContain('Download this video');
  });

  it('does not use DashJS when MSE are not supported', () => {
    // Simulate a browser that does not support MSE
    mockIsMSESupported.mockReturnValue(false);
    const wrapper = mount(<VideoPlayer {...props} />);

    // Sources for basic MP4 are rendered
    expect(wrapper.html()).toContain(
      '<source size="144" src="https://example.com/144p.mp4" type="video/mp4">',
    );
    expect(wrapper.html()).toContain(
      '<source size="1080" src="https://example.com/1080p.mp4" type="video/mp4">',
    );

    // Timed text tracks are rendered
    expect(mockGetTimedTextTrackLanguageChoices).toHaveBeenCalledWith('foo');
    expect(wrapper.html()).toContain(
      '<track src="https://example.com//timedtext/ttt-1.vtt" srclang="fr" kind="subtitles" label="French">',
    );
    expect(wrapper.html()).toContain(
      '<track src="https://example.com//timedtext/ttt-3.vtt" srclang="en" kind="captions" label="en">',
    );

    // The video player is created ...
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'foo',
      props.dispatch,
    );
    /// ... but the DashJS player is not initialized
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockSetInitialBitrateFor).not.toHaveBeenCalled();
  });

  it('cleans up the player when it unmounts', () => {
    const instance = shallow(
      <VideoPlayer {...props} />,
    ).instance() as VideoPlayer;
    instance.componentWillUnmount();
    expect(instance.state.player!.destroy).toHaveBeenCalled();
  });
});
