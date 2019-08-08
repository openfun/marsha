import { render } from '@testing-library/react';
import React from 'react';

import { appData } from '../../appData';

import { useVideo, useVideoApi } from '.';
import { modelName } from '../../../types/models';

jest.mock('../../appData', () => ({
  appData: {
    video: {
      description: 'Some description',
      id: 'video-id',
      is_ready_to_play: true,
      show_download: false,
      thumbnail: null,
      timed_text_tracks: [
        {
          active_stamp: 1549385921,
          id: 'ttt-1',
          is_ready_to_play: true,
          language: 'fr',
          mode: 'st',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-1.vtt',
        },
        {
          active_stamp: 1549385922,
          id: 'ttt-2',
          is_ready_to_play: false,
          language: 'fr',
          mode: 'st',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-2.vtt',
        },
        {
          active_stamp: 1549385923,
          id: 'ttt-3',
          is_ready_to_play: true,
          language: 'en',
          mode: 'cc',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-3.vtt',
        },
        {
          active_stamp: 1549385924,
          id: 'ttt-4',
          is_ready_to_play: true,
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
    },
  },
}));

describe('stores/useVideo', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = () => {
    const hookValues = useVideo();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  it('parses appData to found video element', () => {
    render(<TestComponent />);

    const state = getLatestHookValues();

    expect(state[modelName.VIDEOS]).toEqual({
      'video-id': appData.video,
    });
    expect(state.getVideo({ id: 'video-id' })).toEqual(appData.video);
  });
  it('adds a resource to the store', () => {
    useVideoApi.getState().addResource({ id: 'newResource' } as any);

    expect(useVideoApi.getState()[modelName.VIDEOS].newResource).toEqual({ id: 'newResource' });
  });
  it('removes an existing resource', () => {
    useVideoApi.getState().addResource({ id: 'toDelete' } as any);

    expect(useVideoApi.getState()[modelName.VIDEOS].toDelete).toEqual({ id: 'toDelete' });

    useVideoApi.getState().removeResource({ id: 'toDelete' } as any);

    expect(useVideoApi.getState()[modelName.VIDEOS].toDelete).toBeUndefined();
  });
  it('adds multiple resources to the store', () => {
    useVideoApi.getState().addMultipleResources([
      { id: 'multi1' } as any,
      { id: 'multi2' } as any,
      { id: 'multi3' } as any,
    ]);

    expect(useVideoApi.getState()[modelName.VIDEOS].multi1).toEqual({ id: 'multi1' });
    expect(useVideoApi.getState()[modelName.VIDEOS].multi2).toEqual({ id: 'multi2' });
    expect(useVideoApi.getState()[modelName.VIDEOS].multi3).toEqual({ id: 'multi3' });
  });
});
