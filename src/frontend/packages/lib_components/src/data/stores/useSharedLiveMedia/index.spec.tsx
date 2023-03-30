import { render } from '@testing-library/react';
import React from 'react';

import { modelName } from '@lib-components/types/models';
import { uploadState } from '@lib-components/types/tracks';

import { useSharedLiveMedia } from '.';

const sharedLiveMedia = {
  id: 'sharedLiveMediaId',
  filename: 'filename.pdf',
  is_ready_to_show: false,
  show_download: true,
  upload_state: uploadState.PROCESSING,
  urls: {
    media: 'www.example.com/media-url',
    pages: {
      1: 'www.example.com/media-url/1',
      2: 'www.example.com/media-url/2',
      3: 'www.example.com/media-url/3',
    },
  },
  video: 'videoId',
  active_stamp: null,
  nb_pages: 3,
  title: 'my title',
};

const video = {
  id: 'videoId',
  shared_live_medias: [sharedLiveMedia],
};

describe('stores/useSharedLiveMedia', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = () => {
    const hookValues = useSharedLiveMedia();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  beforeEach(() => {
    useSharedLiveMedia.getState().addResource(sharedLiveMedia);
  });

  it('parses appData to found video element and its associated shared media live', () => {
    render(<TestComponent />);
    const state = getLatestHookValues();

    expect(state[modelName.SHAREDLIVEMEDIAS]).toEqual({
      sharedLiveMediaId: sharedLiveMedia,
    });
    expect(state.getSharedLiveMedias({ id: sharedLiveMedia.id })).toEqual(
      video.shared_live_medias,
    );
  });

  it('adds a shared media live to the store', () => {
    useSharedLiveMedia.getState().addResource({ id: 'newResource' } as any);

    expect(
      useSharedLiveMedia.getState()[modelName.SHAREDLIVEMEDIAS].newResource,
    ).toEqual({
      id: 'newResource',
    });
  });

  it('removes an existing shared media live', () => {
    useSharedLiveMedia.getState().addResource({ id: 'toDelete' } as any);

    expect(
      useSharedLiveMedia.getState()[modelName.SHAREDLIVEMEDIAS].toDelete,
    ).toEqual({
      id: 'toDelete',
    });

    useSharedLiveMedia.getState().removeResource({ id: 'toDelete' } as any);

    expect(
      useSharedLiveMedia.getState()[modelName.SHAREDLIVEMEDIAS].toDelete,
    ).toBeUndefined();
  });

  it('adds multiple shared media live to the store', () => {
    useSharedLiveMedia
      .getState()
      .addMultipleResources([
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

    expect(
      useSharedLiveMedia.getState()[modelName.SHAREDLIVEMEDIAS].multi1,
    ).toEqual({
      id: 'multi1',
    });
    expect(
      useSharedLiveMedia.getState()[modelName.SHAREDLIVEMEDIAS].multi2,
    ).toEqual({
      id: 'multi2',
    });
    expect(
      useSharedLiveMedia.getState()[modelName.SHAREDLIVEMEDIAS].multi3,
    ).toEqual({
      id: 'multi3',
    });
  });
});
