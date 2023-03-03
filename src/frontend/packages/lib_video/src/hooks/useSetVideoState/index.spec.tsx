import { renderHook } from '@testing-library/react-hooks';
import {
  useVideo,
  useTimedTextTrack,
  useThumbnail,
  useSharedLiveMedia,
  videoMockFactory,
  thumbnailMockFactory,
  timedTextMockFactory,
  sharedLiveMediaMockFactory,
} from 'lib-components';

import { useSetVideoState } from '.';

const mockedVideo = videoMockFactory({
  id: 'my-video-id',
  timed_text_tracks: [timedTextMockFactory({ id: 'my-timed-text-track-id' })],
  thumbnail: thumbnailMockFactory({ id: 'my-thumbnail-id' }),
  shared_live_medias: [
    sharedLiveMediaMockFactory({ id: 'my-shared-live-media-id' }),
  ],
});

describe('<useSetVideoState />', () => {
  it('initializes stores before render content', () => {
    expect(useVideo.getState().videos).toEqual({});
    expect(useTimedTextTrack.getState().timedtexttracks).toEqual({});
    expect(useThumbnail.getState().thumbnails).toEqual({});
    expect(useSharedLiveMedia.getState().sharedlivemedias).toEqual({});

    renderHook(() => useSetVideoState(mockedVideo));

    expect(useVideo.getState().videos).toEqual({
      ['my-video-id']: mockedVideo,
    });
    expect(useTimedTextTrack.getState().timedtexttracks).toEqual({
      ['my-timed-text-track-id']: mockedVideo.timed_text_tracks[0],
    });
    expect(useThumbnail.getState().thumbnails).toEqual({
      ['my-thumbnail-id']: mockedVideo.thumbnail,
    });
    expect(useSharedLiveMedia.getState().sharedlivemedias).toEqual({
      ['my-shared-live-media-id']: mockedVideo.shared_live_medias[0],
    });
  });
});
