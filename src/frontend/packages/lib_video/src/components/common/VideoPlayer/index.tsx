import { Box } from 'grommet';
import { Maybe, Nullable } from 'lib-common';
import {
  useThumbnail,
  TimedText,
  timedTextMode,
  Video,
  videoSize,
} from 'lib-components';
import React, { useRef, useMemo, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useQueryClient } from 'react-query';

import { useTimedTextMetadata } from '@lib-video/api/useTimedTextMetadata';
import { createPlayer } from '@lib-video/components/common/Player/createPlayer';
import { MissingVideoUrlsException } from '@lib-video/errors';
import { useVideoProgress } from '@lib-video/hooks/useVideoProgress';
import { VideoPlayerInterface } from '@lib-video/types/VideoPlayer';

interface BaseVideoPlayerProps {
  video: Video;
  playerType: string;
  timedTextTracks: TimedText[];
  defaultVolume?: number;
}

export const VideoPlayer = ({
  video,
  playerType,
  timedTextTracks,
  defaultVolume,
}: BaseVideoPlayerProps) => {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const videoNodeRef = useRef<Nullable<HTMLVideoElement>>(null);
  const containerVideoRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef(intl.locale);
  const propsRef = useRef({
    video,
    playerType,
    defaultVolume,
    timedTextTracks,
  });

  const { data } = useTimedTextMetadata(video.id);
  const choices = useMemo(
    () =>
      data?.actions.POST.language.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [data?.actions.POST.language.choices],
  );
  const thumbnail = useThumbnail((state) => state.getThumbnail());

  const setPlayerCurrentTime = useVideoProgress(
    (state) => state.setPlayerCurrentTime,
  );

  const languages: { [key: string]: string } = useMemo(() => {
    if (choices) {
      return choices.reduce(
        (acc, current) => ({
          ...acc,
          [current.value]: current.label,
        }),
        {},
      );
    }

    return {};
  }, [choices]);
  const languagesRef = useRef(languages);
  const playerRef = useRef<Maybe<VideoPlayerInterface>>(undefined);

  /**
   * Initialize the video player.
   * Noop out if the video is missing, render will redirect to an error page.
   */
  useEffect(() => {
    if (propsRef.current.video && videoNodeRef.current) {
      // Instantiate the player and keep the instance in state
      playerRef.current = createPlayer(
        propsRef.current.playerType,
        videoNodeRef.current,
        setPlayerCurrentTime,
        propsRef.current.video,
        localeRef.current,
        (videoPlayer) => {
          if (propsRef.current.defaultVolume !== undefined) {
            videoPlayer.volume(
              Math.min(1, Math.max(0, propsRef.current.defaultVolume)),
            );
          }

          propsRef.current.timedTextTracks
            .filter((track) => track.is_ready_to_show)
            .filter((track) =>
              [
                timedTextMode.CLOSED_CAPTIONING,
                timedTextMode.SUBTITLE,
              ].includes(track.mode),
            )
            .forEach((track) => {
              if (playerRef.current) {
                playerRef.current.addTrack(track, languagesRef.current);
              }
            });
        },
      );
    }

    /** Make sure to destroy the player on unmount. */
    return () => playerRef.current && playerRef.current.destroy();
  }, [setPlayerCurrentTime]);

  useEffect(() => {
    if (video?.urls?.manifests && playerRef.current) {
      playerRef.current.setSource(video.urls.manifests.hls);
    }
  }, [video?.urls?.manifests]);

  const oldTimedTextTracks = useRef(timedTextTracks);
  useEffect(() => {
    if (!playerRef.current) {
      return;
    }
    const playerApi = playerRef.current;

    // tracks to add
    timedTextTracks
      .filter(
        (track) =>
          !oldTimedTextTracks.current.includes(track) &&
          track.is_ready_to_show &&
          [timedTextMode.CLOSED_CAPTIONING, timedTextMode.SUBTITLE].includes(
            track.mode,
          ),
      )
      .forEach((track) => playerApi.addTrack(track, languages));
    // tracks to remove
    oldTimedTextTracks.current
      .filter(
        (track) =>
          !timedTextTracks.includes(track) &&
          track.is_ready_to_show &&
          [timedTextMode.CLOSED_CAPTIONING, timedTextMode.SUBTITLE].includes(
            track.mode,
          ),
      )
      .forEach((track) => playerApi.removeTrack(track));

    oldTimedTextTracks.current = timedTextTracks;
  }, [languages, timedTextTracks]);

  const resolutions = useMemo(() => {
    if (video?.urls?.mp4) {
      const tmpResolutions = Object.keys(video.urls.mp4).map(
        (size) => Number(size) as videoSize,
      );
      tmpResolutions.sort((a, b) => b - a);

      return tmpResolutions;
    }

    return [];
  }, [video?.urls?.mp4]);

  // The video is somehow missing and jwt must be set
  if (!video.urls) {
    throw new MissingVideoUrlsException('Urls are missing in the video.');
  }
  const urls = video.urls;

  /**
   * Thumbnail store is not associated to a video, so we need to refresh the
   * video if a thumbnail is deleted in the store to get the correct new thumbnail.
   */
  useEffect(() => {
    if (!thumbnail && video.thumbnail) {
      (async () => await queryClient.resetQueries(['videos', video.id]))();
    }
  }, [queryClient, thumbnail, video.id, video.thumbnail]);

  const thumbnailUrl = useMemo(() => {
    const thumbnailUrls =
      (thumbnail && thumbnail.is_ready_to_show && thumbnail.urls) ||
      video.urls?.thumbnails;

    const thumbnailUrl = thumbnailUrls && thumbnailUrls[resolutions[0]];

    if (containerVideoRef.current) {
      containerVideoRef.current
        .querySelector('.vjs-poster')
        ?.setAttribute(
          'style',
          thumbnailUrl ? `background-image: url(${thumbnailUrl});` : ``,
        );
    }

    return thumbnailUrl;
  }, [resolutions, thumbnail, video.urls?.thumbnails]);

  return (
    <Box ref={containerVideoRef}>
      <video
        ref={videoNodeRef}
        crossOrigin="anonymous"
        poster={thumbnailUrl}
        /* tabIndex is set to -1 to not take focus on this element when a user is navigating using
       their keyboard. */
        tabIndex={-1}
        playsInline
      >
        {resolutions.map((size, index) => (
          <source
            key={`url_${index}`}
            sizes={`${size}`}
            src={urls.mp4[size]}
            type="video/mp4"
          />
        ))}
      </video>
    </Box>
  );
};
