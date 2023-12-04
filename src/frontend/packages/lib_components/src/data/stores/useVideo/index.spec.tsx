import { render } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from '@lib-components/tests';
import { modelName } from '@lib-components/types/models';
import { timedTextMode, uploadState } from '@lib-components/types/tracks';

import { useVideo } from '.';

const video = videoMockFactory({
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
      mode: timedTextMode.SUBTITLE,
      upload_state: uploadState.READY,
      url: 'https://example.com/timedtext/ttt-1.vtt',
      source_url: 'some_url',
      video: 'video-id',
      title: 'subtitle1',
    },
    {
      active_stamp: 1549385922,
      id: 'ttt-2',
      is_ready_to_show: false,
      language: 'fr',
      mode: timedTextMode.SUBTITLE,
      upload_state: uploadState.READY,
      url: 'https://example.com/timedtext/ttt-2.vtt',
      source_url: 'some_url_2',
      video: 'video-id',
      title: 'subtitle2',
    },
    {
      active_stamp: 1549385923,
      id: 'ttt-3',
      is_ready_to_show: true,
      language: 'en',
      mode: timedTextMode.CLOSED_CAPTIONING,
      upload_state: uploadState.READY,
      url: 'https://example.com/timedtext/ttt-3.vtt',
      source_url: 'some_url_3',
      video: 'video-id',
      title: 'subtitle3',
    },
    {
      active_stamp: 1549385924,
      id: 'ttt-4',
      is_ready_to_show: true,
      language: 'fr',
      mode: timedTextMode.TRANSCRIPT,
      upload_state: uploadState.READY,
      url: 'https://example.com/timedtext/ttt-4.vtt',
      source_url: 'some_url_4',
      video: 'video-id',
      title: 'subtitle4',
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

describe('stores/useVideo', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = () => {
    const hookValues = useVideo();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  beforeEach(() => {
    useVideo.getState().addResource(video);
  });

  it('parses appData to found video element', () => {
    render(<TestComponent />);

    const state = getLatestHookValues();

    expect(state[modelName.VIDEOS]).toEqual({
      'video-id': video,
    });
    expect(state.getVideo({ id: 'video-id' })).toEqual(video);
  });

  it('adds a resource to the store', () => {
    useVideo.getState().addResource({ id: 'newResource' } as any);

    expect(useVideo.getState()[modelName.VIDEOS].newResource).toEqual({
      id: 'newResource',
    });
  });

  it('removes an existing resource', () => {
    useVideo.getState().addResource({ id: 'toDelete' } as any);

    expect(useVideo.getState()[modelName.VIDEOS].toDelete).toEqual({
      id: 'toDelete',
    });

    useVideo.getState().removeResource({ id: 'toDelete' } as any);

    expect(useVideo.getState()[modelName.VIDEOS].toDelete).toBeUndefined();
  });

  it('adds multiple resources to the store', () => {
    useVideo
      .getState()
      .addMultipleResources([
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

    expect(useVideo.getState()[modelName.VIDEOS].multi1).toEqual({
      id: 'multi1',
    });
    expect(useVideo.getState()[modelName.VIDEOS].multi2).toEqual({
      id: 'multi2',
    });
    expect(useVideo.getState()[modelName.VIDEOS].multi3).toEqual({
      id: 'multi3',
    });
  });

  it('keeps jitsi infos if already existing', () => {
    const live = videoMockFactory({
      live_info: {
        medialive: { input: { endpoints: ['endpoint1'] } },
        jitsi: {
          external_api_url: 'https://example.com/jitsi',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
    });
    useVideo.getState().addResource(live);

    expect(useVideo.getState().getVideo(live).live_info).toEqual({
      medialive: { input: { endpoints: ['endpoint1'] } },
      jitsi: {
        external_api_url: 'https://example.com/jitsi',
        config_overwrite: {},
        interface_config_overwrite: {},
        room_name: 'jitsi_conference',
      },
    });

    useVideo.getState().addResource({ ...live, live_info: {} });

    expect(useVideo.getState().getVideo(live).live_info).toEqual({
      jitsi: {
        external_api_url: 'https://example.com/jitsi',
        config_overwrite: {},
        interface_config_overwrite: {},
        room_name: 'jitsi_conference',
      },
    });
  });
});
