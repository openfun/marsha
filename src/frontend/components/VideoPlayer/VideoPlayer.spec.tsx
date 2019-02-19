import '../../testSetup';

import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { requestStatus } from '../../types/api';
import { timedTextMode, uploadState, Video } from '../../types/tracks';
import { VideoPlayer } from './VideoPlayer';

const createPlayer = jest.fn(() => ({
  destroy: jest.fn(),
}));

const mockInitialize = jest.fn();
const mockSetInitialBitrateFor = jest.fn();
const mockGetTimedTextTrackLanguageChoices = jest.fn();

jest.mock('dashjs', () => ({
  MediaPlayer: () => ({
    create: () => ({
      initialize: mockInitialize,
      setInitialBitrateFor: mockSetInitialBitrateFor,
    }),
  }),
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
      thumbnails: {
        720: 'https://example.com/144p.jpg',
      },
    },
  } as Video;

  const props = {
    createPlayer,
    getTimedTextTrackLanguageChoices: mockGetTimedTextTrackLanguageChoices,
    jwt: 'foo',
    languageChoices: [{ label: 'French', value: 'fr' }],
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

  it('renders the video element with all the relevant sources', () => {
    const wrapper = shallow(<VideoPlayer {...props} />);
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
      '<track src="https://example.com//timedtext/ttt-1.vtt" srcLang="fr" kind="subtitles" label="French"/>',
    );
    expect(content).toContain(
      '<track src="https://example.com//timedtext/ttt-3.vtt" srcLang="en" kind="captions" label="en"/>',
    );

    expect(mockGetTimedTextTrackLanguageChoices).toHaveBeenCalledWith('foo');
  });

  it('starts up the player when it mounts', () => {
    // Mount so videojs is called with an element
    mount(<VideoPlayer {...props} />);
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'foo',
    );

    expect(mockInitialize).toHaveBeenCalledWith(
      expect.any(Element),
      'https://example.com/dash.mpd',
      false,
    );
    expect(mockSetInitialBitrateFor).toHaveBeenCalledWith('video', 1600000);
  });

  it('cleans up the player when it unmounts', () => {
    const instance = shallow(
      <VideoPlayer {...props} />,
    ).instance() as VideoPlayer;
    instance.componentWillUnmount();
    expect(instance.state.player!.destroy).toHaveBeenCalled();
  });
});
