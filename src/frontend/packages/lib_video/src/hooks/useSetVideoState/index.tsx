import { Nullable } from 'lib-common';
import {
  useVideo,
  useTimedTextTrack,
  useThumbnail,
  useSharedLiveMedia,
  Video,
} from 'lib-components';
import { useEffect } from 'react';

export const useSetVideoState = (video?: Nullable<Video>) => {
  const addVideo = useVideo((state) => state.addResource);

  const { addMultipleTimedTextTrack, resetTimedTextTrack } = useTimedTextTrack(
    (state) => ({
      addMultipleTimedTextTrack: state.addMultipleResources,
      resetTimedTextTrack: state.reset,
    }),
  );

  const { addThumbnail, resetThumbnail } = useThumbnail((state) => ({
    addThumbnail: state.addResource,
    resetThumbnail: state.reset,
  }));

  const { addMultipleSharedLiveMedia, resetSharedLiveMedia } =
    useSharedLiveMedia((state) => ({
      addMultipleSharedLiveMedia: state.addMultipleResources,
      resetSharedLiveMedia: state.reset,
    }));

  useEffect(() => {
    if (!video) {
      return;
    }

    resetThumbnail();
    resetSharedLiveMedia();
    resetTimedTextTrack();

    addVideo(video);

    if (video.thumbnail) {
      addThumbnail(video.thumbnail);
    }
    if (video.timed_text_tracks && video.timed_text_tracks.length > 0) {
      addMultipleTimedTextTrack(video.timed_text_tracks);
    }
    if (video.shared_live_medias && video.shared_live_medias.length > 0) {
      addMultipleSharedLiveMedia(video.shared_live_medias);
    }
  }, [
    addMultipleTimedTextTrack,
    addMultipleSharedLiveMedia,
    addThumbnail,
    addVideo,
    resetSharedLiveMedia,
    resetThumbnail,
    resetTimedTextTrack,
    video,
  ]);
};
