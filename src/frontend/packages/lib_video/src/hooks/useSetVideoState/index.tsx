import { Nullable } from 'lib-common';
import {
  Video,
  useSharedLiveMedia,
  useThumbnail,
  useTimedTextTrack,
  useVideo,
} from 'lib-components';
import { useEffect, useRef } from 'react';

export const useSetVideoState = (video?: Nullable<Video>) => {
  const videoId = useRef<string>();
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
    if (!video?.id || videoId.current === video.id) {
      return;
    }

    videoId.current = video.id;
    addVideo(video);
  }, [addVideo, video?.id, video]);

  useEffect(() => {
    if (video?.thumbnail) {
      addThumbnail(video.thumbnail);
    }

    return () => {
      resetThumbnail();
    };
  }, [addThumbnail, resetThumbnail, video?.thumbnail]);

  useEffect(() => {
    if (video?.shared_live_medias && video.shared_live_medias.length > 0) {
      addMultipleSharedLiveMedia(video.shared_live_medias);
    }

    return () => {
      resetSharedLiveMedia();
    };
  }, [
    addMultipleSharedLiveMedia,
    resetSharedLiveMedia,
    video?.shared_live_medias,
  ]);

  useEffect(() => {
    if (video?.timed_text_tracks && video.timed_text_tracks.length > 0) {
      addMultipleTimedTextTrack(video.timed_text_tracks);
    }

    return () => {
      resetTimedTextTrack();
    };
  }, [
    addMultipleTimedTextTrack,
    resetTimedTextTrack,
    video?.timed_text_tracks,
  ]);
};
